/**
 * Academic Exchange service. The ONLY way UI gets academic data.
 *
 * mock mode: in-memory store from data/mock/academic.ts. Writes (helpful, access) last until reload.
 * api mode:  endpoints in docs/DATA_CONTRACT.md §8 "ACADEMIC (v0.7)".
 *
 * Rules (D26, D27):
 * - Public reads return reviewStatus "approved" only. Authors can open their own non-approved items.
 * - Paid resources are hidden unless FEATURES.paidAcademic is on. Notes are never paid.
 * - Helpful is feedback on content. No self-votes. People are never rated.
 * - Lists never include downloadUrl. openResource() records access and returns files.
 */
import { DATA_MODE, FEATURES } from "@/config/app";
import { ACADEMIC_BLOCKED, ACADEMIC_LIMITS } from "@/config/academic";
import { hasContactInfo } from "@/lib/textSafety";
import { MOCK_COURSES } from "@/data/mock/courses";
import { MOCK_OFFERINGS, MOCK_RESOURCES_ACADEMIC, MOCK_TIPS, type MockResource, type MockTip } from "@/data/mock/academic";
import { CURRENT_USER_ID } from "@/data/mock/users";
import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { mockPublicUser } from "@/services/authors";
import { recordApproval, recordHelpfulVote, revokeHelpfulVote, tipTitle } from "@/services/contributions";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging, matchesText } from "@/services/query";
import type {
  AcademicResource,
  AcademicResourceQuery,
  AcademicTip,
  AcademicTipQuery,
  Attachment,
  Course,
  CourseOffering,
  CourseQuery,
  NewAcademicResourceInput,
  Paged,
  ReviewEvent,
  ReviewReasonCode,
  SubmissionDeclaration,
} from "@/types/models";

// ---------- in-memory mock store ----------
const resources: MockResource[] = structuredClone(MOCK_RESOURCES_ACADEMIC);
const tips: MockTip[] = structuredClone(MOCK_TIPS);
const helpfulByViewer = new Set<string>(); // "resource:<id>" | "tip:<id>"
const accessedByViewer = new Set<string>(); // resource ids
const reviewEvents: ReviewEvent[] = [];
/** Real timestamps for items created or reviewed in this session (seed data uses daysAgo). */
const times = new Map<string, { createdAt?: string; submittedAt?: string; approvedAt?: string }>();
let submitCounter = 1;

const daysAgoIso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

function contextFor(offeringId?: string) {
  const o = MOCK_OFFERINGS.find((x) => x.id === offeringId);
  return o ? { term: o.term, instructorName: o.instructorName } : undefined;
}

function isPubliclyVisible(r: MockResource): boolean {
  if (r.reviewStatus !== "approved") return false;
  if (r.access.model === "paid" && (!FEATURES.paidAcademic || r.resourceType === "notes")) return false;
  return true;
}

/** Strip download URLs unless the viewer opened it. Mock never has real URLs. */
function toResource(m: MockResource): AcademicResource {
  const { daysAgo, ...rest } = m;
  const hasAccess = accessedByViewer.has(m.id) || m.authorId === CURRENT_USER_ID;
  return {
    ...rest,
    author: mockPublicUser(m.authorId),
    context: contextFor(m.courseOfferingId),
    attachments: m.attachments.map((a) => ({ ...a, downloadUrl: undefined })),
    createdAt: times.get(m.id)?.createdAt ?? daysAgoIso(daysAgo),
    submittedAt: times.get(m.id)?.submittedAt,
    approvedAt: times.get(m.id)?.approvedAt ?? (m.reviewStatus === "approved" ? daysAgoIso(Math.max(0, daysAgo - 1)) : undefined),
    viewerMarkedHelpful: helpfulByViewer.has(`resource:${m.id}`),
    viewerHasAccess: hasAccess,
  };
}

function toTip(m: MockTip): AcademicTip {
  const { daysAgo, ...rest } = m;
  return {
    ...rest,
    author: mockPublicUser(m.authorId),
    context: contextFor(m.courseOfferingId),
    createdAt: daysAgoIso(daysAgo),
    viewerMarkedHelpful: helpfulByViewer.has(`tip:${m.id}`),
  };
}

function withCounts(c: Course): Course {
  return {
    ...c,
    resourceCount: resources.filter((r) => r.courseId === c.id && isPubliclyVisible(r)).length,
    tipCount: tips.filter((t) => t.courseId === c.id && t.reviewStatus === "approved").length,
  };
}

const sorters = {
  helpful: (a: { helpfulCount: number; daysAgo: number }, b: { helpfulCount: number; daysAgo: number }) =>
    b.helpfulCount - a.helpfulCount || a.daysAgo - b.daysAgo,
  newest: (a: { daysAgo: number }, b: { daysAgo: number }) => a.daysAgo - b.daysAgo,
};

// ---------- courses ----------

/** Courses on a campus with approved counts. Most active first, then by code. */
export async function getAcademicCourses(query: CourseQuery): Promise<Paged<Course>> {
  if (DATA_MODE === "api") return apiGet<Paged<Course>>("/courses", query);
  const items = MOCK_COURSES.filter((c) => c.campusId === query.campusId && matchesText(query.q, c.code, c.title, c.subject))
    .map(withCounts)
    .sort(
      (a, b) =>
        (b.resourceCount ?? 0) + (b.tipCount ?? 0) - ((a.resourceCount ?? 0) + (a.tipCount ?? 0)) ||
        a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
  return mockDelay(applyPaging(items, query));
}

export async function getAcademicCourse(courseId: string): Promise<Course> {
  if (DATA_MODE === "api") return apiGet<Course>(`/courses/${encodeURIComponent(courseId)}`);
  const c = MOCK_COURSES.find((x) => x.id === courseId);
  if (!c) throw new NotFoundError("Course");
  return mockDelay(withCounts(c));
}

export async function getOfferings(courseId: string): Promise<CourseOffering[]> {
  if (DATA_MODE === "api") return apiGet<CourseOffering[]>(`/courses/${encodeURIComponent(courseId)}/offerings`);
  return mockDelay(MOCK_OFFERINGS.filter((o) => o.courseId === courseId));
}

// ---------- resources ----------

export async function getAcademicResources(query: AcademicResourceQuery): Promise<Paged<AcademicResource>> {
  if (DATA_MODE === "api") return apiGet<Paged<AcademicResource>>("/academic-resources", query);
  const items = resources
    .filter(
      (r) =>
        r.campusId === query.campusId &&
        isPubliclyVisible(r) &&
        (!query.courseId || r.courseId === query.courseId) &&
        (!query.courseOfferingId || r.courseOfferingId === query.courseOfferingId) &&
        (!query.resourceType || r.resourceType === query.resourceType) &&
        (!query.authorId || r.authorId === query.authorId) &&
        (!query.freeOnly || r.access.model === "free") &&
        (!query.paidOnly || r.access.model === "paid") &&
        matchesText(query.q, r.title, r.description, ...r.tags),
    )
    .sort(sorters[query.sort ?? "helpful"])
    .map(toResource);
  return mockDelay(applyPaging(items, query));
}

/** Approved resources for everyone. Authors can also open their own drafts/in-review items. */
export async function getAcademicResource(id: string): Promise<AcademicResource> {
  if (DATA_MODE === "api") return apiGet<AcademicResource>(`/academic-resources/${encodeURIComponent(id)}`);
  const r = resources.find((x) => x.id === id);
  if (!r || (!isPubliclyVisible(r) && r.authorId !== CURRENT_USER_ID)) throw new NotFoundError("Resource");
  return mockDelay(toResource(r));
}

/**
 * "Open" a resource: records access once per viewer (accessCount) and returns its files.
 * Mock: no real files, so downloadUrl stays undefined and the UI shows "Demo file".
 */
export async function openResource(id: string): Promise<{ attachments: Attachment[]; accessCount: number }> {
  if (DATA_MODE === "api") return apiPost(`/academic-resources/${encodeURIComponent(id)}/access`);
  const r = resources.find((x) => x.id === id);
  if (!r || !isPubliclyVisible(r)) throw new NotFoundError("Resource");
  if (!accessedByViewer.has(id) && r.authorId !== CURRENT_USER_ID) {
    accessedByViewer.add(id);
    r.accessCount += 1;
  }
  return mockDelay({ attachments: r.attachments, accessCount: r.accessCount }, 200);
}

// ---------- tips ----------

export async function getTips(query: AcademicTipQuery): Promise<Paged<AcademicTip>> {
  if (DATA_MODE === "api") {
    const { courseId, ...rest } = query;
    return apiGet<Paged<AcademicTip>>(`/courses/${encodeURIComponent(courseId)}/tips`, rest);
  }
  const items = tips
    .filter(
      (t) =>
        t.courseId === query.courseId &&
        t.reviewStatus === "approved" &&
        (!query.courseOfferingId || t.courseOfferingId === query.courseOfferingId) &&
        (!query.category || t.category === query.category),
    )
    .sort(sorters[query.sort ?? "helpful"])
    .map(toTip);
  return mockDelay(applyPaging(items, query));
}

// ---------- helpful (content feedback, never people) ----------

export class SelfVoteError extends Error {
  constructor() {
    super("You can't mark your own work as helpful.");
    this.name = "SelfVoteError";
  }
}

async function toggle(kind: "resource" | "tip", id: string) {
  const list: (MockResource | MockTip)[] = kind === "resource" ? resources : tips;
  const item = list.find((x) => x.id === id);
  if (!item) throw new NotFoundError(kind === "resource" ? "Resource" : "Tip");
  if (item.authorId === CURRENT_USER_ID) throw new SelfVoteError();
  const key = `${kind}:${id}`;
  if (helpfulByViewer.has(key)) {
    helpfulByViewer.delete(key);
    item.helpfulCount -= 1;
    revokeHelpfulVote(id, CURRENT_USER_ID);
  } else {
    helpfulByViewer.add(key);
    item.helpfulCount += 1;
    // Reward the author for helping (D32). Contribution ledger, not a rating of the person.
    recordHelpfulVote({
      recipientId: item.authorId,
      actorId: CURRENT_USER_ID,
      sourceType: kind === "resource" ? "academic-resource" : "academic-tip",
      sourceId: id,
      title: "title" in item ? item.title : tipTitle(item.body),
      courseId: item.courseId,
    });
  }
  return mockDelay({ helpfulCount: item.helpfulCount, viewerMarkedHelpful: helpfulByViewer.has(key) }, 100);
}

export async function toggleResourceHelpful(id: string, currentlyMarked: boolean) {
  if (DATA_MODE === "api") {
    const path = `/helpful/academic-resource/${encodeURIComponent(id)}`;
    return currentlyMarked ? apiDelete<{ helpfulCount: number; viewerMarkedHelpful: boolean }>(path) : apiPut<{ helpfulCount: number; viewerMarkedHelpful: boolean }>(path);
  }
  return toggle("resource", id);
}

export async function toggleTipHelpful(id: string, currentlyMarked: boolean) {
  if (DATA_MODE === "api") {
    const path = `/helpful/academic-tip/${encodeURIComponent(id)}`;
    return currentlyMarked ? apiDelete<{ helpfulCount: number; viewerMarkedHelpful: boolean }>(path) : apiPut<{ helpfulCount: number; viewerMarkedHelpful: boolean }>(path);
  }
  return toggle("tip", id);
}

/** For cross-links (Community previews). Returns undefined when not publicly visible. */
export function mockFindPublicResource(id: string): MockResource | undefined {
  const r = resources.find((x) => x.id === id);
  return r && isPubliclyVisible(r) ? r : undefined;
}

// ---------- submit + review (D26, D34 / Q16, Q19) ----------

export class AcademicValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "AcademicValidationError";
  }
}

function checkAcademicText(field: string, text: string) {
  if (hasContactInfo(text)) throw new AcademicValidationError(field, "Don't include phone numbers or emails.");
  const rule = ACADEMIC_BLOCKED.find((r) => r.pattern.test(text));
  if (rule) throw new AcademicValidationError(field, rule.message);
}

/**
 * Student uploads a resource. It is NEVER public right away (Q16):
 * status "submitted" (shown as "Pending review") until a Student Hub Moderator decides.
 * Files: mock keeps metadata only. api mode needs POST /uploads first (not wired yet).
 */
export async function submitAcademicResource(
  input: NewAcademicResourceInput,
  declaration: SubmissionDeclaration,
  files: File[] = [],
): Promise<AcademicResource> {
  const title = input.title.trim();
  const description = input.description.trim();
  const body = input.body?.trim() || undefined;
  const tags = (input.tags ?? []).map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean).slice(0, ACADEMIC_LIMITS.tagsMax);
  const course = MOCK_COURSES.find((c) => c.id === input.courseId);
  if (!course) throw new AcademicValidationError("courseId", "Choose a course.");
  if (title.length < ACADEMIC_LIMITS.titleMin || title.length > ACADEMIC_LIMITS.titleMax)
    throw new AcademicValidationError("title", `Title should be ${ACADEMIC_LIMITS.titleMin} to ${ACADEMIC_LIMITS.titleMax} characters.`);
  if (description.length < ACADEMIC_LIMITS.descriptionMin)
    throw new AcademicValidationError("description", `Describe what's inside in at least ${ACADEMIC_LIMITS.descriptionMin} characters.`);
  if (description.length > ACADEMIC_LIMITS.descriptionMax) throw new AcademicValidationError("description", "Description is too long.");
  if (body && body.length > ACADEMIC_LIMITS.bodyMax) throw new AcademicValidationError("body", "Text is too long. Attach a file instead.");
  if (!body && files.length === 0) throw new AcademicValidationError("files", "Add your content as text or attach a file.");
  if (files.length > ACADEMIC_LIMITS.filesMax) throw new AcademicValidationError("files", `Attach up to ${ACADEMIC_LIMITS.filesMax} files.`);
  for (const f of files) {
    if (!(ACADEMIC_LIMITS.fileTypes as readonly string[]).includes(f.type)) throw new AcademicValidationError("files", "Files must be PDF, PNG, or JPG.");
    if (f.size > ACADEMIC_LIMITS.fileMaxBytes) throw new AcademicValidationError("files", "Each file must be under 10 MB.");
  }
  if (!declaration.original || !declaration.noExamMaterial || !declaration.noCopyrightedOrInstructorMaterial)
    throw new AcademicValidationError("declaration", "Confirm all three statements to submit.");
  if (input.access && input.access.model === "paid" && !FEATURES.paidAcademic)
    throw new AcademicValidationError("access", "Paid resources aren't available yet. Share it for free.");
  checkAcademicText("title", title);
  checkAcademicText("description", description);
  if (body) checkAcademicText("body", body);

  if (DATA_MODE === "api") {
    if (files.length) throw new AcademicValidationError("files", "File upload isn't connected yet. Paste your content as text for now.");
    const draft = await apiPost<AcademicResource>("/academic-resources", { ...input, title, description, body, tags, access: { model: "free" } });
    return apiPost<AcademicResource>(`/academic-resources/${encodeURIComponent(draft.id)}/submit`, declaration);
  }

  const id = `ar_new_${submitCounter++}`;
  const now = new Date().toISOString();
  const created: MockResource = {
    id,
    authorId: CURRENT_USER_ID,
    campusId: course.campusId,
    courseId: course.id,
    courseOfferingId: input.courseOfferingId,
    title,
    description,
    body,
    resourceType: input.resourceType,
    access: { model: "free" },
    attachments: files.map((f, i) => ({ attachmentId: `att_${id}_${i}`, fileName: f.name, fileType: f.type, fileSize: f.size })),
    tags,
    reviewStatus: "submitted",
    helpfulCount: 0,
    accessCount: 0,
    daysAgo: 0,
    isDemo: true,
  };
  resources.unshift(created);
  times.set(id, { createdAt: now, submittedAt: now });
  reviewEvents.push({ id: `rev_${reviewEvents.length + 1}`, targetType: "academic-resource", targetId: id, fromStatus: "draft", toStatus: "submitted", actor: "author", createdAt: now });
  return mockDelay(toResource(created), 250);
}

/** The signed-in student's own resources in every status, newest first. */
export async function getMyAcademicResources(): Promise<AcademicResource[]> {
  if (DATA_MODE === "api") return (await apiGet<Paged<AcademicResource>>("/me/academic-resources")).items;
  const mine = resources
    .filter((r) => r.authorId === CURRENT_USER_ID)
    .map(toResource)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mockDelay(mine);
}

/** Status history for the author (and reviewers). */
export async function getReviewHistory(resourceId: string): Promise<ReviewEvent[]> {
  if (DATA_MODE === "api") return apiGet<ReviewEvent[]>(`/academic-resources/${encodeURIComponent(resourceId)}/review-history`);
  return mockDelay(reviewEvents.filter((e) => e.targetId === resourceId));
}

/**
 * DEMO ONLY: stands in for a Student Hub Moderator (Q19). Not available in api mode, where
 * reviewers use POST /academic-resources/:id/review with their own account.
 * Approve → public + contribution credit. Reject → author sees the reason.
 */
export async function moderateResourceDemo(
  resourceId: string,
  decision: "approve" | "reject",
  reasonCode?: ReviewReasonCode,
): Promise<AcademicResource> {
  if (DATA_MODE === "api") throw new AcademicValidationError("review", "Reviews are done by moderators.");
  const r = resources.find((x) => x.id === resourceId);
  if (!r) throw new NotFoundError("Resource");
  if (r.reviewStatus !== "submitted" && r.reviewStatus !== "under-review") throw new AcademicValidationError("review", "This isn't waiting for review.");
  const now = new Date().toISOString();
  const from = r.reviewStatus;
  if (decision === "approve") {
    r.reviewStatus = "approved";
    r.reviewReason = undefined;
    times.set(r.id, { ...times.get(r.id), approvedAt: now });
    recordApproval({ type: "academic-resource-approved", authorId: r.authorId, reviewerId: "demo_moderator", sourceId: r.id, title: r.title, courseId: r.courseId, kind: r.resourceType });
  } else {
    if (!reasonCode) throw new AcademicValidationError("reason", "Pick a reason.");
    r.reviewStatus = "rejected";
    r.reviewReason = { code: reasonCode };
  }
  reviewEvents.push({ id: `rev_${reviewEvents.length + 1}`, targetType: "academic-resource", targetId: r.id, fromStatus: from, toStatus: r.reviewStatus, actor: "reviewer", reasonCode, createdAt: now });
  return mockDelay(toResource(r), 200);
}
