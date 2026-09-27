"use client";

import { useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/services/auth";
import type { AuthSession } from "@/types/models";

/** Current auth session. `undefined` while unknown (server render, api session loading). */
export function useSession(): AuthSession | null | undefined {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, () => undefined);
}
