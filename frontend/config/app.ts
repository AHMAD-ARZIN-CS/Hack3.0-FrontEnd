/**
 * Central app configuration. Do not scatter these values elsewhere.
 * See docs/ARCHITECTURE.md §5-8.
 */
import type { Campus, CampusId, NeedId, ResourceCategory } from "@/types/models";

export type DataMode = "mock" | "api";
export type AuthMode = "demo" | "backend";

/** Where app data comes from. Services pick their implementation from this, never components. */
export const DATA_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";

/**
 * Where sign-in comes from. Separate from DATA_MODE so the team can connect real auth first
 * while the rest of the app still runs on demo data. Defaults to follow DATA_MODE.
 */
export const AUTH_MODE: AuthMode =
  process.env.NEXT_PUBLIC_AUTH_MODE === "backend" || process.env.NEXT_PUBLIC_AUTH_MODE === "demo"
    ? process.env.NEXT_PUBLIC_AUTH_MODE
    : DATA_MODE === "api"
      ? "backend"
      : "demo";

export const API_URL: string = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Demo-only controls ("Continue as demo student", "Demo: act as moderator", ...).
 * Screens read these flags instead of comparing mode strings, so switching to the real
 * backend hides every simulation in one place.
 */
export const SHOW_DEMO_AUTH_CONTROLS = AUTH_MODE === "demo";
export const SHOW_DEMO_DATA_CONTROLS = DATA_MODE === "mock";

/** Approximate campus centers. Used only for campus-relative distance. */
export const SUPPORTED_CAMPUSES: Campus[] = [
  {
    id: "chabot",
    name: "Chabot College",
    shortName: "Chabot",
    city: "Hayward",
    center: { lat: 37.642, lng: -122.105 },
    websiteUrl: "https://www.chabotcollege.edu",
  },
  {
    id: "dvc",
    name: "Diablo Valley College",
    shortName: "DVC",
    city: "Pleasant Hill",
    center: { lat: 37.969, lng: -122.071 },
    websiteUrl: "https://www.dvc.edu",
  },
  {
    id: "csueb",
    name: "California State University, East Bay",
    shortName: "CSUEB",
    city: "Hayward",
    center: { lat: 37.656, lng: -122.057 },
    websiteUrl: "https://www.csueastbay.edu",
  },
];

// NEXT_PUBLIC_CAMPUS is the name in the team's integration pack. NEXT_PUBLIC_DEFAULT_CAMPUS still works.
const CAMPUS_ENV = process.env.NEXT_PUBLIC_CAMPUS || process.env.NEXT_PUBLIC_DEFAULT_CAMPUS;

export const DEFAULT_CAMPUS: CampusId =
  CAMPUS_ENV && SUPPORTED_CAMPUSES.some((c) => c.id === CAMPUS_ENV) ? (CAMPUS_ENV as CampusId) : "chabot";

/**
 * Home screen needs, in student language. Order = display order.
 * href: where the Home tile goes.
 * feature: optional extra destination shown as a banner on the resources page.
 */
export const NEEDS: {
  id: NeedId;
  label: string; // "I need food"
  short: string; // "Food"
  resourceCategories: ResourceCategory[];
  href: string;
  feature?: { href: string; label: string };
}[] = [
  { id: "study", label: "I need study help", short: "Study", resourceCategories: ["academic"], href: "/academic", feature: { href: "/academic", label: "Notes & study guides from students" } },
  { id: "food", label: "I need food", short: "Food", resourceCategories: ["food"], href: "/food", feature: { href: "/food", label: "Discounted food near campus" } },
  { id: "housing", label: "I need housing", short: "Housing", resourceCategories: ["housing"], href: "/housing", feature: { href: "/housing", label: "Find a room or roommate among students" } },
  { id: "money", label: "I need financial help", short: "Money", resourceCategories: ["financial"], href: "/resources?need=money" },
  { id: "safety", label: "I need safety help", short: "Safety", resourceCategories: ["safety"], href: "/safety" },
];

/**
 * Primary navigation (D18, D35). Bottom tabs on phones, labeled sidebar on desktop.
 * `match`: extra path prefixes that mark the item active. Discover owns several top-level
 * routes so existing URLs (/food, /resources, /marketplace) keep working.
 * `hint` shows under the label on desktop so each area explains itself.
 */
export type NavIcon = "community" | "academic" | "discover" | "housing" | "profile";
export const NAV_ITEMS: { href: string; label: string; hint: string; icon: NavIcon; match: string[] }[] = [
  { href: "/", label: "Community", hint: "What's happening on campus", icon: "community", match: ["/community"] },
  { href: "/academic", label: "Academic", hint: "Help with your courses", icon: "academic", match: ["/academic"] },
  { href: "/discover", label: "Discover", hint: "Food, resources, marketplace", icon: "discover", match: ["/discover", "/food", "/resources", "/marketplace", "/opportunities", "/safety"] },
  { href: "/housing", label: "Housing", hint: "Rooms and roommates", icon: "housing", match: ["/housing"] },
  { href: "/profile", label: "Profile", hint: "You, your courses, your help", icon: "profile", match: ["/profile"] },
];

/** Discover destinations (D18, D35). Order = what students look for most. "later" shows but doesn't link. */
export type DiscoverIcon = "food" | "marketplace" | "resources" | "opportunities";
export const DISCOVER_SECTIONS: {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: DiscoverIcon;
  status: "live" | "later";
}[] = [
  { id: "food", title: "Food & Basic Needs", description: "Free food, pantries, CalFresh, and discounted meals near campus.", href: "/food", icon: "food", status: "live" },
  { id: "marketplace", title: "Marketplace", description: "Buy, sell, or give away textbooks, supplies, and dorm items.", href: "/marketplace", icon: "marketplace", status: "live" },
  { id: "resources", title: "Campus Resources", description: "Tutoring, financial aid, health, transit, and safety help.", href: "/resources", icon: "resources", status: "live" },
  { id: "opportunities", title: "Opportunities", description: "Jobs, internships, research, and programs. Opening after the demo.", href: "/opportunities", icon: "opportunities", status: "later" },
];

/**
 * Auth routes (D33).
 * PUBLIC: anyone, no app chrome (landing, sign in/up, reset, privacy).
 * AUTH_FLOW: signed in but not finished (verify email, onboarding). Focused layout, no tabs.
 * Everything else needs a signed-in, email-verified, onboarded account.
 */
export const PUBLIC_ROUTES = ["/welcome", "/login", "/signup", "/forgot-password", "/privacy"] as const;
export const AUTH_FLOW_ROUTES = ["/verify-email", "/onboarding"] as const;

/** Feature flags. Flip to hide unfinished areas from the demo. */
export const FEATURES = {
  food: true,
  marketplace: true,
  housing: true,
  community: true,
  createListing: true,
  studentVoice: false, // Post kind "concern": deferred until reviewed
  /** Paid academic resources (D27). OFF until payments + legal review. Never for notes. */
  paidAcademic: false,
} as const;

/** Simulated latency for mock services (ms). */
export const MOCK_LATENCY_MS = 250;

export const APP_NAME = "East Bay Link";
export const APP_TAGLINE = "Find student resources, deals, and people near your campus.";
