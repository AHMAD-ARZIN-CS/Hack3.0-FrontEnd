/**
 * Authentication service (D33, D39). The ONLY place the UI talks to auth.
 *
 * Pages call these functions. Each one validates input the same way in every mode, then hands
 * off to the implementation chosen by NEXT_PUBLIC_AUTH_MODE:
 *   demo    → ./demoAuth.ts     (simulated accounts in the browser, for the hackathon demo)
 *   backend → ./backendAuth.ts  (the team's real auth; responses mapped in ./authAdapter.ts)
 *
 * Authenticated ≠ student verified ≠ faculty/staff verified (types/auth.ts).
 */
import { AUTH_MODE, SUPPORTED_CAMPUSES } from "@/config/app";
import type { AuthSession, OnboardingInput, SignInInput, SignUpInput } from "@/types/models";
import { backendAuth } from "./backendAuth";
import { demoAuth } from "./demoAuth";
import { AuthError, PASSWORD_MIN } from "./errors";
import type { AuthImplementation } from "./types";

export { AuthError, PASSWORD_MIN } from "./errors";
export { DEMO_ACCOUNT_EMAIL } from "./demoAuth";
export { subscribeSession } from "./sessionEvents";

const impl: AuthImplementation = AUTH_MODE === "backend" ? backendAuth : demoAuth;

// Demo mode: register the stored demo user before any page renders, so data services see the right person.
if (typeof window !== "undefined" && AUTH_MODE === "demo") impl.getSnapshot();

// ---------- validation (same rules in every mode; the backend repeats them) ----------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkEmail(email: string): string {
  const e = email.trim().toLowerCase();
  if (!EMAIL.test(e)) throw new AuthError("invalid-email", "Enter a valid email address.", "email");
  return e;
}

// ---------- session ----------

/** `undefined` = unknown yet (server render, or backend session still loading). */
export const getSessionSnapshot = (): AuthSession | null | undefined => impl.getSnapshot();

/** Backend: load the session from the provider. Demo: returns the stored demo session. */
export const refreshSession = (): Promise<AuthSession | null> => impl.refresh();

// ---------- actions ----------

export async function signUp(input: SignUpInput): Promise<AuthSession> {
  const name = input.displayName.trim();
  if (name.length < 2) throw new AuthError("invalid-email", "Enter your name.", "displayName");
  const email = checkEmail(input.email);
  if (input.password.length < PASSWORD_MIN) throw new AuthError("weak-password", `Use at least ${PASSWORD_MIN} characters.`, "password");
  if (!input.confirmsStudent)
    throw new AuthError("not-student", "East Bay Link is for current students at these campuses right now.", "confirmsStudent");
  if (!input.acceptsTerms) throw new AuthError("terms-required", "Please accept the community guidelines and privacy notice.", "acceptsTerms");
  return impl.signUp({ displayName: name, email, password: input.password });
}

export async function signIn(input: SignInInput): Promise<AuthSession> {
  const email = checkEmail(input.email);
  if (!input.password) throw new AuthError("invalid-credentials", "Enter your password.", "password");
  return impl.signIn(email, input.password);
}

/** Demo only: one tap into the demo student account. */
export const signInAsDemo = (): Promise<AuthSession> => impl.signInAsDemo();

export const signOut = (): Promise<void> => impl.signOut();

/** Always shows the same confirmation, whether or not the email has an account (no account enumeration). */
export async function requestPasswordReset(email: string): Promise<void> {
  return impl.requestPasswordReset(checkEmail(email));
}

export const resendVerification = (): Promise<void> => impl.resendVerification();

export async function changeEmail(newEmail: string): Promise<AuthSession> {
  return impl.changeEmail(checkEmail(newEmail));
}

/** Demo only: stands in for clicking the link in the inbox. Backend mode uses refreshSession(). */
export const simulateEmailVerifiedMock = (): Promise<AuthSession> => impl.simulateEmailVerified();

export async function completeOnboarding(input: OnboardingInput): Promise<AuthSession> {
  if (!SUPPORTED_CAMPUSES.some((c) => c.id === input.homeCampusId)) throw new AuthError("invalid-email", "Choose your campus.", "homeCampusId");
  const clean: OnboardingInput = {
    ...input,
    major: input.major?.trim().slice(0, 80) || undefined,
    currentCourseIds: input.currentCourseIds.slice(0, 8),
    interests: input.interests.slice(0, 12),
    needs: input.needs.slice(0, 8),
  };
  return impl.completeOnboarding(clean);
}

/** Private onboarding answers for Home personalization. Own session only. */
export const getMyOnboardingNeeds = (): string[] => impl.onboardingNeeds();

/** First name for the greeting. Own session only. */
export const getMyFirstName = (): string | undefined => impl.firstName();

/** Where a session should land. Used by the auth gate and after sign-in. */
export function nextStepFor(session: AuthSession | null): "/welcome" | "/verify-email" | "/onboarding" | "/" {
  if (!session) return "/welcome";
  if (!session.emailVerified) return "/verify-email";
  if (!session.onboardingComplete) return "/onboarding";
  return "/";
}
