/**
 * Blocking (moderation prep, D31). A viewer can block another user.
 * Effect today: the blocked user's marketplace listings disappear for the viewer,
 * and the viewer can't send them requests. Other features can read isBlockedMock later.
 *
 * mock: in-memory set for the current user. Resets on reload.
 * api:  GET /me/blocks, POST /me/blocks { userId }, POST /me/blocks/:userId/remove (DATA_CONTRACT §8).
 * Community (services/community.ts) uses this same list, so one block hides posts, comments, and listings.
 * Blocking is private. The blocked person is never told.
 */
import { DATA_MODE } from "@/config/app";
import { CURRENT_USER_ID } from "@/data/mock/users";
import { apiGet, apiPost } from "@/services/api/client";
import { mockDelay } from "@/services/mock";

const blocked = new Set<string>();

export class BlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockError";
  }
}

/** Mock-only sync check for other services. In api mode the backend filters blocked users. */
export function isBlockedMock(userId: string): boolean {
  return blocked.has(userId);
}

export async function getBlockedUserIds(): Promise<string[]> {
  if (DATA_MODE === "api") return apiGet<string[]>("/me/blocks");
  return mockDelay([...blocked], 100);
}

export async function blockUser(userId: string): Promise<{ userId: string; blocked: true }> {
  if (userId === CURRENT_USER_ID) throw new BlockError("You can't block yourself.");
  if (DATA_MODE === "api") return apiPost<{ userId: string; blocked: true }>("/me/blocks", { userId });
  blocked.add(userId);
  return mockDelay({ userId, blocked: true as const }, 120);
}

export async function unblockUser(userId: string): Promise<{ userId: string; blocked: false }> {
  if (DATA_MODE === "api") return apiPost<{ userId: string; blocked: false }>(`/me/blocks/${encodeURIComponent(userId)}/remove`);
  blocked.delete(userId);
  return mockDelay({ userId, blocked: false as const }, 120);
}
