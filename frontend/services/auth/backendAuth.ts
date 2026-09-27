/**
 * BACKEND auth (NEXT_PUBLIC_AUTH_MODE=backend).
 *
 * TEAMMATE: this is the one file to wire your existing login/validation into.
 * The endpoints below are the PROPOSED contract in docs/DATA_CONTRACT.md §9, not a confirmed API.
 * Replace each call with your real auth (REST endpoint or a provider SDK such as Firebase Auth),
 * and map the response in ./authAdapter.ts. Pages and ./index.ts do not change.
 *
 * Rules that stay true whatever you plug in:
 * - Passwords go straight to the provider. Never store, log, or cache them.
 * - Keep the session where the provider intends (an httpOnly cookie, or the SDK's own storage).
 *   Do not copy tokens into localStorage by hand.
 * - Anything the UI hides is not security. The backend checks identity and ownership on every request.
 */
import { ApiError, apiGet, apiPatch, apiPost } from "@/services/api/client";
import type { AuthSession } from "@/types/models";
import { toAuthSession } from "./authAdapter";
import { AuthError } from "./errors";
import { notifySessionChange } from "./sessionEvents";
import type { AuthImplementation } from "./types";

let session: AuthSession | null | undefined; // undefined = not loaded yet

function setSession(raw: unknown): AuthSession {
  session = toAuthSession(raw);
  notifySessionChange();
  return session;
}

/** Turn transport errors into messages safe to show. Raw backend text never reaches the screen. */
function toAuthError(e: unknown, fallback: AuthError): AuthError {
  if (e instanceof AuthError) return e;
  if (e instanceof ApiError) {
    if (e.status === 0 || e.status >= 500) return new AuthError("network", "We couldn't reach sign-in. Check your connection and try again.");
    if (e.status === 409) return new AuthError("email-in-use", "An account with this email already exists. Sign in instead.", "email");
  }
  return fallback;
}

export const backendAuth: AuthImplementation = {
  getSnapshot() {
    return session;
  },

  async refresh() {
    try {
      const raw = await apiGet<unknown>("/auth/session");
      session = raw ? toAuthSession(raw) : null;
    } catch {
      // Treat any failure as signed out. The gate sends the person to sign in again.
      session = null;
    }
    notifySessionChange();
    return session;
  },

  async signUp({ displayName, email, password }) {
    try {
      return setSession(await apiPost("/auth/sign-up", { displayName, email, password }));
    } catch (e) {
      throw toAuthError(e, new AuthError("network", "Couldn't create your account. Try again."));
    }
  },

  async signIn(email, password) {
    try {
      return setSession(await apiPost("/auth/sign-in", { email, password }));
    } catch (e) {
      // 400/401/403 and unknown errors all read the same, so the form never reveals which emails exist.
      throw toAuthError(e, new AuthError("invalid-credentials", "Email or password is incorrect."));
    }
  },

  async signInAsDemo() {
    throw new AuthError("not-configured", "Demo sign-in is only available in the demo.");
  },

  async signOut() {
    try {
      await apiPost("/auth/sign-out");
    } finally {
      // Clear locally even if the request fails, so a shared computer never stays signed in on screen.
      session = null;
      notifySessionChange();
    }
  },

  async requestPasswordReset(email) {
    try {
      await apiPost("/auth/password-reset", { email });
    } catch (e) {
      // Only network trouble is reported. "No such account" must look like success (no account enumeration).
      if (e instanceof ApiError && (e.status === 0 || e.status >= 500))
        throw new AuthError("network", "We couldn't reach sign-in. Check your connection and try again.");
    }
  },

  async resendVerification() {
    try {
      await apiPost("/auth/verification/resend");
    } catch (e) {
      throw toAuthError(e, new AuthError("network", "Couldn't send the email. Try again."));
    }
  },

  async changeEmail(email) {
    try {
      return setSession(await apiPatch("/auth/email", { email }));
    } catch (e) {
      throw toAuthError(e, new AuthError("network", "Couldn't update your email. Try again."));
    }
  },

  async simulateEmailVerified() {
    throw new AuthError("not-configured", "Email verification happens through the link we sent.");
  },

  async completeOnboarding(input) {
    try {
      return setSession(await apiPost("/me/onboarding", input));
    } catch (e) {
      throw toAuthError(e, new AuthError("network", "Couldn't save. Try again."));
    }
  },

  // TODO(backend): return the private onboarding needs with the session once the profile endpoint exists.
  onboardingNeeds() {
    return [];
  },

  firstName() {
    return session?.displayName.split(" ")[0];
  },
};
