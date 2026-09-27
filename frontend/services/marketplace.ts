/**
 * Marketplace service (D31). The ONLY way UI gets marketplace data.
 *
 * mock mode: in-memory store from data/mock/marketplace.ts. Writes last until reload.
 * api mode:  DATA_CONTRACT §4 / §8. All endpoints require a signed-in student.
 *
 * Rules:
 * - Physical items only. Notes go to Academic, rooms to Housing, food to Food (config LISTING_RULES).
 * - No payments. No phone, email, address, advance payment, or shipping in text.
 * - Contact through a request. One request per listing per viewer.
 * - Lists show moderationStatus "visible" only. Sellers also see their own "under-review" listings.
 * - Blocked sellers are hidden from the viewer.
 * - Profile offerings come from listings with profileVisibility "public" (default hidden).
 */
import { DATA_MODE } from "@/config/app";
import { ADVANCE_PAYMENT_PATTERN, ITEM_CONDITIONS, LISTING_CATEGORIES, LISTING_RULES, MARKETPLACE_LIMITS } from "@/config/marketplace";
import { MOCK_LISTINGS, type MockListing } from "@/data/mock/marketplace";
import { CURRENT_USER_ID } from "@/data/mock/users";
import { addDays, startOfToday } from "@/lib/dates";
import { hasContactInfo, hasStreetAddress } from "@/lib/textSafety";
import { apiGet, apiPatch, apiPost } from "@/services/api/client";
import { mockPublicUser } from "@/services/authors";
import { isBlockedMock } from "@/services/blocks";
import { reportContent } from "@/services/reports";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging, matchesText } from "@/services/query";
import type {
  Attachment,
  ContactRequest,
  ListingQuery,
  ListingStatus,
  MarketplaceListing,
  NewListingInput,
  Paged,
  ProfileOffering,
  ReportReason,
  Visibility,
} from "@/types/models";

// ---------- in-memory mock store ----------
const listings: (MockListing & { createdAtIso?: string })[] = structuredClone(MOCK_LISTINGS);
const requests: ContactRequest[] = [];
let idCounter = 1;

export class MarketplaceValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    /** Where this content belongs instead, e.g. "/academic". */
    public href?: string,
  ) {
    super(message);
    this.name = "MarketplaceValidationError";
  }
}

function checkText(field: string, text: string) {
  if (hasContactInfo(text))
    throw new MarketplaceValidationError(field, "For your safety, don't include phone numbers or emails. Use Request to connect instead.");
  if (hasStreetAddress(text)) throw new MarketplaceValidationError(field, "Don't include an address. Meet on campus in a public place.");
  if (ADVANCE_PAYMENT_PATTERN.test(text))
    throw new MarketplaceValidationError(field, "Pay in person when you meet. Don't ask for deposits, advance payment, gift cards, or shipping.");
}

function checkRules(field: string, text: string) {
  const rule = LISTING_RULES.find((r) => r.pattern.test(text));
  if (rule) throw new MarketplaceValidationError(field, rule.message, rule.href);
}

function toListing(m: MockListing & { createdAtIso?: string }): MarketplaceListing {
  const { daysAgo, createdAtIso, ...rest } = m;
  return {
    ...rest,
    seller: mockPublicUser(m.sellerId),
    createdAt: createdAtIso ?? addDays(startOfToday(), -daysAgo).toISOString(),
    viewerRequested: requests.some((r) => r.targetId === m.id && r.fromUserId === CURRENT_USER_ID),
  };
}

function find(id: string) {
  const m = listings.find((x) => x.id === id);
  if (!m) throw new NotFoundError("Listing");
  return m;
}

function categoryLabel(id: string) {
  return LISTING_CATEGORIES.find((c) => c.id === id)?.label;
}

// ---------- reads ----------

export async function getListings(query: ListingQuery): Promise<Paged<MarketplaceListing>> {
  if (DATA_MODE === "api") return apiGet<Paged<MarketplaceListing>>("/listings", query);
  const ownView = query.sellerId === CURRENT_USER_ID;
  const items = listings
    .map(toListing)
    .filter((l) => {
      if (l.campusId !== query.campusId) return false;
      if (ownView) return l.sellerId === CURRENT_USER_ID && l.moderationStatus !== "removed";
      return (
        l.moderationStatus === "visible" &&
        (l.status === "active" || l.status === "pending") &&
        !isBlockedMock(l.sellerId) &&
        (!query.sellerId || l.sellerId === query.sellerId) &&
        (!query.category || l.category === query.category) &&
        (!query.condition || l.condition === query.condition) &&
        (query.maxPriceCents === undefined || l.priceCents <= query.maxPriceCents) &&
        (!query.verifiedOnly || l.seller.verifiedStudent) &&
        matchesText(query.q, l.title, l.description, l.courseCode, l.isbn, categoryLabel(l.category))
      );
    })
    // available first, then newest
    .sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "active" ? -1 : 1));
  return mockDelay(applyPaging(items, query));
}

/** Removed listings are never returned. Under-review listings only to their seller. */
export async function getListing(id: string): Promise<MarketplaceListing> {
  if (DATA_MODE === "api") return apiGet<MarketplaceListing>(`/listings/${encodeURIComponent(id)}`);
  const m = listings.find((x) => x.id === id);
  if (!m || m.moderationStatus === "removed" || (m.moderationStatus === "under-review" && m.sellerId !== CURRENT_USER_ID))
    throw new NotFoundError("Listing");
  return mockDelay(toListing(m));
}

// ---------- writes ----------

function validateImages(files: File[]) {
  if (files.length > MARKETPLACE_LIMITS.imagesMax) throw new MarketplaceValidationError("images", `Add up to ${MARKETPLACE_LIMITS.imagesMax} photos.`);
  for (const f of files) {
    if (!(MARKETPLACE_LIMITS.imageTypes as readonly string[]).includes(f.type))
      throw new MarketplaceValidationError("images", "Photos must be JPG, PNG, or WebP.");
    if (f.size > MARKETPLACE_LIMITS.imageMaxBytes) throw new MarketplaceValidationError("images", "Each photo must be under 5 MB.");
  }
}

/** Validates, then creates. Photos are optional. */
export async function createListing(input: NewListingInput, files: File[] = []): Promise<MarketplaceListing> {
  const title = input.title.trim();
  const description = input.description.trim();
  const courseCode = input.courseCode?.trim().toUpperCase() || undefined;
  const isbn = input.isbn?.replace(/[\s-]/g, "") || undefined;

  if (title.length < MARKETPLACE_LIMITS.titleMin) throw new MarketplaceValidationError("title", "Add a short title.");
  if (title.length > MARKETPLACE_LIMITS.titleMax) throw new MarketplaceValidationError("title", `Keep the title under ${MARKETPLACE_LIMITS.titleMax} characters.`);
  if (!LISTING_CATEGORIES.some((c) => c.id === input.category)) throw new MarketplaceValidationError("category", "Choose a category.");
  if (!ITEM_CONDITIONS.some((c) => c.id === input.condition)) throw new MarketplaceValidationError("condition", "Choose a condition.");
  if (description.length < MARKETPLACE_LIMITS.descriptionMin)
    throw new MarketplaceValidationError("description", `Write at least ${MARKETPLACE_LIMITS.descriptionMin} characters about the item.`);
  if (description.length > MARKETPLACE_LIMITS.descriptionMax) throw new MarketplaceValidationError("description", "Description is too long.");
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0 || input.priceCents > MARKETPLACE_LIMITS.priceMaxCents)
    throw new MarketplaceValidationError("price", "Enter a price from $0 (free) to $1,000.");
  if (courseCode && courseCode.length > 12) throw new MarketplaceValidationError("courseCode", "Course code looks too long. Example: MTH 1");
  if (isbn && !/^(\d{9}[\dX]|\d{13})$/i.test(isbn)) throw new MarketplaceValidationError("isbn", "ISBN should be 10 or 13 digits.");
  checkText("title", title);
  checkText("description", description);
  checkRules("title", title);
  checkRules("description", description);
  validateImages(files);

  const body: NewListingInput = { ...input, title, description, courseCode, isbn };
  if (DATA_MODE === "api") {
    // Photo upload needs a multipart endpoint (BACKEND_HANDOFF). Not wired yet, so fail loudly instead of dropping photos.
    if (files.length) throw new MarketplaceValidationError("images", "Photo upload isn't connected yet. Post without photos for now.");
    return apiPost<MarketplaceListing>("/listings", body);
  }

  const images: Attachment[] = files.map((f, i) => ({
    attachmentId: `img_${idCounter}_${i}`,
    fileName: f.name,
    fileType: f.type,
    fileSize: f.size,
    // Session-only local preview. The backend returns a hosted URL instead.
    previewUrl: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(f) : undefined,
  }));
  const created = {
    id: `ml_new_${idCounter++}`,
    sellerId: CURRENT_USER_ID,
    campusId: input.campusId,
    title,
    category: input.category,
    description,
    priceCents: input.priceCents,
    condition: input.condition,
    images,
    courseCode,
    isbn,
    status: "active" as const,
    moderationStatus: "visible" as const,
    profileVisibility: input.profileVisibility,
    daysAgo: 0,
    createdAtIso: new Date().toISOString(),
    isDemo: true,
  };
  listings.unshift(created);
  return mockDelay(toListing(created));
}

/** Seller-only: active ↔ pending → sold. Sold listings leave the list and the profile. */
export async function setListingStatus(id: string, status: ListingStatus): Promise<MarketplaceListing> {
  if (DATA_MODE === "api") return apiPatch<MarketplaceListing>(`/listings/${encodeURIComponent(id)}`, { status });
  const m = find(id);
  if (m.sellerId !== CURRENT_USER_ID) throw new MarketplaceValidationError("status", "Only the seller can change this.");
  m.status = status;
  if (status === "sold") m.profileVisibility = "hidden";
  return mockDelay(toListing(m), 120);
}

/** Seller-only. Controls whether this listing shows on the seller's public profile. */
export async function setListingProfileVisibility(id: string, visibility: Visibility): Promise<MarketplaceListing> {
  if (DATA_MODE === "api") return apiPatch<MarketplaceListing>(`/listings/${encodeURIComponent(id)}`, { profileVisibility: visibility });
  const m = find(id);
  if (m.sellerId !== CURRENT_USER_ID) throw new MarketplaceValidationError("visibility", "Only the seller can change this.");
  m.profileVisibility = visibility;
  return mockDelay(toListing(m), 120);
}

/** "Request to connect". No contact info or payment talk in the message. */
export async function sendListingRequest(id: string, message: string): Promise<ContactRequest> {
  const body = message.trim();
  if (!body) throw new MarketplaceValidationError("message", "Write a short hello first.");
  if (body.length > MARKETPLACE_LIMITS.messageMax) throw new MarketplaceValidationError("message", `Keep it under ${MARKETPLACE_LIMITS.messageMax} characters.`);
  checkText("message", body);
  if (DATA_MODE === "api") return apiPost<ContactRequest>("/contact-requests", { targetType: "listing", targetId: id, message: body });
  const m = find(id);
  if (m.moderationStatus !== "visible") throw new NotFoundError("Listing");
  if (m.sellerId === CURRENT_USER_ID) throw new MarketplaceValidationError("message", "This is your own listing.");
  if (isBlockedMock(m.sellerId)) throw new MarketplaceValidationError("message", "You blocked this seller. Unblock them to send a request.");
  if (m.status !== "active") throw new MarketplaceValidationError("message", m.status === "sold" ? "This item is sold." : "Someone is already picking this up.");
  if (requests.some((r) => r.targetId === id && r.fromUserId === CURRENT_USER_ID))
    throw new MarketplaceValidationError("message", "You already sent a request for this item.");
  const req: ContactRequest = {
    id: `cr_ml_${idCounter++}`,
    targetType: "listing",
    targetId: id,
    fromUserId: CURRENT_USER_ID,
    message: body,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  return mockDelay(req, 200);
}

/**
 * Report a listing (Q25). The report is recorded; in the demo one report flags the listing
 * NEEDS_REVIEW ("under-review") so it leaves public lists until a Student Hub Moderator decides
 * keep / restrict / remove. Nothing is ever deleted because of a report count.
 */
export async function reportListing(id: string, reason: ReportReason, details?: string): Promise<{ id: string }> {
  const receipt = await reportContent({ targetType: "marketplace-listing", targetId: id, reason, details });
  if (DATA_MODE === "api") return receipt; // backend owns flagging
  const m = find(id);
  m.reportCount = (m.reportCount ?? 0) + 1;
  if (m.moderationStatus === "visible") m.moderationStatus = "under-review";
  return receipt;
}

// ---------- profile integration (mock) ----------

/**
 * Marketplace offerings on a profile. Public view: active listings the seller made public.
 * Own view: every active listing, so the owner can switch each one on or off.
 */
export function mockMarketplaceOfferings(userId: string, view: "own" | "public"): ProfileOffering[] {
  return listings
    .filter(
      (l) =>
        l.sellerId === userId &&
        l.status === "active" &&
        l.moderationStatus === "visible" &&
        (view === "own" || l.profileVisibility === "public"),
    )
    .map((l) => ({
      id: `off_listing_${l.id}`,
      category: "marketplace",
      direction: "offering" as const,
      label: l.priceCents === 0 ? `Giving away: ${l.title}` : `Selling: ${l.title}`,
      link: { type: "marketplace-listing" as const, id: l.id },
      visibility: l.profileVisibility,
    }));
}
