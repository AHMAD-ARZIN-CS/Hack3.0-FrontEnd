/**
 * Backend auth response → AuthSession.
 *
 * TEAMMATE: if your login returns different field names (uid, user_id, email_verified, school, ...),
 * map them here and nowhere else. Pages only ever see AuthSession.
 */
import { SUPPORTED_CAMPUSES } from "@/config/app";
import type { AuthSession, CampusId, StudentVerificationStatus } from "@/types/models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const ROLES = ["student", "faculty-staff", "organization"] as const;
const VERIFICATION: StudentVerificationStatus[] = ["unverified", "pending", "verified"];

export function toAuthSession(raw: Raw): AuthSession {
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === raw?.homeCampusId)?.id as CampusId | undefined;
  return {
    userId: String(raw.userId),
    displayName: String(raw.displayName ?? "Student"),
    email: String(raw.email ?? ""),
    emailVerified: Boolean(raw.emailVerified),
    onboardingComplete: Boolean(raw.onboardingComplete),
    homeCampusId: campus,
    // Unknown values fall back to the least-trusted state, never upward.
    studentVerification: VERIFICATION.includes(raw.studentVerification) ? raw.studentVerification : "unverified",
    role: ROLES.includes(raw.role) ? raw.role : "student",
    roleVerified: raw.roleVerified === true,
    // A backend session is never a demo session, whatever the payload says.
    isDemo: false,
  };
}
