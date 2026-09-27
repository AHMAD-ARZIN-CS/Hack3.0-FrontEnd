/**
 * Housing service. The ONLY way UI gets housing data.
 *
 * mock mode: in-memory store from data/mock/housing.ts. Writes last until reload.
 * api mode:  DATA_CONTRACT §5 / §8 (all housing endpoints require a signed-in student).
 *
 * Rules (D22, D28):
 * - Approximate area only. No addresses, phone numbers, emails, or payment requests.
 * - Lifestyle preferences only (no protected traits).
 * - Contact through a request, never by sharing contact info.
 * - HousingPost.profileVisibility is the single source of truth for housing status on profiles.
 * - No deposits or payments in the app.
 */
import { DATA_MODE } from "@/config/app";
import { HOUSING_AMENITIES, HOUSING_AREAS, HOUSING_LIMITS, HOUSING_PREFERENCES } from "@/config/housing";
import { MOCK_HOUSING, type MockHousingPost } from "@/data/mock/housing";
import { CURRENT_USER_ID, MOCK_USERS } from "@/data/mock/users";
import { addDays, startOfToday, toDateKey } from "@/lib/dates";
import { hasContactInfo, hasStreetAddress } from "@/lib/textSafety";
import { apiGet, apiPatch, apiPost } from "@/services/api/client";
import { mockPublicUser } from "@/services/authors";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging } from "@/services/query";
import type {
  ContactRequest,
  HousingPost,
  HousingQuery,
  NewHousingPostInput,
  Paged,
  ProfileOffering,
  Visibility,
} from "@/types/models";

// ---------- in-memory mock store ----------
const posts: MockHousingPost[] = structuredClone(MOCK_HOUSING);
const requests: ContactRequest[] = [];
let idCounter = 1;

export class HousingValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "HousingValidationError";
  }
}

/** Blocks the most common ways people leak contact info or ask for money in free text. */
const PAYMENT = /\b(deposit|venmo|zelle|cash ?app|paypal|wire|gift card|send (me )?money)\b/i;

function checkFreeText(field: string, text: string) {
  if (hasContactInfo(text))
    throw new HousingValidationError(field, "For your safety, don't include phone numbers or emails. Share contact info only after you both agree to talk.");
  if (hasStreetAddress(text)) throw new HousingValidationError(field, "Don't include a street address. The approximate area is enough.");
  if (PAYMENT.test(text)) throw new HousingValidationError(field, "East Bay Link doesn't handle deposits or payments. Please remove payment requests.");
}

function toPost(m: MockHousingPost): HousingPost {
  const { daysAgo, availableInDays, ...rest } = m;
  const area = HOUSING_AREAS.find((a) => a.id === m.areaId);
  const today = startOfToday();
  return {
    ...rest,
    author: mockPublicUser(m.authorId),
    areaName: area?.name ?? "Nearby",
    distanceMiles: area?.milesFrom[m.campusId],
    availableFrom: toDateKey(addDays(today, availableInDays)),
    createdAt: addDays(today, -daysAgo).toISOString(),
    viewerRequested: requests.some((r) => r.targetId === m.id && r.fromUserId === CURRENT_USER_ID),
    viewerRequestStatus: requests.find((r) => r.targetId === m.id && r.fromUserId === CURRENT_USER_ID)?.status,
  };
}

function find(id: string): MockHousingPost {
  const p = posts.find((x) => x.id === id);
  if (!p) throw new NotFoundError("Housing post");
  return p;
}

// ---------- reads ----------

export async function getHousingPosts(query: HousingQuery): Promise<Paged<HousingPost>> {
  if (DATA_MODE === "api") return apiGet<Paged<HousingPost>>("/housing", query);
  const items = posts
    .map(toPost)
    .filter(
      (p) =>
        p.campusId === query.campusId &&
        p.status === "active" &&
        (!query.type || p.type === query.type) &&
        (!query.authorId || p.authorId === query.authorId) &&
        (!query.roomType || p.roomType === query.roomType) &&
        (!query.verifiedOnly || p.verifiedStudent) &&
        (query.maxPriceCents === undefined || (p.monthlyRentCents ?? p.budgetMaxCents ?? 0) <= query.maxPriceCents) &&
        (query.maxDistanceMiles === undefined || (p.distanceMiles ?? Infinity) <= query.maxDistanceMiles) &&
        (!query.availableBy || p.availableFrom <= query.availableBy),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mockDelay(applyPaging(items, query));
}

/** Active posts for everyone. Authors can also see their own closed posts. */
export async function getHousingPost(id: string): Promise<HousingPost> {
  if (DATA_MODE === "api") return apiGet<HousingPost>(`/housing/${encodeURIComponent(id)}`);
  const m = posts.find((x) => x.id === id);
  if (!m || (m.status !== "active" && m.authorId !== CURRENT_USER_ID)) throw new NotFoundError("Housing post");
  return mockDelay(toPost(m));
}

// ---------- writes ----------

export async function createHousingPost(input: NewHousingPostInput): Promise<HousingPost> {
  const title = input.title.trim();
  const description = input.description.trim();
  const area = HOUSING_AREAS.find((a) => a.id === input.areaId);
  if (!title) throw new HousingValidationError("title", "Add a short title.");
  if (title.length > HOUSING_LIMITS.titleMax) throw new HousingValidationError("title", `Keep the title under ${HOUSING_LIMITS.titleMax} characters.`);
  if (description.length < HOUSING_LIMITS.descriptionMin) throw new HousingValidationError("description", `Write at least ${HOUSING_LIMITS.descriptionMin} characters.`);
  if (description.length > HOUSING_LIMITS.descriptionMax) throw new HousingValidationError("description", "Description is too long.");
  checkFreeText("title", title);
  checkFreeText("description", description);
  if (!area || area.milesFrom[input.campusId] === undefined) throw new HousingValidationError("areaId", "Choose an approximate area.");
  if (!Number.isFinite(input.priceCents) || input.priceCents < HOUSING_LIMITS.priceMinCents || input.priceCents > HOUSING_LIMITS.priceMaxCents)
    throw new HousingValidationError("price", "Enter a monthly amount between $100 and $5,000.");
  if (!input.availableFrom) throw new HousingValidationError("availableFrom", "Choose a date.");
  const amenities = (input.amenities ?? []).filter((a) => HOUSING_AMENITIES.some((x) => x.id === a));
  const preferences = (input.preferences ?? []).filter((p) => HOUSING_PREFERENCES.some((x) => x.id === p));

  if (DATA_MODE === "api") return apiPost<HousingPost>("/housing", { ...input, title, description, amenities, preferences });

  const me = MOCK_USERS.find((u) => u.base.id === CURRENT_USER_ID)!.base;
  const today = startOfToday();
  const days = Math.max(0, Math.round((new Date(`${input.availableFrom}T00:00:00`).getTime() - today.getTime()) / 86_400_000));
  const created: MockHousingPost = {
    id: `hp_new_${idCounter++}`,
    authorId: me.id,
    campusId: input.campusId,
    type: input.type,
    title,
    description,
    areaId: area.id,
    monthlyRentCents: input.type === "room-available" ? input.priceCents : undefined,
    budgetMaxCents: input.type === "looking-for-roommate" ? input.priceCents : undefined,
    availableInDays: days,
    leaseLengthMonths: input.leaseLengthMonths,
    roomType: input.roomType,
    amenities: input.type === "room-available" ? amenities : [],
    preferences,
    verifiedStudent: me.verifiedStudent,
    status: "active",
    profileVisibility: input.profileVisibility,
    daysAgo: 0,
    isDemo: true,
  };
  posts.unshift(created);
  return mockDelay(toPost(created));
}

/** Owner-only. Controls the general housing status on the owner's public profile. */
export async function setHousingProfileVisibility(postId: string, visibility: Visibility): Promise<HousingPost> {
  if (DATA_MODE === "api") return apiPatch<HousingPost>(`/housing/${encodeURIComponent(postId)}/visibility`, { profileVisibility: visibility });
  const m = find(postId);
  if (m.authorId !== CURRENT_USER_ID) throw new HousingValidationError("visibility", "Only the owner can change this.");
  m.profileVisibility = visibility;
  return mockDelay(toPost(m), 120);
}

/** Owner-only: mark a post as filled. */
export async function closeHousingPost(postId: string): Promise<HousingPost> {
  if (DATA_MODE === "api") return apiPost<HousingPost>(`/housing/${encodeURIComponent(postId)}/close`);
  const m = find(postId);
  if (m.authorId !== CURRENT_USER_ID) throw new HousingValidationError("close", "Only the owner can close this post.");
  m.status = "closed";
  m.profileVisibility = "hidden";
  return mockDelay(toPost(m), 120);
}

/** "Request to connect". No contact info in the message. One request per post per viewer. */
export async function sendHousingRequest(postId: string, message: string): Promise<ContactRequest> {
  const body = message.trim();
  if (!body) throw new HousingValidationError("message", "Write a short hello first.");
  if (body.length > HOUSING_LIMITS.messageMax) throw new HousingValidationError("message", `Keep it under ${HOUSING_LIMITS.messageMax} characters.`);
  checkFreeText("message", body);
  if (DATA_MODE === "api") return apiPost<ContactRequest>("/contact-requests", { targetType: "housing", targetId: postId, message: body });
  const m = find(postId);
  if (m.status !== "active") throw new NotFoundError("Housing post");
  if (m.authorId === CURRENT_USER_ID) throw new HousingValidationError("message", "This is your own post.");
  if (requests.some((r) => r.targetId === postId && r.fromUserId === CURRENT_USER_ID))
    throw new HousingValidationError("message", "You already sent a request for this post.");
  const req: ContactRequest = {
    id: `cr_${idCounter++}`,
    targetType: "housing",
    targetId: postId,
    fromUserId: CURRENT_USER_ID,
    message: body,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  return mockDelay(req, 200);
}

/**
 * DEMO ONLY (Q22): stands in for the other student tapping "Accept". The real flow is the post
 * owner accepting in their request inbox (not built). Nothing is revealed on accept: no phone, no email.
 * Both students choosing how to keep talking (in-app messaging) is future work.
 */
export async function simulateHousingAcceptedMock(postId: string): Promise<ContactRequest> {
  if (DATA_MODE === "api") throw new HousingValidationError("request", "The other student accepts from their own account.");
  const r = requests.find((x) => x.targetId === postId && x.fromUserId === CURRENT_USER_ID);
  if (!r) throw new NotFoundError("Request");
  r.status = "accepted";
  return mockDelay(r, 150);
}

// ---------- profile integration (mock) ----------

/**
 * Housing offerings shown on a profile, derived from the user's active housing posts.
 * Public view: only posts with profileVisibility "public". Own view: all active posts.
 * General label only. Details stay on the housing page.
 */
export function mockHousingOfferings(userId: string, view: "own" | "public"): ProfileOffering[] {
  return posts
    .filter((p) => p.authorId === userId && p.status === "active" && (view === "own" || p.profileVisibility === "public"))
    .map((p) => ({
      id: `off_housing_${p.id}`,
      category: "housing",
      direction: p.type === "room-available" ? ("offering" as const) : ("seeking" as const),
      label: p.type === "room-available" ? "Housing available" : "Looking for roommate",
      link: { type: "housing-post" as const, id: p.id },
      visibility: p.profileVisibility,
    }));
}
