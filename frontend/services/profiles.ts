/**
 * Profile service. The ONLY way UI gets profile data.
 *
 * mock mode: builds UserProfile from data/mock/users.ts + contribution events (services/contributions.ts)
 *            scored by services/reputation.ts with config/reputation.ts (D32).
 * api mode:  GET /me/profile, GET /users/:id/profile, GET /users/:id/activity,
 *            PATCH /me/offerings/:id  (docs/DATA_CONTRACT.md §7b, §8)
 *
 * Privacy (D22, D24):
 * - Public view returns only offerings with visibility "public".
 * - Profiles never contain email, phone, student ID, grades, or address.
 */
import { ACTIVITY_WEEKS, PUBLIC_HISTORY_LIMIT } from "@/config/reputation";
import { DATA_MODE } from "@/config/app";
import { CURRENT_USER_ID, MOCK_USERS, type MockUserRecord } from "@/data/mock/users";
import { apiGet, apiPatch } from "@/services/api/client";
import { normalizeActivity, normalizeProfile } from "@/services/api/normalize";
import { mockDelay, NotFoundError } from "@/services/mock";
import { mockHousingOfferings, setHousingProfileVisibility } from "@/services/housing";
import { mockMarketplaceOfferings, setListingProfileVisibility } from "@/services/marketplace";
import { mockEventsForUser } from "@/services/contributions";
import { computeActivity, computeHistory, computeReputation } from "@/services/reputation";
import type {
  ContributionActivity,
  ProfileOffering,
  UserProfile,
  Visibility,
} from "@/types/models";

function findRecord(userId: string): MockUserRecord {
  const rec = MOCK_USERS.find((u) => u.base.id === userId);
  if (!rec) throw new NotFoundError("Profile");
  return rec;
}

/** Everything reputation-related comes from the contribution ledger (D32). */
function buildProfile(rec: MockUserRecord, view: "own" | "public"): UserProfile {
  const events = mockEventsForUser(rec.base.id);
  const rep = computeReputation(events);
  const history = computeHistory(events);
  return {
    ...rec.base,
    stats: rep.stats,
    // Housing offerings come from housing posts (single source of truth, D28).
    offerings: [
      ...mockHousingOfferings(rec.base.id, view),
      // Marketplace offerings come from listings the seller chose to show (D31).
      ...mockMarketplaceOfferings(rec.base.id, view),
      ...(view === "own" ? rec.base.offerings : rec.base.offerings.filter((o) => o.visibility === "public")),
    ],
    level: rep.level,
    levelName: rep.levelName,
    points: rep.points,
    nextLevelAt: rep.nextLevelAt,
    badges: rep.badges,
    recentContributions: view === "own" ? history : history.slice(0, PUBLIC_HISTORY_LIMIT),
  };
}

// ---------- Public API ----------

/** Signed-in user's own profile: includes hidden offerings and full history. */
export async function getMyProfile(): Promise<UserProfile> {
  if (DATA_MODE === "api") return normalizeProfile(await apiGet("/me/profile"));
  return mockDelay(buildProfile(findRecord(CURRENT_USER_ID), "own"));
}

/** Any user's PUBLIC profile. Also used for "view as others see you". */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (DATA_MODE === "api") return normalizeProfile(await apiGet(`/users/${encodeURIComponent(userId)}/profile`));
  return mockDelay(buildProfile(findRecord(userId), "public"));
}

export async function getContributionActivity(userId: string): Promise<ContributionActivity> {
  if (DATA_MODE === "api") {
    return normalizeActivity(await apiGet(`/users/${encodeURIComponent(userId)}/activity`, { weeks: ACTIVITY_WEEKS }));
  }
  findRecord(userId);
  return mockDelay(computeActivity(userId, mockEventsForUser(userId), ACTIVITY_WEEKS));
}

/** Owner-only. Mock: changes last until page reload. */
export async function setOfferingVisibility(offeringId: string, visibility: Visibility): Promise<ProfileOffering> {
  if (DATA_MODE === "api") return apiPatch<ProfileOffering>(`/me/offerings/${encodeURIComponent(offeringId)}`, { visibility });
  if (offeringId.startsWith("off_housing_")) {
    const post = await setHousingProfileVisibility(offeringId.slice("off_housing_".length), visibility);
    return mockHousingOfferings(post.authorId, "own").find((o) => o.id === offeringId)!;
  }
  if (offeringId.startsWith("off_listing_")) {
    const listing = await setListingProfileVisibility(offeringId.slice("off_listing_".length), visibility);
    return mockMarketplaceOfferings(listing.sellerId, "own").find((o) => o.id === offeringId)!;
  }
  const me = findRecord(CURRENT_USER_ID);
  const offering = me.base.offerings.find((o) => o.id === offeringId);
  if (!offering) throw new NotFoundError("Offering");
  offering.visibility = visibility;
  return mockDelay(offering, 150);
}

/** Demo helper: other mock profiles to browse. Mock mode only. */
export async function listDemoProfiles(): Promise<{ id: string; displayName: string; campusId: string }[]> {
  if (DATA_MODE === "api") return [];
  return mockDelay(
    MOCK_USERS.filter((u) => u.base.id !== CURRENT_USER_ID).map((u) => ({
      id: u.base.id,
      displayName: u.base.displayName,
      campusId: u.base.campusId,
    })),
  );
}
