/**
 * Community models. Status: LIVE (mock + services/community.ts). Contract v0.6 §6.
 *
 * Principles (D25):
 * - Human, campus-local, useful. Not a marketplace feed. Listings are never auto-posted here.
 * - Posts can LINK to entities elsewhere in the app (study guide, resource, opportunity...).
 * - Faculty/staff and organization posts are individuals/groups posting, not official college statements.
 * - Moderation-ready: status, reports, blocking.
 */
import type { CampusId, PublicUser } from "./models";

/**
 * 7 types. "announcement" is only for verified faculty/staff or organizations.
 * Everything else is open to students.
 */
export type PostType =
  | "question"
  | "discussion"
  | "resource-share"
  | "study-group"
  | "event"
  | "opportunity"
  | "announcement";

export type PostStatus = "active" | "hidden" | "removed";

/** Anything in the app a post can point to. */
export type LinkedEntityType =
  | "academic-resource"
  | "resource"
  | "opportunity"
  | "study-group"
  | "housing-post"
  | "profile";

export interface LinkedEntityRef {
  type: LinkedEntityType;
  id: string;
}

/**
 * Display-ready summary of a linked entity. Filled by the service (mock) or backend (API),
 * so the UI never has to know where each entity type lives.
 */
export interface LinkedEntityPreview extends LinkedEntityRef {
  title: string;
  subtitle?: string; // "Study guide · MTH 1", "Demo Robotics Club · Apply by Oct 15"
  description?: string; // one or two lines of context
  actionLabel: string; // "View study guide", "View opportunity"
  /** Internal route or external URL. Undefined = the target page isn't built yet. */
  href?: string;
  external?: boolean;
  /** false when the entity was deleted, hidden, or can't be found. */
  available: boolean;
}

/** When + where, for event and study-group posts. */
export interface PostMeeting {
  startsAt: string; // ISO
  endsAt?: string;
  locationName: string; // "Library 2nd floor", "Online (link shared in comments)"
  recurring?: string; // "Every Thursday"
}

/** One image shown in a post. Demo images are drawn placeholders under public/demo/posts. */
export interface PostImage {
  url: string;
  /** Required. Describes the image for screen readers. */
  alt: string;
  width: number;
  height: number;
  isDemo?: boolean;
}

/** Events and study groups: who said they're going. Public display info only, never contact details. */
export interface PostGoing {
  count: number;
  /** Up to 4 people for the avatar row. */
  preview: PublicUser[];
}

export interface Post {
  id: string;
  authorId: string;
  author: PublicUser; // embedded for display; includes role, roleVerified, roleTitle
  campusId: CampusId;
  postType: PostType;
  title?: string; // optional for short questions/discussions
  body: string; // plain text
  /** Course context (ACADEMIC tag category). Separate from topic tags (D24). */
  courseId?: string;
  /** Short topic tags, lowercase, max 3: "transfer", "midterms". */
  tags: string[];
  /** Metadata only, same shape as Academic attachments. No production upload yet. */
  attachments: { attachmentId: string; fileName: string; fileType: string; fileSize: number }[];
  linkedEntity?: LinkedEntityRef;
  linkedPreview?: LinkedEntityPreview;
  meeting?: PostMeeting;
  image?: PostImage;
  going?: PostGoing;
  helpfulCount: number;
  commentCount: number;
  /** Question posts only: the one comment the question's author marked as the helpful answer (Q18). */
  helpfulAnswerCommentId?: string;
  viewerMarkedHelpful?: boolean;
  viewerSaved?: boolean;
  status: PostStatus;
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: PublicUser;
  body: string; // plain text, max 1000
  status: PostStatus;
  /** Derived: the question's author marked this as the helpful answer (Q18). */
  isHelpfulAnswer?: boolean;
  createdAt: string;
  isDemo?: boolean;
}

export interface PostQuery {
  campusId: CampusId;
  postType?: PostType;
  courseId?: string;
  authorId?: string;
  savedOnly?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface NewPostInput {
  campusId: CampusId;
  postType: PostType;
  title?: string;
  body: string;
  courseId?: string;
  tags?: string[];
  linkedEntity?: LinkedEntityRef;
  meeting?: PostMeeting;
}

export interface NewCommentInput {
  postId: string;
  body: string;
}

/** Local opportunity (research, internship, program). Discover › Opportunities page comes later. */
/**
 * Who may publish (Q24): verified faculty/staff and verified organizations publish directly.
 * Students may SUGGEST one: it stays "pending-review" until a Student Hub Moderator publishes it.
 * Showing an external opportunity never implies that company or college endorses the app.
 */
export type OpportunityReviewStatus = "pending-review" | "published" | "rejected" | "removed";
export type OpportunitySource = "faculty-staff" | "organization" | "student-suggestion";

export interface Opportunity {
  id: string;
  campusId: CampusId;
  title: string;
  organization: string;
  description: string;
  deadline?: string; // ISO date
  url?: string; // official page, when real
  /** Where the details came from (the official posting). Real opportunities only. Never invented. */
  sourceUrl?: string;
  /** User id of the poster or suggester. */
  submittedBy?: string;
  source?: OpportunitySource;
  /** Only "published" is shown to students. */
  reviewStatus?: OpportunityReviewStatus;
  isDemo?: boolean;
}
