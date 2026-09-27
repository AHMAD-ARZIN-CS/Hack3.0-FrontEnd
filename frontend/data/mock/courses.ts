/**
 * MOCK COURSES — demonstration data.
 * Code + title of each Chabot course were checked against official Chabot pages on 2026-09-26
 * (DECISIONS D23), so catalogVerified is true for code + title ONLY. Counts and all
 * content attached to these courses are demo data.
 */
import type { Course, CourseSection, Term } from "@/types/models";

const MATH_URL = "https://www.chabotcollege.edu/academics/science-math/mathematics/courses.php";
const CS_URL = "https://www.chabotcollege.edu/academics/science-math/computer-science/courses.php";
const ENGL_URL = "https://banssprod.clpccd.cc.ca.us/clpccd/2026/cat_engl.htm";

export const MOCK_COURSES: Course[] = [
  { id: "chabot-mth-1", campusId: "chabot", code: "MTH 1", title: "Calculus I", subject: "Mathematics", catalogUrl: MATH_URL, catalogVerified: true, isDemo: true },
  { id: "chabot-mth-21", campusId: "chabot", code: "MTH 21", title: "College Algebra for BSTEM", subject: "Mathematics", catalogUrl: MATH_URL, catalogVerified: true, isDemo: true },
  { id: "chabot-csci-7", campusId: "chabot", code: "CSCI 7", title: "Introduction to Computer Programming Concepts", subject: "Computer Science", catalogUrl: CS_URL, catalogVerified: true, isDemo: true },
  { id: "chabot-csci-14", campusId: "chabot", code: "CSCI 14", title: "Introduction to Structured Programming In C++", subject: "Computer Science", catalogUrl: CS_URL, catalogVerified: true, isDemo: true },
  { id: "chabot-engl-1", campusId: "chabot", code: "ENGL 1", title: "Academic Reading and Writing", subject: "English", catalogUrl: ENGL_URL, catalogVerified: true, isDemo: true },
];

// ---------- Terms + sections (D35) ----------
// DEMO schedule. Section codes use a "DEMO-" prefix so they can never be mistaken for real CRNs
// or class numbers. Meeting times and modality are sample values, not Chabot's real schedule.
// An official schedule import would replace these rows and set sectionCodeOfficial: true.


export const MOCK_TERMS: Term[] = ["chabot", "dvc", "csueb"].flatMap((campusId) => [
  { id: `${campusId}-2026-fall`, campusId, name: "Fall 2026", isCurrent: true },
  { id: `${campusId}-2027-spring`, campusId, name: "Spring 2027", isCurrent: false },
]);

const demo = { kind: "demo" as const };
const section = (
  courseId: string,
  n: number,
  meetingInfo: string,
  modality: CourseSection["modality"],
): CourseSection => ({
  id: `${courseId}-fa26-${n}`,
  campusId: "chabot",
  termId: "chabot-2026-fall",
  courseId,
  sectionCode: `DEMO-${courseId.replace("chabot-", "").toUpperCase()}-0${n}`,
  sectionCodeOfficial: false,
  meetingInfo,
  modality,
  source: demo,
  isDemo: true,
});

export const MOCK_SECTIONS: CourseSection[] = [
  section("chabot-mth-1", 1, "Mon/Wed 8:00–9:50 AM", "in-person"),
  section("chabot-mth-1", 2, "Tue/Thu 6:00–7:50 PM", "in-person"),
  section("chabot-mth-1", 3, "Online, no set meeting time", "online"),
  section("chabot-csci-14", 1, "Mon/Wed 10:00–11:50 AM", "hybrid"),
  section("chabot-csci-14", 2, "Online, no set meeting time", "online"),
  section("chabot-csci-7", 1, "Tue/Thu 12:00–1:50 PM", "in-person"),
  section("chabot-engl-1", 1, "Mon/Wed/Fri 9:00–9:50 AM", "in-person"),
  section("chabot-engl-1", 2, "Tue/Thu 2:00–3:50 PM", "hybrid"),
  section("chabot-mth-21", 1, "Mon/Wed 12:00–1:50 PM", "in-person"),
];
