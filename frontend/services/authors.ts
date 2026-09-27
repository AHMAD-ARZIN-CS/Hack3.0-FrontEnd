/**
 * Shared author lookup for mock mode. Returns PublicUser only: never email, phone, or IDs
 * beyond the user id. Used by community and academic services.
 */
import { MOCK_USERS } from "@/data/mock/users";
import { mockEventsForUser } from "@/services/contributions";
import { computeReputation } from "@/services/reputation";
import type { PublicUser } from "@/types/models";

export function mockPublicUser(userId: string): PublicUser {
  const rec = MOCK_USERS.find((u) => u.base.id === userId);
  if (!rec) return { id: userId, displayName: "Former member", campusId: "chabot", verifiedStudent: false };
  const b = rec.base;
  const { level } = computeReputation(mockEventsForUser(b.id));
  return {
    id: b.id,
    displayName: b.displayName,
    campusId: b.campusId,
    verifiedStudent: b.verifiedStudent,
    avatarUrl: b.avatarUrl,
    level,
    role: b.role ?? "student",
    roleVerified: b.roleVerified,
    roleTitle: b.roleTitle,
  };
}
