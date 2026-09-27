/**
 * Current user service. Mock user until auth is decided (DECISIONS Q6).
 * api mode: GET /me
 */
import { DATA_MODE } from "@/config/app";
import { CURRENT_USER_ID, MOCK_USERS } from "@/data/mock/users";
import { apiGet } from "@/services/api/client";
import { mockDelay } from "@/services/mock";
import type { CurrentUser } from "@/types/models";

export async function getCurrentUser(): Promise<CurrentUser> {
  if (DATA_MODE === "api") return apiGet<CurrentUser>("/me");
  const me = MOCK_USERS.find((u) => u.base.id === CURRENT_USER_ID)!.base;
  return mockDelay({
    id: me.id,
    displayName: me.displayName,
    campusId: me.campusId,
    homeCampusId: me.campusId,
    verifiedStudent: me.verifiedStudent,
    role: me.role ?? "student",
    roleVerified: me.roleVerified,
    roleTitle: me.roleTitle,
  });
}
