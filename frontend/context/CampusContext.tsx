"use client";

/**
 * currentCampus for the whole app (DECISIONS D2).
 * Stored in localStorage so the choice survives reloads. Storage failures are ignored.
 * useSyncExternalStore keeps server render (DEFAULT_CAMPUS) and client in sync without hydration errors.
 */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_CAMPUS, SUPPORTED_CAMPUSES } from "@/config/app";
import type { Campus, CampusId } from "@/types/models";

const STORAGE_KEY = "ebl.campusId";
const CHANGE_EVENT = "ebl:campus-change";

function readStoredCampus(): CampusId {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    if (id && SUPPORTED_CAMPUSES.some((c) => c.id === id)) return id;
  } catch {
    /* storage blocked */
  }
  return DEFAULT_CAMPUS;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

interface CampusContextValue {
  currentCampus: Campus;
  campuses: Campus[];
  setCampus: (id: CampusId) => void;
}

const CampusContext = createContext<CampusContextValue | null>(null);

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const campusId = useSyncExternalStore(subscribe, readStoredCampus, () => DEFAULT_CAMPUS);

  const setCampus = useCallback((id: CampusId) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage blocked: choice lasts until reload */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<CampusContextValue>(
    () => ({
      currentCampus: SUPPORTED_CAMPUSES.find((c) => c.id === campusId) ?? SUPPORTED_CAMPUSES[0],
      campuses: SUPPORTED_CAMPUSES,
      setCampus,
    }),
    [campusId, setCampus],
  );

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus(): CampusContextValue {
  const ctx = useContext(CampusContext);
  if (!ctx) throw new Error("useCampus must be used inside <CampusProvider>");
  return ctx;
}
