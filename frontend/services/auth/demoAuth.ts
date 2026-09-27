/**
 * DEMO auth (NEXT_PUBLIC_AUTH_MODE=demo). Not real authentication.
 *
 * Accounts and the signed-in user id live in localStorage so the demo survives reloads.
 * Passwords are length-checked by ./index.ts and never reach this file's storage: nothing here
 * stores, logs, or keeps a password. Sign-in accepts any password of valid length for a known email.
 */
import { MOCK_USERS, setMockCurrentUser } from "@/data/mock/users";
import { mockDelay } from "@/services/mock";
import type { AuthSession, OnboardingInput } from "@/types/models";
import { AuthError, PASSWORD_MIN } from "./errors";
import { notifySessionChange } from "./sessionEvents";
import type { AuthImplementation } from "./types";

export const DEMO_ACCOUNT_EMAIL = "demo.student@example.edu";

interface DemoAccount {
  userId: string;
  displayName: string; // public form: first name + last initial
  firstName: string;
  email: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  onboarding?: OnboardingInput;
  createdAt: string;
}

const ACCOUNTS_KEY = "ebl.mock.accounts";
const SESSION_KEY = "ebl.mock.session";

const DEMO_ACCOUNT: DemoAccount = {
  userId: "user_demo",
  displayName: "Demo S.",
  firstName: "Demo",
  email: DEMO_ACCOUNT_EMAIL,
  emailVerified: true,
  onboardingComplete: true,
  createdAt: "2026-01-15T00:00:00Z",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: session lasts until reload */
  }
}

const accounts = (): DemoAccount[] => read<DemoAccount[]>(ACCOUNTS_KEY, []);
const findAccount = (pred: (a: DemoAccount) => boolean): DemoAccount | undefined =>
  pred(DEMO_ACCOUNT) ? DEMO_ACCOUNT : accounts().find(pred);

function saveAccount(a: DemoAccount) {
  if (a.userId === DEMO_ACCOUNT.userId) return;
  write(ACCOUNTS_KEY, [...accounts().filter((x) => x.userId !== a.userId), a]);
}

/** Public name: first name + last initial (PublicUser rule). */
function publicName(fullName: string): { displayName: string; firstName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return { displayName: `${first}${lastInitial}`, firstName: first };
}

/** Make the mock data services see this account as the current user. */
function registerMockUser(a: DemoAccount) {
  if (a.userId !== DEMO_ACCOUNT.userId) {
    const existing = MOCK_USERS.find((u) => u.base.id === a.userId);
    const o = a.onboarding;
    const base = {
      id: a.userId,
      displayName: a.displayName,
      campusId: o?.homeCampusId ?? "chabot",
      verifiedStudent: false, // authenticated is not student-verified (D33)
      role: "student" as const,
      roleVerified: false,
      major: o?.major || undefined,
      academic: { currentCourseIds: o?.currentCourseIds ?? [], pastCourseIds: [] },
      interests: o?.interests ?? [],
      marketplaceCategories: [],
      offerings: [],
      joinedAt: a.createdAt,
      isDemo: true,
    };
    if (existing) existing.base = { ...existing.base, ...base };
    else MOCK_USERS.push({ base });
  }
  setMockCurrentUser(a.userId);
}

function toSession(a: DemoAccount): AuthSession {
  const isDemoStudent = a.userId === DEMO_ACCOUNT.userId;
  return {
    userId: a.userId,
    displayName: a.displayName,
    email: a.email,
    emailVerified: a.emailVerified,
    onboardingComplete: a.onboardingComplete,
    homeCampusId: isDemoStudent ? "chabot" : a.onboarding?.homeCampusId,
    studentVerification: isDemoStudent ? "verified" : "pending",
    role: "student",
    roleVerified: false,
    isDemo: true,
  };
}

// useSyncExternalStore needs the same object back until something changes.
let cachedKey: string | null = null;
let cachedSession: AuthSession | null = null;

function currentAccount(): DemoAccount | undefined {
  const s = read<{ userId: string } | null>(SESSION_KEY, null);
  return s ? findAccount((a) => a.userId === s.userId) : undefined;
}

function startSession(a: DemoAccount) {
  write(SESSION_KEY, { userId: a.userId });
  registerMockUser(a);
  notifySessionChange();
}

function requireAccount(): DemoAccount {
  const a = currentAccount();
  if (!a) throw new AuthError("invalid-credentials", "Sign in again.");
  return a;
}

export const demoAuth: AuthImplementation = {
  getSnapshot() {
    const a = currentAccount();
    const key = a ? JSON.stringify(a) : "none";
    if (key !== cachedKey) {
      cachedKey = key;
      cachedSession = a ? toSession(a) : null;
      if (a) registerMockUser(a);
    }
    return cachedSession;
  },

  async refresh() {
    return demoAuth.getSnapshot() ?? null;
  },

  async signUp({ displayName: fullName, email }) {
    if (findAccount((a) => a.email === email)) throw new AuthError("email-in-use", "An account with this email already exists. Sign in instead.", "email");
    const { displayName, firstName } = publicName(fullName);
    const account: DemoAccount = {
      userId: `user_${Date.now().toString(36)}`,
      displayName,
      firstName,
      email,
      emailVerified: false,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    saveAccount(account);
    startSession(account);
    return mockDelay(toSession(account), 300);
  },

  async signIn(email, password) {
    const account = findAccount((a) => a.email === email);
    // No password is stored, so none can be checked. Same generic message for unknown email or short password.
    if (!account || password.length < PASSWORD_MIN) {
      await mockDelay(null, 300);
      throw new AuthError("invalid-credentials", "Email or password is incorrect.");
    }
    startSession(account);
    return mockDelay(toSession(account), 300);
  },

  async signInAsDemo() {
    startSession(DEMO_ACCOUNT);
    return mockDelay(toSession(DEMO_ACCOUNT), 200);
  },

  async signOut() {
    write(SESSION_KEY, null);
    setMockCurrentUser(DEMO_ACCOUNT.userId);
    notifySessionChange();
  },

  async requestPasswordReset() {
    await mockDelay(null, 300);
  },

  async resendVerification() {
    await mockDelay(null, 300);
  },

  async changeEmail(email) {
    const a = requireAccount();
    if (findAccount((x) => x.email === email && x.userId !== a.userId)) throw new AuthError("email-in-use", "That email is already in use.", "email");
    const updated = { ...a, email, emailVerified: false };
    saveAccount(updated);
    notifySessionChange();
    return mockDelay(toSession(updated), 200);
  },

  /** Stands in for the user clicking the link in their inbox. */
  async simulateEmailVerified() {
    const updated = { ...requireAccount(), emailVerified: true };
    saveAccount(updated);
    notifySessionChange();
    return mockDelay(toSession(updated), 200);
  },

  async completeOnboarding(input) {
    const updated = { ...requireAccount(), onboarding: input, onboardingComplete: true };
    saveAccount(updated);
    registerMockUser(updated);
    notifySessionChange();
    return mockDelay(toSession(updated), 250);
  },

  onboardingNeeds() {
    return currentAccount()?.onboarding?.needs ?? [];
  },

  firstName() {
    return currentAccount()?.firstName;
  },
};
