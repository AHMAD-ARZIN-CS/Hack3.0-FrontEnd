"use client";

import { MapPin } from "lucide-react";
import { useCampus } from "@/context/CampusContext";

/** Native <select> for accessibility and zero extra code on mobile. */
export function CampusSelector() {
  const { currentCampus, campuses, setCampus } = useCampus();
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold">
      <MapPin aria-hidden className="size-4 text-brand" />
      <span className="sr-only">Campus</span>
      <select
        value={currentCampus.id}
        onChange={(e) => setCampus(e.target.value)}
        className="min-h-11 rounded-lg border border-line bg-surface px-2 py-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand"
      >
        {campuses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.shortName}
          </option>
        ))}
      </select>
    </label>
  );
}
