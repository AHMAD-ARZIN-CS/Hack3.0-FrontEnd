/**
 * Authentication + verification models (D33). Status: LIVE on demo auth (`services/auth/`).
 * Mirrors docs/DATA_CONTRACT.md §9.
 *
 * Three separate states, never merged:
 * 1. ACCOUNT AUTHENTICATED: signed in with a verified email (auth provider).
 * 2. STUDENT VERIFIED: the backend confirmed current enrollment at the campus. Not implied by 1.
 * 3. FACULTY/STAFF VERIFIED: a reviewed role. Never from an institutional email alone (D25).
 *    Sign-up in this MVP is students only, so new accounts never start with a staff role.
 *
 * Passwords never appear in any model. They go straight from the form to the auth provider.
 */
import type { CampusId } from "./models";

export type StudentVerificationStatus = "unverified" | "pending" | "verified";

/** What the app knows about the signed-in person. No password, no token. */
export interface AuthSession {
  userId: string;
  displayName: string;
  /** Visible only to the account owner (verify-email screen, settings). Never on public profiles. */
  email: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  /** Set during onboarding. */
  homeCampusId?: CampusId;
  studentVerification: StudentVerificationStatus;
  /** Always "student" for self sign-up (D33). Faculty/staff/org accounts are created by review. */
  role: "student" | "faculty-staff" | "organization";
  roleVerified: boolean;
  /** Mock-only demo session. Never true in api mode. */
  isDemo?: boolean;
}

export interface SignUpInput {
  displayName: string;
  email: string;
  /** Sent to the auth provider only. Never stored. */
  password: string;
  /** "I'm a current student at Chabot, DVC, or CSUEB." Required: sign-up is students only (D33). */
  confirmsStudent: boolean;
  acceptsTerms: boolean;
}

export interface SignInInput {
  email: string;
  /** Sent to the auth provider only. Never stored. */
  password: string;
}

export type StudentStanding = "new" | "continuing" | "transfer-track" | "returning";

/** Progressive onboarding answers. Only campus is required. */
export interface OnboardingInput {
  homeCampusId: CampusId;
  major?: string;
  standing?: StudentStanding;
  currentCourseIds: string[];
  /** Public interest tags (config INTEREST_TAGS). */
  interests: string[];
  /** Private: used to personalize Home only. Never shown on the profile. */
  needs: string[];
}

export type AuthErrorCode =
  | "invalid-credentials"
  | "email-in-use"
  | "weak-password"
  | "invalid-email"
  | "not-student"
  | "terms-required"
  | "network"
  | "not-configured";
