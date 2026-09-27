/**
 * MOCK ACADEMIC EXCHANGE DATA — demonstration data (isDemo: true).
 * Courses come from data/mock/courses.ts (code + title verified against Chabot pages).
 * Everything here (offerings, resources, tips, files, counts) is sample content written for the demo.
 * No instructor names in demo offerings (D23): we don't attach invented content to real people.
 *
 * Ids match data/mock/users.ts (profile history) and data/mock/posts.ts (community links).
 * Stored without author objects; services/academic.ts joins authors from data/mock/users.ts.
 */
import type { AcademicResource, AcademicTip, CourseOffering } from "@/types/models";

export const MOCK_OFFERINGS: CourseOffering[] = [
  { id: "chabot-mth-1-sp26", courseId: "chabot-mth-1", campusId: "chabot", term: "Spring 2026", isDemo: true },
  { id: "chabot-mth-1-fa25", courseId: "chabot-mth-1", campusId: "chabot", term: "Fall 2025", isDemo: true },
  { id: "chabot-csci-14-sp26", courseId: "chabot-csci-14", campusId: "chabot", term: "Spring 2026", isDemo: true },
  { id: "chabot-engl-1-fa25", courseId: "chabot-engl-1", campusId: "chabot", term: "Fall 2025", isDemo: true },
];

type Stored<T> = Omit<T, "author" | "createdAt" | "context" | "viewerMarkedHelpful" | "viewerHasAccess" | "approvedAt" | "submittedAt"> & {
  daysAgo: number;
};
export type MockResource = Stored<AcademicResource>;
export type MockTip = Stored<AcademicTip>;

const pdf = (id: string, name: string, kb: number) => ({ attachmentId: id, fileName: name, fileType: "application/pdf", fileSize: kb * 1024 });

export const MOCK_RESOURCES_ACADEMIC: MockResource[] = [
  // ---- MTH 1 · Calculus I ----
  {
    id: "ar_mth1_deriv",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-mth-1",
    courseOfferingId: "chabot-mth-1-sp26",
    title: "Derivative rules one-page study guide",
    description: "Every derivative rule on one page with a short worked example for each: power, product, quotient, chain, trig, exponential, and log.",
    resourceType: "study-guide",
    access: { model: "free" },
    attachments: [pdf("att_deriv_1", "derivative-rules-study-guide.pdf", 212)],
    tags: ["derivatives", "midterm-1"],
    reviewStatus: "approved",
    helpfulCount: 21,
    accessCount: 64,
    daysAgo: 11,
    isDemo: true,
  },
  {
    id: "ar_mth1_limits",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-mth-1",
    courseOfferingId: "chabot-mth-1-sp26",
    title: "Limits and continuity: worked examples",
    description: "My notes from studying limits, rewritten cleanly with my own examples and the mistakes I kept making.",
    resourceType: "notes",
    access: { model: "free" },
    attachments: [pdf("att_limits_1", "limits-continuity-notes.pdf", 348)],
    body: "Three things that fixed most of my limit problems:\n1. Try direct substitution first.\n2. If you get 0/0, factor or rationalize.\n3. For limits at infinity, divide by the highest power in the denominator.",
    tags: ["limits"],
    reviewStatus: "approved",
    helpfulCount: 12,
    accessCount: 31,
    daysAgo: 3,
    isDemo: true,
  },
  {
    id: "ar_mth1_practice",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-mth-1",
    courseOfferingId: "chabot-mth-1-fa25",
    title: "Original related-rates practice set",
    description: "Ten related-rates problems I wrote myself, from easy to hard, with full solutions at the end.",
    resourceType: "practice",
    access: { model: "free" },
    attachments: [pdf("att_rr_1", "related-rates-practice.pdf", 180), pdf("att_rr_2", "related-rates-solutions.pdf", 240)],
    tags: ["related-rates", "applications"],
    reviewStatus: "approved",
    helpfulCount: 15,
    accessCount: 40,
    daysAgo: 27,
    isDemo: true,
  },
  {
    // Paid-model preview. Hidden unless FEATURES.paidAcademic is on (D27). Never notes.
    id: "ar_mth1_final_review",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-mth-1",
    title: "Final exam review guide (price preview)",
    description: "A 12-page review organized by topic with my own practice problems. Shown only when paid resources are enabled.",
    resourceType: "study-guide",
    access: { model: "paid", priceCents: 300 },
    attachments: [pdf("att_final_1", "mth1-final-review.pdf", 910)],
    tags: ["finals"],
    reviewStatus: "approved",
    helpfulCount: 4,
    accessCount: 6,
    daysAgo: 5,
    isDemo: true,
  },
  {
    // Not public: still in review. Proves public lists return approved only.
    id: "ar_mth1_integrals_draft",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-mth-1",
    title: "Intro to integrals notes",
    description: "Work in progress.",
    resourceType: "notes",
    access: { model: "free" },
    attachments: [],
    tags: [],
    reviewStatus: "under-review",
    helpfulCount: 0,
    accessCount: 0,
    daysAgo: 1,
    isDemo: true,
  },

  // ---- CSCI 14 · Intro to Structured Programming in C++ ----
  {
    id: "ar_csci14_ptr",
    authorId: "user_demo",
    campusId: "chabot",
    courseId: "chabot-csci-14",
    courseOfferingId: "chabot-csci-14-sp26",
    title: "Pointers and references notes",
    description: "How pointers and references differ, with small C++ examples I wrote and ran myself.",
    resourceType: "notes",
    access: { model: "free" },
    attachments: [{ attachmentId: "att_ptr_1", fileName: "pointers-references.md", fileType: "text/markdown", fileSize: 9 * 1024 }],
    body: "int x = 5;\nint* p = &x;   // p holds the address of x\nint& r = x;    // r is another name for x\n*p = 6;        // x is now 6\nr = 7;         // x is now 7",
    tags: ["pointers"],
    reviewStatus: "approved",
    helpfulCount: 7,
    accessCount: 22,
    daysAgo: 19,
    isDemo: true,
  },
  {
    id: "ar_csci14_loops_guide",
    authorId: "user_maya",
    campusId: "chabot",
    courseId: "chabot-csci-14",
    courseOfferingId: "chabot-csci-14-sp26",
    title: "Loops and functions study guide",
    description: "for, while, and do-while side by side, plus how to break a lab problem into functions. Includes a checklist for tracing code by hand.",
    resourceType: "study-guide",
    access: { model: "free" },
    attachments: [pdf("att_loops_1", "loops-functions-guide.pdf", 265)],
    tags: ["loops", "functions"],
    reviewStatus: "approved",
    helpfulCount: 10,
    accessCount: 28,
    daysAgo: 15,
    isDemo: true,
  },

  // ---- ENGL 1 · Academic Reading and Writing ----
  {
    id: "ar_engl1_essay_plan",
    authorId: "user_maya",
    campusId: "chabot",
    courseId: "chabot-engl-1",
    courseOfferingId: "chabot-engl-1-fa25",
    title: "Essay planning template",
    description: "The one-page template I used to plan every essay: claim, reasons, evidence, counterargument, and a timeline working back from the due date.",
    resourceType: "study-strategy",
    access: { model: "free" },
    attachments: [{ attachmentId: "att_plan_1", fileName: "essay-planning-template.docx", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileSize: 41 * 1024 }],
    tags: ["essays", "planning"],
    reviewStatus: "approved",
    helpfulCount: 11,
    accessCount: 35,
    daysAgo: 22,
    isDemo: true,
  },
  {
    id: "ar_engl1_cite",
    authorId: "user_maya",
    campusId: "chabot",
    courseId: "chabot-engl-1",
    courseOfferingId: "chabot-engl-1-fa25",
    title: "MLA citation quick guide",
    description: "My cheat sheet for in-text citations and Works Cited entries for books, articles, and websites, with examples I made up.",
    resourceType: "study-guide",
    access: { model: "free" },
    attachments: [pdf("att_cite_1", "mla-quick-guide.pdf", 150)],
    tags: ["citations", "mla"],
    reviewStatus: "approved",
    helpfulCount: 8,
    accessCount: 30,
    daysAgo: 40,
    isDemo: true,
  },
];

export const MOCK_TIPS: MockTip[] = [
  { id: "at_mth1_1", authorId: "user_demo", campusId: "chabot", courseId: "chabot-mth-1", courseOfferingId: "chabot-mth-1-fa25", category: "course-tip", body: "Weekly quizzes matched the homework closely. Doing every homework problem was the best quiz prep.", reviewStatus: "approved", helpfulCount: 18, daysAgo: 34, isDemo: true },
  { id: "at_mth1_2", authorId: "user_maya", campusId: "chabot", courseId: "chabot-mth-1", category: "study-strategy", body: "Redo the worked examples with the book closed. If you can't finish one, that's the topic to review.", reviewStatus: "approved", helpfulCount: 9, daysAgo: 12, isDemo: true },
  { id: "at_csci14_1", authorId: "user_demo", campusId: "chabot", courseId: "chabot-csci-14", courseOfferingId: "chabot-csci-14-sp26", category: "course-tip", body: "Start each lab by writing the input and expected output first. Then write the code.", reviewStatus: "approved", helpfulCount: 9, daysAgo: 6, isDemo: true },
  { id: "at_csci14_2", authorId: "user_maya", campusId: "chabot", courseId: "chabot-csci-14", category: "course-tip", body: "Start the final project early. The last two weeks go fast.", reviewStatus: "approved", helpfulCount: 7, daysAgo: 16, isDemo: true },
  { id: "at_engl1_1", authorId: "user_maya", campusId: "chabot", courseId: "chabot-engl-1", category: "course-tip", body: "Outline the essay before the first draft is due. Peer review goes much better with a clear outline.", reviewStatus: "approved", helpfulCount: 6, daysAgo: 9, isDemo: true },
  { id: "at_engl1_2", authorId: "user_demo", campusId: "chabot", courseId: "chabot-engl-1", category: "study-strategy", body: "Read each assigned article twice: once for the main claim, once to mark evidence you might quote.", reviewStatus: "approved", helpfulCount: 5, daysAgo: 30, isDemo: true },
  // Not public (submitted). Proves tips list returns approved only.
  { id: "at_engl1_pending", authorId: "user_demo", campusId: "chabot", courseId: "chabot-engl-1", category: "course-tip", body: "Pending tip.", reviewStatus: "submitted", helpfulCount: 0, daysAgo: 0, isDemo: true },
];
