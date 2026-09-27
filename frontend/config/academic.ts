/** Academic Exchange labels and rules (D20, D26, D27). Edit wording here. */
import type { AcademicResourceType, AcademicTipCategory, ReviewStatus } from "@/types/models";

export const RESOURCE_TYPE_LABELS: Record<AcademicResourceType, { one: string; many: string; action: string }> = {
  notes: { one: "Notes", many: "Notes", action: "Open notes" },
  "study-guide": { one: "Study guide", many: "Study guides", action: "Open study guide" },
  practice: { one: "Practice", many: "Practice", action: "Open practice set" },
  "study-strategy": { one: "Study strategy", many: "Study strategies", action: "Open strategy" },
};

export const TIP_CATEGORY_LABELS: Record<AcademicTipCategory, string> = {
  "course-tip": "Course tip",
  "study-strategy": "Study strategy",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "Draft",
  submitted: "Pending review",
  "under-review": "In review",
  approved: "Reviewed & approved",
  rejected: "Needs changes",
  removed: "Removed",
};

/** Shown on course pages, resource pages, and (later) the submit form. */
export const INTEGRITY_RULES = {
  short: "Original student work only. No exams, answer keys, textbook PDFs, or instructor slides.",
  long: [
    "Everything here is original work by students: their own notes, study guides, practice problems, and advice.",
    "Not allowed: leaked exams or quizzes, answer keys, copyrighted textbook pages or course packs, and instructor slides or handouts shared without permission.",
    "Use these to learn, not to submit as your own work. Follow your instructor's rules on collaboration.",
    "See something that breaks these rules? Report it.",
  ],
};

/**
 * Submission rules (D26, D34 / Q16). New resources are never public right away:
 * submitted → pending review → a Student Hub Moderator approves or rejects.
 */
export const ACADEMIC_LIMITS = {
  titleMin: 5,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 1000,
  bodyMax: 5000,
  tagsMax: 5,
  filesMax: 3,
  fileMaxBytes: 10 * 1024 * 1024,
  fileTypes: ["application/pdf", "image/png", "image/jpeg"],
} as const;

/** Caught at submit. Moderators still review everything. */
export const ACADEMIC_BLOCKED: { pattern: RegExp; message: string }[] = [
  {
    pattern: /\b(answer keys?|test banks?|solutions? manuals?|exam answers?|quiz answers?|leaked|past exam|old exam|midterm answers?|final answers?)\b/i,
    message: "Exams, quizzes, answer keys, and solution manuals aren't allowed. Share your own notes or practice you wrote.",
  },
  {
    pattern: /\b(textbook pdf|pdf of the (text)?book|scanned (textbook|chapter)|instructor'?s? slides|professor'?s? slides|lecture slides)\b/i,
    message: "Copyrighted textbook pages and instructor slides aren't allowed. Share your own material.",
  },
];

/** Who reviews (Q19). A prototype role, not a claim about any college office. */
export const MODERATOR_ROLE_LABEL = "Student Hub Moderator";

/** Reasons a moderator can pick when rejecting (subset of ReviewReasonCode). */
export const REJECT_REASONS: { code: "not-original" | "exam-material" | "copyrighted" | "instructor-material" | "wrong-course" | "low-quality"; label: string }[] = [
  { code: "not-original", label: "Not the student's own work" },
  { code: "exam-material", label: "Exam or answer key material" },
  { code: "copyrighted", label: "Copyrighted textbook content" },
  { code: "instructor-material", label: "Instructor material without permission" },
  { code: "wrong-course", label: "Wrong course" },
  { code: "low-quality", label: "Needs more detail to be useful" },
];

/**
 * What each campus calls a class section identifier (CRN, Class Number, …). None is confirmed on an
 * official page yet (checked 2026-09-27), so all show the neutral "Section" until someone verifies.
 */
export const SECTION_CODE_LABELS: Record<string, string> = {
  chabot: "Section",
  dvc: "Section",
  csueb: "Section",
};

export const MODALITY_LABELS = { "in-person": "In person", online: "Online", hybrid: "Hybrid" } as const;
