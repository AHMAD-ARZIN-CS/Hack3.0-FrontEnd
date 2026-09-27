/**
 * Marketplace models (D31). Status: LIVE (mock data + services/marketplace.ts).
 * Mirrors docs/DATA_CONTRACT.md §4. Change both together.
 *
 * Marketplace is a Discover subsection for student-to-student exchange of physical items:
 * textbooks, school supplies, clothing, appropriate electronics, other small items.
 * NOT here: notes/study material (Academic Exchange), housing (Housing), food (Food).
 *
 * Rules:
 * - No payments in the app. Buyer and seller agree and pay in person.
 * - Contact through a request. No phone, email, or address in listings or messages.
 * - Seller identity is a PublicUser. People are never rated.
 * - Profile shows a listing only when the seller turns it on (profileVisibility, default "hidden").
 */
import type { Attachment } from "./academic";
import type { CampusId, ListQuery, PublicUser } from "./models";
import type { Visibility } from "./profile";

export type ListingCategory = "textbook" | "supplies" | "clothing" | "electronics" | "dorm" | "other";

export type ItemCondition = "new" | "like-new" | "good" | "fair";

/** Seller-controlled lifecycle. "pending" = someone is picking it up. */
export type ListingStatus = "active" | "pending" | "sold";

/**
 * Moderation state, separate from the seller's status.
 * "visible": normal. "under-review" (NEEDS_REVIEW, Q25): a report flagged it; hidden from lists until a
 *   Student Hub Moderator keeps, restricts, or removes it (seller still sees it).
 * "removed": hidden from everyone except moderators.
 */
export type ModerationStatus = "visible" | "under-review" | "removed";

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  /** Joined public view of the seller. Never contact info. */
  seller: PublicUser;
  campusId: CampusId;
  title: string;
  category: ListingCategory;
  /** Plain text. No phone, email, address, or advance-payment requests (validated). */
  description: string;
  /** Integer cents. 0 = free. */
  priceCents: number;
  condition: ItemCondition;
  /** Photos of the item. Same Attachment shape as Academic. Empty when the seller adds none. */
  images: Attachment[];
  /** Optional textbook matching: "MTH 1". */
  courseCode?: string;
  isbn?: string;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  /**
   * Reports received (Q25). Tracked, but never decides anything on its own: moderators do.
   * Backend returns it to moderators and the seller only.
   */
  reportCount?: number;
  /** Show this listing on the seller's public profile. Default "hidden". */
  profileVisibility: Visibility;
  /** Per viewer: already sent a request for this listing. */
  viewerRequested?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface ListingQuery extends ListQuery {
  category?: ListingCategory;
  condition?: ItemCondition;
  /** 0 = free items only. */
  maxPriceCents?: number;
  /** Seller's own listings view. Includes pending, sold, and under-review for the owner. */
  sellerId?: string;
}

export interface NewListingInput {
  campusId: CampusId;
  title: string;
  category: ListingCategory;
  description: string;
  priceCents: number;
  condition: ItemCondition;
  courseCode?: string;
  isbn?: string;
  profileVisibility: Visibility;
}
