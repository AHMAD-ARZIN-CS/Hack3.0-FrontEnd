/**
 * MOCK USERS — demonstration data. Every record is isDemo: true.
 * Names are placeholders ("Demo Student X.", "Demo Instructor R."), not real people.
 * Faculty/staff and organization accounts exist to demo role display (D25). Their roleVerified
 * flag stands for a future review process, never for "has a college email".
 *
 * Privacy (DECISIONS D22, D24): these records intentionally have NO email, phone,
 * student ID, grades, or address fields. Do not add them.
 *
 * Housing offerings are NOT stored here: they are derived from housing posts
 * (HousingPost.profileVisibility is the single source of truth, D28).
 *
 * Stats, points, level, badges, the contribution graph, and history are NOT stored here (D32).
 * services/contributions.ts records ContributionEvents from real mock records (approved academic
 * content, helpful votes, helpful community posts) and services/reputation.ts computes the rest.
 * Dates are stored as "days ago" so the demo always looks current.
 */
import type { UserProfile } from "@/types/models";

type ComputedKeys = "stats" | "points" | "level" | "levelName" | "nextLevelAt" | "badges" | "recentContributions";

export interface MockUserRecord {
  base: Omit<UserProfile, ComputedKeys>;
}

/**
 * The signed-in mock user. `let` + live ES module binding: every service reads the current value
 * at call time. Only services/auth/demoAuth.ts changes it (setMockCurrentUser). Default = the demo student.
 */
export let CURRENT_USER_ID = "user_demo";

export function setMockCurrentUser(userId: string): void {
  CURRENT_USER_ID = userId;
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    base: {
      id: "user_demo",
      displayName: "Demo S.",
      campusId: "chabot",
      verifiedStudent: true,
      major: "Computer Science",
      bio: "Transfer-track CS student. I share calculus notes and C++ study guides.",
      academic: {
        currentCourseIds: ["chabot-mth-1", "chabot-csci-14"],
        pastCourseIds: ["chabot-mth-21", "chabot-csci-7", "chabot-engl-1"],
      },
      interests: ["programming", "soccer", "cybersecurity", "transfer"],
      marketplaceCategories: ["books", "electronics"],
      offerings: [
        {
          id: "off_demo_tutoring",
          category: "tutoring",
          direction: "offering",
          label: "Offering MTH 21 tutoring",
          visibility: "public",
        },
      ],
      joinedAt: "2026-01-15T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "user_maya",
      displayName: "Demo Student M.",
      campusId: "chabot",
      verifiedStudent: true,
      major: "Nursing",
      academic: { currentCourseIds: ["chabot-mth-21"], pastCourseIds: ["chabot-engl-1"] },
      interests: ["hiking", "music", "volunteering"],
      marketplaceCategories: ["books", "supplies"],
      offerings: [
        {
          id: "off_maya_food",
          category: "food",
          direction: "seeking",
          label: "Looking for food resources",
          visibility: "hidden", // sensitive need: stays private
        },
      ],
      joinedAt: "2026-03-02T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "user_jordan",
      displayName: "Demo Student J.",
      campusId: "csueb",
      verifiedStudent: true,
      major: "Business Administration",
      bio: "Commuter student. Happy to share tips.",
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: ["basketball", "entrepreneurship"],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-06-10T00:00:00Z",
      isDemo: true,
    },
  },
  {
    // Minimal profile: tests missing optional fields and empty states.
    base: {
      id: "user_new",
      displayName: "Demo Student K.",
      campusId: "dvc",
      verifiedStudent: false,
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: [],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-09-20T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "staff_rivera",
      displayName: "Demo Instructor R.",
      campusId: "chabot",
      verifiedStudent: false,
      role: "faculty-staff",
      roleVerified: true,
      roleTitle: "Mathematics instructor (demo)",
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: [],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-08-01T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "staff_unverified",
      displayName: "Demo Staff T.",
      campusId: "chabot",
      verifiedStudent: false,
      role: "faculty-staff",
      roleVerified: false, // claims staff role, not yet confirmed
      roleTitle: "Staff (role not confirmed)",
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: [],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-09-10T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "org_robotics",
      displayName: "Demo Robotics Club",
      campusId: "chabot",
      verifiedStudent: false,
      role: "organization",
      roleVerified: true,
      roleTitle: "Student club (demo)",
      bio: "Sample student organization for the demo.",
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: ["programming"],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-02-01T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "user_sam",
      displayName: "Demo Student A.",
      campusId: "chabot",
      verifiedStudent: true,
      major: "Kinesiology",
      academic: { currentCourseIds: ["chabot-engl-1"], pastCourseIds: [] },
      interests: ["basketball", "cooking"],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-05-12T00:00:00Z",
      isDemo: true,
    },
  },
  {
    base: {
      id: "user_lee",
      displayName: "Demo Student L.",
      campusId: "chabot",
      verifiedStudent: false, // unverified: tests the Verified-only filter
      academic: { currentCourseIds: [], pastCourseIds: [] },
      interests: ["gaming"],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: "2026-09-01T00:00:00Z",
      isDemo: true,
    },
  },
];
