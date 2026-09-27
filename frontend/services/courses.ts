/**
 * Course service: catalog, terms, section search, and My Courses.
 * api mode (PROPOSED contract, docs/DATA_CONTRACT.md): GET /courses, GET /courses/:id, GET /courses?ids=a,b,
 *   GET /terms, GET /course-sections/search, GET|POST /me/courses, DELETE /me/courses/:courseId.
 * Every backend response passes through services/api/normalize.ts, so schema differences stay there.
 *
 * My Courses uses /me/... instead of /users/:id/... on purpose: the backend takes the user from the
 * verified session, so nobody can edit another student's courses by changing an id in the request.
 */
import { DATA_MODE } from "@/config/app";
import { MOCK_COURSES, MOCK_SECTIONS, MOCK_TERMS } from "@/data/mock/courses";
import { CURRENT_USER_ID, MOCK_USERS } from "@/data/mock/users";
import { ApiError, apiDelete, apiGet, apiPost } from "@/services/api/client";
import { normalizeCourse, normalizeList, normalizeSectionSearch, normalizeTerm, normalizeUserCourse } from "@/services/api/normalize";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging, matchesText } from "@/services/query";
import type { AddUserCourseInput, CampusId, Course, CourseQuery, CourseSection, Paged, SectionSearchQuery, Term, UserCourse } from "@/types/models";

export async function getCourses(query: CourseQuery): Promise<Paged<Course>> {
  if (DATA_MODE === "api") {
    const page = await apiGet<Paged<unknown>>("/courses", query);
    return { ...page, items: normalizeList(page.items, normalizeCourse) };
  }
  const items = MOCK_COURSES.filter(
    (c) =>
      c.campusId === query.campusId &&
      (!query.subject || c.subject === query.subject) &&
      matchesText(query.q, c.code, c.title),
  ).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  return mockDelay(applyPaging(items, query));
}

export async function getCourse(id: string): Promise<Course> {
  if (DATA_MODE === "api") return normalizeCourse(await apiGet(`/courses/${encodeURIComponent(id)}`));
  const found = MOCK_COURSES.find((c) => c.id === id);
  if (!found) throw new NotFoundError("Course");
  return mockDelay(found);
}

/** Batch lookup for tag chips. Unknown ids are skipped, never thrown. */
export async function getCoursesByIds(ids: string[]): Promise<Course[]> {
  if (ids.length === 0) return [];
  if (DATA_MODE === "api") return normalizeList(await apiGet("/courses", { ids: ids.join(",") }), normalizeCourse);
  return mockDelay(ids.map((id) => MOCK_COURSES.find((c) => c.id === id)).filter((c): c is Course => !!c));
}

// ---------- Terms, sections, and course membership (D35) ----------
// Mock and api branches share one contract, so the Add Course UI never changes when the backend lands.

export class CourseMembershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CourseMembershipError";
  }
}

/** Current term first. */
export async function getTerms(campusId: CampusId): Promise<Term[]> {
  if (DATA_MODE === "api") {
    const terms = normalizeList(await apiGet("/terms", { campusId }), normalizeTerm);
    return terms.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  }
  const terms = MOCK_TERMS.filter((t) => t.campusId === campusId).sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  return mockDelay(terms, 100);
}

export interface SectionSearchResult {
  course: Course;
  sections: CourseSection[];
}

/** Grouped by course. Matches course code, course title, or section code. */
export async function searchSections(query: SectionSearchQuery): Promise<SectionSearchResult[]> {
  if (DATA_MODE === "api") return normalizeSectionSearch(await apiGet("/course-sections/search", query));
  const courses = MOCK_COURSES.filter((c) => c.campusId === query.campusId);
  const results = courses
    .map((course) => {
      const sections = MOCK_SECTIONS.filter((s) => s.courseId === course.id && s.termId === query.termId);
      const courseMatches = matchesText(query.q, course.code, course.title, course.code.replace(/\s+/g, ""));
      const matchingSections = courseMatches ? sections : sections.filter((s) => matchesText(query.q, s.sectionCode));
      return { course, sections: matchingSections, courseMatches };
    })
    .filter((r) => r.courseMatches || r.sections.length > 0)
    .sort((a, b) => a.course.code.localeCompare(b.course.code, undefined, { numeric: true }))
    .map(({ course, sections }) => ({ course, sections }));
  return mockDelay(results, 150);
}

// Mock membership: the profile's academic lists stay the source of truth, plus the chosen section per course.
const sectionChoice = new Map<string, string>(); // `${userId}:${courseId}` → sectionId
const addedAt = new Map<string, string>();

function mockUserRecord() {
  const rec = MOCK_USERS.find((u) => u.base.id === CURRENT_USER_ID);
  if (!rec) throw new CourseMembershipError("Sign in again.");
  return rec;
}

function toUserCourse(userId: string, courseId: string, status: UserCourse["status"]): UserCourse | undefined {
  const course = MOCK_COURSES.find((c) => c.id === courseId);
  if (!course) return undefined;
  const key = `${userId}:${courseId}`;
  const section = MOCK_SECTIONS.find((s) => s.id === sectionChoice.get(key));
  const currentTerm = MOCK_TERMS.find((t) => t.campusId === course.campusId && t.isCurrent);
  return {
    id: key,
    userId,
    courseId,
    course,
    termId: status === "current" ? (section?.termId ?? currentTerm?.id) : undefined,
    sectionId: section?.id,
    section,
    status,
    addedAt: addedAt.get(key),
  };
}

/** The signed-in student's courses: current first, then past. Own view only (sections are private). */
export async function getMyCourses(): Promise<UserCourse[]> {
  if (DATA_MODE === "api") return normalizeList(await apiGet("/me/courses"), normalizeUserCourse);
  const { base } = mockUserRecord();
  const current = base.academic.currentCourseIds.map((id) => toUserCourse(base.id, id, "current"));
  const past = base.academic.pastCourseIds.map((id) => toUserCourse(base.id, id, "past"));
  return mockDelay([...current, ...past].filter((c): c is UserCourse => !!c));
}

/**
 * authenticated user + selected section → UserCourse. Backend: POST /me/courses.
 * Adding a section for a course you already have (without a section) attaches the section.
 */
export async function addUserCourse(input: AddUserCourseInput): Promise<UserCourse> {
  if (DATA_MODE === "api") {
    try {
      return normalizeUserCourse(await apiPost("/me/courses", input));
    } catch (e) {
      // 409 is the one expected refusal. Other failures get the page's generic message.
      if (e instanceof ApiError && e.status === 409) throw new CourseMembershipError("Already in My Courses.");
      throw e;
    }
  }
  const { base } = mockUserRecord();
  const section = "sectionId" in input ? MOCK_SECTIONS.find((s) => s.id === input.sectionId) : undefined;
  if ("sectionId" in input && !section) throw new CourseMembershipError("That section isn't available anymore.");
  const courseId = section?.courseId ?? ("courseId" in input ? input.courseId : "");
  if (!MOCK_COURSES.some((c) => c.id === courseId)) throw new CourseMembershipError("Course not found.");
  const key = `${base.id}:${courseId}`;
  const alreadyCurrent = base.academic.currentCourseIds.includes(courseId);
  if (alreadyCurrent && (!section || sectionChoice.get(key) === section.id)) throw new CourseMembershipError("Already in My Courses.");
  if (!alreadyCurrent) {
    base.academic.currentCourseIds.push(courseId);
    base.academic.pastCourseIds = base.academic.pastCourseIds.filter((id) => id !== courseId);
  }
  if (section) sectionChoice.set(key, section.id);
  addedAt.set(key, new Date().toISOString());
  return mockDelay(toUserCourse(base.id, courseId, "current")!, 150);
}

export async function removeUserCourse(courseId: string): Promise<void> {
  if (DATA_MODE === "api") {
    await apiDelete(`/me/courses/${encodeURIComponent(courseId)}`);
    return;
  }
  const { base } = mockUserRecord();
  base.academic.currentCourseIds = base.academic.currentCourseIds.filter((id) => id !== courseId);
  sectionChoice.delete(`${base.id}:${courseId}`);
  await mockDelay(null, 100);
}
