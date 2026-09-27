/**
 * Student Hub frontend data models.
 * Source of truth for the shape of data the UI consumes.
 * Mirrors docs/DATA_CONTRACT.md. Change both together.
 *
 * Conventions:
 * - ids are strings
 * - dates are ISO 8601 strings (UTC), e.g. "2026-09-26T18:00:00Z"
 * - money is integer cents (USD) to avoid float errors
 * - optional fields use `?`
 * - isDemo marks mock/demonstration records
 *
 * Status per model: see docs/DATA_CONTRACT.md "Model status legend".
 * Academic + profile models live in ./academic.ts and ./profile.ts and are re-exported at the bottom.
 * Marketplace models: ./marketplace.ts (D31). Community models: ./community.ts (D25).
 */

// ---------- Shared ----------

export type CampusId = string; // "chabot" | "dvc" | "csueb" today; open for more

export interface Campus {
  id: CampusId;
  name: string; // "Chabot College"
  shortName: string; // "Chabot"
  city: string; // "Hayward"
  /** Approximate campus center, used only for campus-relative distance. */
  center: { lat: number; lng: number };
  websiteUrl?: string;
}

export type NeedId =
  | "study"
  | "food"
  | "housing"
  | "money"
  | "community"
  | "safety";

export type ResourceCategory =
  | "food"
  | "housing"
  | "financial"
  | "academic"
  | "transportation"
  | "safety"
  | "health"
  | "campus-services";

export interface Paged<T> {
  items: T[];
  total: number;
  page: number; // 1-based
  pageSize: number;
}

export interface ListQuery {
  campusId: CampusId;
  q?: string; // free-text search
  page?: number;
  pageSize?: number;
  verifiedOnly?: boolean;
}

/** Minimal public view of a person. Never contains contact info. */
export interface PublicUser {
  id: string;
  displayName: string; // first name + last initial
  campusId: CampusId;
  verifiedStudent: boolean;
  avatarUrl?: string;
  /** Contribution level (D21). Shown next to author names. */
  level?: number;
  /** Who this person is on the platform. Default "student" (D25). */
  role?: AuthorRole;
  /**
   * Faculty/staff/organization role confirmed by a review process (D25).
   * An institutional email alone does NOT set this.
   */
  roleVerified?: boolean;
  /** "Mathematics instructor", "Transfer counselor", "Student club". */
  roleTitle?: string;
}

export type AuthorRole = "student" | "faculty-staff" | "organization";

// ---------- Resources ----------

export interface Resource {
  id: string;
  campusId: CampusId | "regional"; // "regional" = county/community resource, not owned by one campus
  /** For regional resources: which campuses it is relevant to. Omit = all campuses (e.g. 911, FAFSA). */
  servesCampusIds?: CampusId[];
  title: string;
  category: ResourceCategory;
  /** Student-language needs this resource answers. Drives Home → Resources. */
  needs: NeedId[];
  description: string;
  provider: string; // "Chabot College Basic Needs Center", "Alameda County ..."
  url: string; // official page
  locationName?: string; // "Building 2400, Room 2410"
  address?: string; // public office address only, never a person's address
  phone?: string; // public office line only
  hours?: string; // free text for MVP
  eligibility?: string;
  onCampus: boolean;
  verified: boolean; // info checked against the official source
  /** Official page the facts were checked against (Q7). Real resources only. Never invented. */
  sourceUrl?: string;
  /** When someone last checked the facts against sourceUrl. */
  lastVerifiedAt?: string;
  isEmergency?: boolean; // safety: show call-out styling
  isDemo?: boolean;
}

export interface ResourceQuery extends ListQuery {
  category?: ResourceCategory;
  need?: NeedId;
  onCampus?: boolean;
}

// ---------- Food deals ----------

export interface Business {
  id: string;
  name: string;
  campusIds: CampusId[];
  cuisine?: string;
  areaName: string; // "Downtown Hayward"
  address?: string; // public business address
  verifiedBusiness: boolean;
  isDemo?: boolean;
}

export interface FoodDeal {
  id: string;
  restaurantId: string;
  restaurantName: string;
  campusId: CampusId;
  title: string; // "Surplus bento box"
  description?: string;
  imageUrl?: string;
  originalPriceCents: number;
  studentPriceCents: number;
  quantityAvailable: number;
  pickupStart: string; // ISO
  pickupEnd: string; // ISO
  pickupAreaName: string; // "Downtown Hayward"
  distanceMiles?: number; // approx, from campus center
  dietaryTags?: string[]; // "vegetarian", "halal"
  verified: boolean; // business verified (demo businesses: false)
  status: "available" | "sold-out" | "expired";
  cuisine?: string;
  /** Per viewer: their active hold on this deal, if any. */
  viewerClaim?: FoodDealClaim;
  isDemo?: boolean;
}

export interface FoodDealQuery extends ListQuery {
  maxDistanceMiles?: number;
  maxPriceCents?: number;
  availableNow?: boolean;
  dietaryTag?: string;
}

/** Student taps "I want this". No payment in MVP. */
export interface FoodDealClaim {
  id: string;
  dealId: string;
  userId: string;
  quantity: number;
  status: "held" | "picked-up" | "cancelled" | "expired";
  holdExpiresAt: string;
  /** Short code the student shows at pickup. No payment in the app. */
  pickupCode: string;
  createdAt: string;
}

// ---------- Marketplace ----------
// Models in ./marketplace.ts (D31), re-exported at the bottom.

// ---------- Housing (privacy-sensitive, DATA_CONTRACT §5, D28) ----------

/** "room-available" = I have housing / need a roommate. "looking-for-roommate" = I need housing. */
export type HousingPostType = "room-available" | "looking-for-roommate";
export type RoomType = "private" | "shared";

export interface HousingPost {
  id: string;
  authorId: string;
  author: PublicUser;
  campusId: CampusId;
  type: HousingPostType;
  title: string;
  description: string; // plain text. No address, phone, email, deposits (validated)
  /** Approximate area id + name from config/housing.ts. NEVER a street address. */
  areaId: string;
  areaName: string;
  distanceMiles?: number; // approximate, from campus center, rounded to 0.5
  monthlyRentCents?: number; // room-available
  budgetMaxCents?: number; // looking-for-roommate
  availableFrom: string; // ISO date: move-in / available date
  leaseLengthMonths?: number;
  roomType?: RoomType;
  /** Fixed list (config HOUSING_AMENITIES). room-available only. */
  amenities: string[];
  /** Lifestyle only (config HOUSING_PREFERENCES). Never protected traits (fair housing). */
  preferences: string[];
  verifiedStudent: boolean;
  status: "active" | "closed" | "removed";
  /** Show a general status on the author's public profile. Default "hidden" (D22). Source of truth for profile housing offerings. */
  profileVisibility: "public" | "hidden";
  /** Per viewer: already sent a connect request. */
  viewerRequested?: boolean;
  /** Per viewer: state of that request (Q22). "accepted" ends the demo flow; messaging is future work. */
  viewerRequestStatus?: "sent" | "accepted" | "declined";
  createdAt: string;
  isDemo?: boolean;
}

export interface HousingQuery extends ListQuery {
  type?: HousingPostType;
  /** Max monthly price: rent for rooms, budget for seekers. */
  maxPriceCents?: number;
  maxDistanceMiles?: number;
  roomType?: RoomType;
  /** ISO date. Posts available on or before this date. */
  availableBy?: string;
  authorId?: string;
}

export interface NewHousingPostInput {
  campusId: CampusId;
  type: HousingPostType;
  title: string;
  description: string;
  areaId: string;
  priceCents: number; // rent (room-available) or max budget (looking-for-roommate)
  availableFrom: string; // YYYY-MM-DD
  leaseLengthMonths?: number;
  roomType?: RoomType;
  amenities?: string[];
  preferences?: string[];
  profileVisibility: "public" | "hidden";
}

// ---------- Contact (used by marketplace + housing) ----------

/** Replaces sharing phone/email. Recipient chooses whether to reply. */
export interface ContactRequest {
  id: string;
  targetType: "listing" | "housing";
  /** Housing: the post id. The recipient is the post author. */
  targetId: string;
  fromUserId: string;
  message: string; // short, templated in MVP
  status: "sent" | "accepted" | "declined";
  createdAt: string;
}

// ---------- Community ----------

export interface StudyGroup {
  id: string;
  campusId: CampusId;
  name: string;
  courseCode?: string;
  description: string;
  meetingInfo: string; // "Tue 4pm, Library 2nd floor" or "Discord"
  memberCount: number;
  isMember?: boolean; // per-viewer
  isDemo?: boolean;
}

export interface CampusEvent {
  id: string;
  campusId: CampusId;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  locationName: string;
  url?: string; // official event page
  source: "official" | "student";
  interestedCount: number;
  isInterested?: boolean; // per-viewer
  isDemo?: boolean;
}

// Post, PostType, Comment etc. live in ./community.ts (contract v0.6).

// ---------- Current user ----------

/** Private view of the signed-in user. Mock user in MVP. */
export interface CurrentUser extends PublicUser {
  homeCampusId: CampusId;
  // email is held by the auth provider, not exposed through this model
}

// ---------- Re-exports (split per domain, ARCHITECTURE §12.1) ----------
export * from "./academic";
export * from "./profile";
export * from "./community";
export * from "./marketplace";
export * from "./auth";
