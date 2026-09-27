import type { AuthSession, OnboardingInput } from "@/types/models";

/**
 * What any auth implementation must provide. The public functions in ./index.ts validate
 * input first, then call one of these. Pages never see which implementation is active.
 *
 * Passwords arrive here only as call arguments. Implementations must pass them straight to the
 * provider and never store, log, or cache them.
 */
export interface AuthImplementation {
  /** `undefined` = not known yet (still loading). `null` = signed out. */
  getSnapshot(): AuthSession | null | undefined;
  refresh(): Promise<AuthSession | null>;
  signUp(input: { displayName: string; email: string; password: string }): Promise<AuthSession>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signInAsDemo(): Promise<AuthSession>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  changeEmail(email: string): Promise<AuthSession>;
  simulateEmailVerified(): Promise<AuthSession>;
  completeOnboarding(input: OnboardingInput): Promise<AuthSession>;
  onboardingNeeds(): string[];
  firstName(): string | undefined;
}
