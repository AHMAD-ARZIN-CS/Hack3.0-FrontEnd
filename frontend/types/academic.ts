/**
 * Academic Exchange models. Contract v0.7 §7a. Change both together.
 * Status: Course LIVE (lookups). Everything else TYPED, UI not built yet.
 *
 * Relationships (D26):
 *   Campus 1─* Course 1─* CourseOffering *─0..1 Instructor
 *   Course 1─* AcademicResource *─0..1 CourseOffering      (instructor reached ONLY through the offering)
 *   Course 1─* AcademicTip      *─0..1 CourseOffering
 *   AcademicResource 1─* Attachment (metadata)
 *   AcademicResource 1─* AcademicAccess (who opened / was granted access)
 *   AcademicResource 1─* ReviewEvent (status history, backend-owned)
 *   AcademicResource|AcademicTip 1─* HelpfulVote, ContentReport   (shared, no separate AcademicFeedback)
 *
 * Never: professor ratings, rankings, instructor scores, "easy A" fields (D20, D26).
 */
import type { CampusId, PublicUser } from "./models";

// ---------- Course structure ----------

export interface Course {
  /** Campus-scoped slug, e.g. "chabot-mth-1". Course codes repeat across campuses. */
  id: string;
  campusId: CampusId;
  code: string; // as the campus writes it: "MTH 1", "CSCI 14", "ENGL 1"
  title: string; // "Calculus I"
  subject?: string; // "Mathematics"
  /** Official catalog page, when known. */
  catalogUrl?: string;
  /** true only when code + title were checked against the official catalog. */
  catalogVerified: boolean;
  /** Approved resources / tips only. */
  resourceCount?: number;
  tipCount?: number;
  isDemo?: boolean;
}

// ---------- Course schedule + membership (D35) ----------
// Campus → Term → Course → CourseSection → UserCourse. Built so an official schedule import can fill it later.

export interface Term {
  id: string; // "chabot-2026-fall"
  campusId: CampusId;
  name: string; // "Fall 2026"
  /** The term students are registering for or taking now. Exactly one per campus. */
  isCurrent: boolean;
  academicYear?: string; // "2026-2027"
  termType?: "fall" | "spring" | "summer" | "winter";
  startDate?: string; // ISO date
  endDate?: string;
}

export type SectionModality = "in-person" | "online" | "hybrid";

/** Where schedule data came from. Official imports keep their source; demo rows say so. */
export interface ScheduleSource {
  kind: "official-import" | "demo";
  url?: string;
  retrievedAt?: string;
}

/**
 * One class section. `sectionCode` is generic on purpose: campuses call it CRN, Class Number, etc.
 * The display label comes from config (SECTION_CODE_LABELS). Never present a demo code as official.
 */
export interface CourseSection {
  id: string;
  campusId: CampusId;
  termId: string;
  courseId: string;
  sectionCode: string;
  /** true only for codes from an official schedule import. */
  sectionCodeOfficial: boolean;
  /** As printed in the public schedule. Omitted in demo data (D23: no invented people). */
  instructorName?: string;
  /** Plain text: "Mon/Wed 9:00–10:50 AM". */
  meetingInfo?: string;
  /** Building/room as printed in the public schedule. Private to the student, like meetingInfo. */
  location?: string;
  modality?: SectionModality;
  source: ScheduleSource;
  isDemo?: boolean;
}

/** A student's course membership. Private schedule details (section) are never shown on public profiles. */
export interface UserCourse {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  termId?: string;
  sectionId?: string;
  section?: CourseSection;
  status: "current" | "past";
  addedAt?: string;
}

export interface SectionSearchQuery {
  campusId: CampusId;
  termId: string;
  /** Course code, course title, or section code. */
  q?: string;
}

/** Add by section (normal path) or by course when the campus has no section data yet. */
export type AddUserCourseInput = { sectionId: string } | { courseId: string; termId: string };

/**
 * Organizational context only (D20, D26). Name as printed in the public class schedule.
 * No rating, score, review, ranking, or aggregate stats fields. Ever.
 */
export interface Instructor {
  id: string;
  campusId: CampusId;
  displayName: string; // "R. Rivera"
  department?: string;
  isDemo?: boolean;
}

/** One term of a course, optionally with its instructor. */
export interface CourseOffering {
  id: string; // "chabot-mth-1-fa26-rivera"
  courseId: string;
  campusId: CampusId;
  term: string; // "Fall 2026"
  instructorId?: string;
  /** Denormalized for display, so the UI never needs an instructor endpoint. */
  instructorName?: string;
  isDemo?: boolean;
}

// ---------- Content ----------

/** Metadata only. Real upload/storage + virus scan is backend work (D19). */
export interface Attachment {
  attachmentId: string;
  fileName: string; // "mth1-derivatives.pdf"
  fileType: string; // MIME: "application/pdf", "image/png"
  fileSize: number; // bytes
  previewUrl?: string;
  /** Short-lived signed URL from the backend. Omitted until the viewer has access. */
  downloadUrl?: string;
}

export type AcademicResourceType = "notes" | "study-guide" | "practice" | "study-strategy";

/**
 * Review workflow (D26):
 *   draft → submitted → under-review → approved
 *                                    ↘ rejected → (author edits) draft → submitted …
 *   any published state → removed (moderator, or author withdraws)
 * Only "approved" is visible to other students and counts toward reputation.
 */
export type ReviewStatus = "draft" | "submitted" | "under-review" | "approved" | "rejected" | "removed";

export type ReviewReasonCode =
  | "not-original"
  | "exam-material" // leaked exams, answer keys
  | "copyrighted" // textbook PDFs, course packs
  | "instructor-material" // unauthorized slides/handouts
  | "lecture-notes-for-sale" // CA Ed Code 66450: no selling notes of class presentations
  | "personal-attack"
  | "wrong-course"
  | "low-quality"
  | "other";

/**
 * Free by default. Paid is DEFERRED (payments not approved, legal review needed, D27).
 * When enabled: only approved resources, never resourceType "notes".
 */
export type AccessModel = { model: "free" } | { model: "paid"; priceCents: number };

export interface AcademicResource {
  id: string;
  authorId: string;
  author: PublicUser; // embedded for display
  campusId: CampusId;
  courseId: string;
  courseOfferingId?: string;
  /** Denormalized from the offering for display. Not a separate relationship. */
  context?: { term?: string; instructorName?: string };
  title: string; // max 120
  description: string; // plain text summary, max 1000
  resourceType: AcademicResourceType;
  access: AccessModel;
  attachments: Attachment[]; // may be empty for text-only resources
  body?: string; // optional inline plain-text content
  tags: string[]; // topic tags, max 5 ("derivatives", "midterm-2")
  reviewStatus: ReviewStatus;
  /** Shown to the author only, when rejected/removed. */
  reviewReason?: { code: ReviewReasonCode; note?: string };
  helpfulCount: number;
  /** Distinct students who opened/downloaded. Informational; NOT used for reputation. */
  accessCount: number;
  viewerMarkedHelpful?: boolean;
  viewerHasAccess?: boolean;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  isDemo?: boolean;
}

export type AcademicTipCategory = "course-tip" | "study-strategy";

/** Short text. Same review states; backend may auto-approve tips after automated checks. */
export interface AcademicTip {
  id: string;
  authorId: string;
  author: PublicUser;
  campusId: CampusId;
  courseId: string;
  courseOfferingId?: string;
  context?: { term?: string; instructorName?: string };
  category: AcademicTipCategory;
  body: string; // max 500. About succeeding in the course, not about the instructor
  reviewStatus: ReviewStatus;
  reviewReason?: { code: ReviewReasonCode; note?: string };
  helpfulCount: number;
  viewerMarkedHelpful?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

/**
 * Access record. Free resources: written on first open/download (drives accessCount).
 * Paid (DEFERRED): written on purchase. Also covers author and reviewer access.
 */
export interface AcademicAccess {
  id: string;
  resourceId: string;
  userId: string;
  grantType: "open" | "purchase" | "author" | "reviewer";
  priceCentsPaid?: number; // purchase only
  paymentRef?: string; // purchase only, from the payment provider
  createdAt: string;
}

/** Status history, backend-owned. Returned to author (own resources) and reviewers only. */
export interface ReviewEvent {
  id: string;
  targetType: "academic-resource" | "academic-tip";
  targetId: string;
  fromStatus: ReviewStatus;
  toStatus: ReviewStatus;
  actor: "author" | "reviewer" | "system";
  reasonCode?: ReviewReasonCode;
  note?: string;
  createdAt: string;
}

// ---------- Queries and inputs ----------

export interface CourseQuery {
  campusId: CampusId;
  q?: string;
  subject?: string;
  page?: number;
  pageSize?: number;
}

/** Public lists return approved items only. No instructorId filter on purpose (use offering). */
export interface AcademicResourceQuery {
  campusId: CampusId;
  courseId?: string;
  courseOfferingId?: string;
  resourceType?: AcademicResourceType;
  authorId?: string;
  freeOnly?: boolean;
  paidOnly?: boolean;
  sort?: "helpful" | "newest";
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AcademicTipQuery {
  courseId: string;
  courseOfferingId?: string;
  category?: AcademicTipCategory;
  sort?: "helpful" | "newest";
  page?: number;
  pageSize?: number;
}

/** Creates a DRAFT. Submitting is a separate action. */
export interface NewAcademicResourceInput {
  courseId: string;
  courseOfferingId?: string;
  resourceType: AcademicResourceType;
  title: string;
  description: string;
  body?: string;
  tags?: string[];
  /** Ids returned by the upload endpoint (mock: metadata only). */
  attachmentIds?: string[];
  access?: AccessModel; // default free; paid rejected while payments are DEFERRED
}

/** Required when submitting for review (D20, D26). */
export interface SubmissionDeclaration {
  /** I created this myself. */
  original: true;
  /** No exams, quizzes, answer keys, or graded work. */
  noExamMaterial: true;
  /** No copyrighted textbook pages, course packs, or instructor slides/handouts. */
  noCopyrightedOrInstructorMaterial: true;
}

export interface NewAcademicTipInput {
  courseId: string;
  courseOfferingId?: string;
  category: AcademicTipCategory;
  body: string;
  declaration: SubmissionDeclaration;
}

export type HelpfulTargetType = "academic-resource" | "academic-tip";

export interface HelpfulVote {
  targetType: HelpfulTargetType;
  targetId: string;
  userId: string;
  createdAt: string;
}

export type ReportTargetType =
  | "academic-resource"
  | "academic-tip"
  | "housing-post"
  | "profile"
  | "community-post"
  | "community-comment"
  | "food-deal"
  | "marketplace-listing";
export type ReportReason =
  | "integrity" // exams, answer keys, cheating material
  | "copyright" // textbook PDFs, unauthorized instructor material
  | "personal-attack" // attacks on instructors or students
  | "personal-info"
  | "inaccurate"
  | "spam"
  | "harassment"
  | "scam" // asks for deposits, payments, or personal financial info
  | "discrimination" // excludes people by protected traits
  | "prohibited-item" // marketplace: item not allowed (weapons, alcohol, drugs, exam material, etc.)
  | "other";

export interface ContentReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}
