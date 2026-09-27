/**
 * Food deals service. The ONLY way UI gets surplus-food deals.
 * Free food help (pantries, CalFresh, food banks) comes from services/resources.ts.
 *
 * mock mode: in-memory store from data/mock/food.ts. Holds last until reload.
 * api mode:  GET /food-deals, GET /food-deals/:id, POST /food-deals/:id/claims, POST /claims/:id/cancel.
 *
 * Rules: no payments in the app (F11). A hold reserves food; the student pays the business at pickup.
 * One active hold per deal per student. Ended deals are never listed.
 */
import { DATA_MODE } from "@/config/app";
import { FOOD_HOLD_MINUTES, FOOD_MAX_PER_CLAIM } from "@/config/food";
import { MOCK_FOOD_DEALS, type MockFoodDeal } from "@/data/mock/food";
import { CURRENT_USER_ID } from "@/data/mock/users";
import { apiGet, apiPost } from "@/services/api/client";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging } from "@/services/query";
import type { FoodDeal, FoodDealClaim, FoodDealQuery, Paged } from "@/types/models";

const deals: MockFoodDeal[] = structuredClone(MOCK_FOOD_DEALS);
const claims: FoodDealClaim[] = [];
let idCounter = 1;

export class FoodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FoodError";
  }
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
/** Snap to 15 minutes so demo times look like real pickup windows. Start rounds down, end rounds up, so "now" stays inside the window. */
const quarterDown = (d: Date) => new Date(Math.floor(d.getTime() / 900_000) * 900_000).toISOString();
const quarterUp = (d: Date) => new Date(Math.ceil(d.getTime() / 900_000) * 900_000).toISOString();

function activeClaim(dealId: string): FoodDealClaim | undefined {
  return claims.find((c) => c.dealId === dealId && c.userId === CURRENT_USER_ID && c.status === "held" && new Date(c.holdExpiresAt) > new Date());
}

function toDeal(m: MockFoodDeal): FoodDeal {
  const { startsInHours, endsInHours, ...rest } = m;
  const end = new Date(quarterUp(hoursFromNow(endsInHours)));
  const status: FoodDeal["status"] = end <= new Date() ? "expired" : m.quantityAvailable <= 0 ? "sold-out" : "available";
  return {
    ...rest,
    pickupStart: quarterDown(hoursFromNow(startsInHours)),
    pickupEnd: end.toISOString(),
    status,
    viewerClaim: activeClaim(m.id),
  };
}

export async function getFoodDeals(query: FoodDealQuery): Promise<Paged<FoodDeal>> {
  if (DATA_MODE === "api") return apiGet<Paged<FoodDeal>>("/food-deals", query);
  const now = new Date().toISOString();
  const items = deals
    .map(toDeal)
    .filter(
      (d) =>
        d.campusId === query.campusId &&
        d.status !== "expired" &&
        (query.maxDistanceMiles === undefined || (d.distanceMiles ?? Infinity) <= query.maxDistanceMiles) &&
        (query.maxPriceCents === undefined || d.studentPriceCents <= query.maxPriceCents) &&
        (!query.availableNow || (d.status === "available" && d.pickupStart <= now && d.pickupEnd > now)) &&
        (!query.dietaryTag || (d.dietaryTags ?? []).includes(query.dietaryTag)),
    )
    // available first, then soonest pickup
    .sort((a, b) => (a.status === b.status ? a.pickupStart.localeCompare(b.pickupStart) : a.status === "available" ? -1 : 1));
  return mockDelay(applyPaging(items, query));
}

export async function getFoodDeal(id: string): Promise<FoodDeal> {
  if (DATA_MODE === "api") return apiGet<FoodDeal>(`/food-deals/${encodeURIComponent(id)}`);
  const m = deals.find((d) => d.id === id);
  if (!m) throw new NotFoundError("Deal");
  return mockDelay(toDeal(m));
}

/** "I want this": holds food for FOOD_HOLD_MINUTES. No payment. */
export async function claimFoodDeal(dealId: string, quantity: number): Promise<FoodDealClaim> {
  if (quantity < 1 || quantity > FOOD_MAX_PER_CLAIM) throw new FoodError(`You can hold 1 to ${FOOD_MAX_PER_CLAIM}.`);
  if (DATA_MODE === "api") return apiPost<FoodDealClaim>(`/food-deals/${encodeURIComponent(dealId)}/claims`, { quantity });
  const m = deals.find((d) => d.id === dealId);
  if (!m) throw new NotFoundError("Deal");
  const d = toDeal(m);
  if (d.status === "expired") throw new FoodError("This pickup window has ended.");
  if (d.status === "sold-out" || m.quantityAvailable < quantity) throw new FoodError("Not enough left. Try a smaller amount or another deal.");
  if (activeClaim(dealId)) throw new FoodError("You already have a hold on this deal.");
  m.quantityAvailable -= quantity;
  const now = new Date();
  const holdEnd = new Date(Math.min(now.getTime() + FOOD_HOLD_MINUTES * 60_000, new Date(d.pickupEnd).getTime()));
  const claim: FoodDealClaim = {
    id: `claim_${idCounter++}`,
    dealId,
    userId: CURRENT_USER_ID,
    quantity,
    status: "held",
    holdExpiresAt: holdEnd.toISOString(),
    pickupCode: `EBL-${String(1000 + ((idCounter * 7919) % 9000)).padStart(4, "0")}`,
    createdAt: now.toISOString(),
  };
  claims.push(claim);
  return mockDelay(claim, 200);
}

export async function cancelFoodClaim(claimId: string): Promise<FoodDealClaim> {
  if (DATA_MODE === "api") return apiPost<FoodDealClaim>(`/claims/${encodeURIComponent(claimId)}/cancel`);
  const c = claims.find((x) => x.id === claimId && x.userId === CURRENT_USER_ID);
  if (!c) throw new NotFoundError("Hold");
  if (c.status === "held") {
    c.status = "cancelled";
    const m = deals.find((d) => d.id === c.dealId);
    if (m) m.quantityAvailable += c.quantity;
  }
  return mockDelay(c, 150);
}
