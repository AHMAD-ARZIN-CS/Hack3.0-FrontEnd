/**
 * Profile / reputation models. Status: LIVE (mock data + services/profiles.ts).
 * Mirrors docs/DATA_CONTRACT.md §7b. Change both together.
 *
 * Rules (DECISIONS D21, D22, D24):
 * - Reputation comes from observable, useful contributions. People are never rated.
 * - Tags are split by category. No single generic tag array.
 * - Offerings (incl. housing status) are hidden unless the user makes them public.
 * - Never in a profile: email, phone, student ID, grades, residential address.
 */
import type { CampusId, PublicUser } from "./models";

export type Visibility = "public" | "hidden";

// ---------- Tag categories (ids come from config/tags.ts) ----------

/** ACADEMIC tags are courses (Course.id). Split by current vs previously taken. */
export interface ProfileAcademic {
  currentCourseIds: string[];
  pastCourseIds: string[];
}

/** INTERESTS: personal interests ("soccer", "hiking", "programming"). Ids from INTEREST_TAGS. */
export type InterestTagId = string;

/** MARKETPLACE: categories a student exchanges ("books", "supplies"). Ids from MARKETPLACE_TAGS. */
export type MarketplaceTagId = string;

/** NEEDS / OFFERINGS categories ("housing", "food", "study-group", "tutoring"). Ids from OFFERING_CATEGORIES. */
export type OfferingCategoryId = string;

/**
 * A need or offering the user chooses to show. Replaces ActiveOffering (contract v0.5).
 * Details (addresses, prices, schedules) live on the linked feature page, never here.
 */
export interface ProfileOffering {
  id: string;
  category: OfferingCategoryId;
  direction: "seeking" | "offering";
  /** General label only: "Looking for roommate", "Housing available", "Offering calculus tutoring". */
  label: string;
  /** Where details live, e.g. { type: "housing-post", id } */
  link?: { type: "housing-post" | "marketplace-listing" | "academic-resource" | "study-group"; id: string };
  /** Default "hidden". Public profile responses include only "public" offerings. */
  visibility: Visibility;
}

// ---------- Reputation ----------

export interface Badge {
  id: string; // "first-resource", "helpful-10"
  name: string;
  description: string;
  earnedAt?: string;
}

/**
 * Counts of meaningful contributions, derived from ContributionEvents (D32).
 * Only approved / verified / recognized actions count.
 * Logins, screen time, raw post counts, reactions, and unapproved content never count.
 */
export interface ContributionStats {
  resourcesApproved: number; // AcademicResources approved
  tipsApproved: number; // AcademicTips approved
  helpfulVotesReceived: number; // on the user's content, from other students (per-voter cap applies to points, not this count)
  studentsHelped: number; // distinct students who marked any contribution helpful
  communityPostsHelpful: number; // community posts (question, discussion, resource share, study group) another student marked helpful
  communityAnswersHelpful: number; // comments a question's author marked as the helpful answer (Q18)
  verifiedResources: number; // resource directory entries verified by staff. No source yet, always 0
  verifiedExchanges: number; // exchanges confirmed by both sides. No source yet, always 0
}

export type ContributionType =
  | "academic-resource"
  | "academic-tip"
  | "community-post"
  | "community-answer"
  | "verified-resource"
  | "verified-exchange";

// ---------- Contribution events (D32) ----------

/**
 * One helpful thing a person did, recorded once. Reputation, stats, badges, the graph,
 * and history are all computed from these. Nothing else earns points.
 */
export type ContributionEventType =
  | "academic-resource-approved" // a reviewer approved their academic resource
  | "academic-tip-approved" // their tip was approved
  | "helpful-vote-received" // another student marked their content helpful
  | "community-post-helpful" // one of their community posts got its first helpful mark from another student
  | "community-answer-helpful" // a question's author marked their comment as the helpful answer (Q18)
  | "verified-resource-contribution" // staff verified a resource they submitted (no source yet)
  | "verified-exchange"; // both sides confirmed an exchange (no source yet)

export type ContributionSourceType =
  | "academic-resource"
  | "academic-tip"
  | "community-post"
  | "community-comment"
  | "resource"
  | "marketplace-listing";

export interface ContributionEvent {
  id: string;
  /** Who earns credit. */
  userId: string;
  type: ContributionEventType;
  sourceType: ContributionSourceType;
  sourceId: string;
  /**
   * Who caused it (the voter, the reviewer, the other side of an exchange).
   * Backend-internal: used for "students helped" and anti-gaming caps. Never sent in public responses.
   */
  actorId?: string;
  /** Display context, copied at event time. */
  title?: string;
  courseId?: string;
  kind?: string; // notes / study-guide / practice / study-strategy / tip / postType
  /** Where the source lives, when it's nested: a comment's post id. */
  parentId?: string;
  occurredAt: string;
  isDemo?: boolean;
}

/** One day of the contribution graph. Only meaningful events are counted (see DATA_CONTRACT). */
export interface ContributionDay {
  date: string; // "2026-09-26" (local date, no time)
  count: number;
  byType?: Partial<Record<ContributionType, number>>;
}

export interface ContributionActivity {
  userId: string;
  startDate: string; // first day in range
  endDate: string; // last day in range
  days: ContributionDay[]; // only days with count > 0 are required
  total: number;
}

/** One item of contribution history. */
export interface Contribution {
  type: ContributionType;
  id: string;
  title: string;
  courseId?: string;
  kind?: string; // notes / study-guide / practice / tip
  /** For answers: the question's post id (link target). */
  parentId?: string;
  helpfulCount?: number;
  createdAt: string;
}

// ---------- Profile ----------

export interface UserProfile extends PublicUser {
  major?: string; // free text, optional: "Computer Science (transfer track)"
  bio?: string; // max 200 chars, no contact info
  academic: ProfileAcademic;
  interests: InterestTagId[];
  marketplaceCategories: MarketplaceTagId[];
  /** Public view: only visibility "public". Own view: all. */
  offerings: ProfileOffering[];
  stats: ContributionStats;
  points: number;
  level: number;
  levelName: string;
  /** Points needed for next level, undefined at max level. */
  nextLevelAt?: number;
  badges: Badge[];
  /** Most recent first. Public view may be truncated. */
  recentContributions: Contribution[];
  joinedAt: string; // month precision is enough
  isDemo?: boolean;
}

export interface ProfileUpdateInput {
  major?: string;
  bio?: string;
  academic?: Partial<ProfileAcademic>;
  interests?: InterestTagId[];
  marketplaceCategories?: MarketplaceTagId[];
  homeCampusId?: CampusId;
}
