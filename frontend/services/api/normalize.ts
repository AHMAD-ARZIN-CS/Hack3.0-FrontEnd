/**
 * Backend → frontend model adapters.
 * Today these assume the backend follows docs/DATA_CONTRACT.md exactly.
 * When the real backend differs (field names, dollars vs cents, Firestore timestamps),
 * fix it HERE. Never spread backend field names into components.
 */
import type {
  ContributionActivity,
  ContributionStats,
  Course,
  CourseSection,
  Resource,
  SectionModality,
  Term,
  UserCourse,
  UserProfile,
} from "@/types/models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const asList = (raw: Raw): Raw[] => (Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []);

// ---------- Courses (first data path to connect) ----------

export function normalizeCourse(raw: Raw): Course {
  return {
    id: String(raw.id),
    campusId: raw.campusId,
    code: String(raw.code ?? raw.courseCode ?? ""),
    title: String(raw.title ?? ""),
    subject: raw.subject ?? undefined,
    catalogUrl: raw.catalogUrl ?? undefined,
    // Only an explicit true counts. Missing data never upgrades a course to "checked".
    catalogVerified: raw.catalogVerified === true,
    resourceCount: raw.resourceCount ?? undefined,
    tipCount: raw.tipCount ?? undefined,
    isDemo: raw.isDemo ?? undefined,
  };
}

export function normalizeTerm(raw: Raw): Term {
  return {
    id: String(raw.id),
    campusId: raw.campusId,
    name: String(raw.name ?? ""),
    isCurrent: raw.isCurrent === true,
    academicYear: raw.academicYear ?? undefined,
    termType: raw.termType ?? undefined,
    startDate: raw.startDate ?? undefined,
    endDate: raw.endDate ?? undefined,
  };
}

const MODALITIES: SectionModality[] = ["in-person", "online", "hybrid"];

export function normalizeSection(raw: Raw): CourseSection {
  const official = raw.sectionCodeOfficial === true;
  return {
    id: String(raw.id),
    campusId: raw.campusId,
    termId: String(raw.termId),
    courseId: String(raw.courseId),
    sectionCode: String(raw.sectionCode ?? ""),
    // A code is shown as official only when the backend says so AND names its source.
    sectionCodeOfficial: official && !!raw.source?.url,
    instructorName: raw.instructorName ?? undefined,
    meetingInfo: raw.meetingInfo ?? undefined,
    location: raw.location ?? undefined,
    modality: MODALITIES.includes(raw.modality) ? raw.modality : undefined,
    source: {
      kind: official ? "official-import" : "demo",
      url: raw.source?.url ?? undefined,
      retrievedAt: raw.source?.retrievedAt ?? undefined,
    },
    isDemo: raw.isDemo ?? undefined,
  };
}

export function normalizeSectionSearch(raw: Raw): { course: Course; sections: CourseSection[] }[] {
  return asList(raw).map((r) => ({ course: normalizeCourse(r.course), sections: asList(r.sections).map(normalizeSection) }));
}

export function normalizeUserCourse(raw: Raw): UserCourse {
  return {
    id: String(raw.id),
    userId: String(raw.userId),
    courseId: String(raw.courseId),
    course: normalizeCourse(raw.course),
    termId: raw.termId ?? undefined,
    sectionId: raw.sectionId ?? undefined,
    section: raw.section ? normalizeSection(raw.section) : undefined,
    status: raw.status === "past" ? "past" : "current",
    addedAt: raw.addedAt ?? undefined,
  };
}

export const normalizeList = <T>(raw: Raw, fn: (r: Raw) => T): T[] => asList(raw).map(fn);

export function normalizeResource(raw: Raw): Resource {
  return {
    id: String(raw.id),
    campusId: raw.campusId,
    servesCampusIds: raw.servesCampusIds ?? undefined,
    title: raw.title,
    category: raw.category,
    needs: raw.needs ?? [],
    description: raw.description ?? "",
    provider: raw.provider ?? "",
    url: raw.url,
    locationName: raw.locationName ?? undefined,
    address: raw.address ?? undefined,
    phone: raw.phone ?? undefined,
    hours: raw.hours ?? undefined,
    eligibility: raw.eligibility ?? undefined,
    onCampus: Boolean(raw.onCampus),
    verified: Boolean(raw.verified),
    lastVerifiedAt: raw.lastVerifiedAt ?? undefined,
    isEmergency: raw.isEmergency ?? undefined,
    isDemo: raw.isDemo ?? undefined,
  };
}

const ZERO_STATS: ContributionStats = {
  resourcesApproved: 0,
  tipsApproved: 0,
  helpfulVotesReceived: 0,
  studentsHelped: 0,
  communityPostsHelpful: 0,
  communityAnswersHelpful: 0,
  verifiedResources: 0,
  verifiedExchanges: 0,
};

/**
 * Profile from backend. Fills missing arrays/stats so the UI never crashes on partial data,
 * and drops any field not in the contract (so stray private fields can never render).
 */
export function normalizeProfile(raw: Raw): UserProfile {
  return {
    id: String(raw.id),
    displayName: raw.displayName ?? "Student",
    campusId: raw.campusId,
    verifiedStudent: Boolean(raw.verifiedStudent),
    avatarUrl: raw.avatarUrl ?? undefined,
    major: raw.major ?? undefined,
    bio: raw.bio ?? undefined,
    academic: {
      currentCourseIds: raw.academic?.currentCourseIds ?? [],
      pastCourseIds: raw.academic?.pastCourseIds ?? [],
    },
    interests: raw.interests ?? [],
    marketplaceCategories: raw.marketplaceCategories ?? [],
    offerings: raw.offerings ?? [],
    stats: { ...ZERO_STATS, ...(raw.stats ?? {}) },
    points: raw.points ?? 0,
    level: raw.level ?? 1,
    levelName: raw.levelName ?? "Newcomer",
    nextLevelAt: raw.nextLevelAt ?? undefined,
    badges: raw.badges ?? [],
    recentContributions: raw.recentContributions ?? [],
    joinedAt: raw.joinedAt,
    isDemo: raw.isDemo ?? undefined,
  };
}

export function normalizeActivity(raw: Raw): ContributionActivity {
  const days = raw.days ?? [];
  return {
    userId: String(raw.userId),
    startDate: raw.startDate,
    endDate: raw.endDate,
    days,
    total: raw.total ?? days.reduce((s: number, d: { count: number }) => s + d.count, 0),
  };
}
