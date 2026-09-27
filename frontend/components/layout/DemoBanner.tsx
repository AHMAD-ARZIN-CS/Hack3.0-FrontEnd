import { SHOW_DEMO_DATA_CONTROLS } from "@/config/app";

/** Shown in mock mode so nobody mistakes demo content for live data (DECISIONS D7). */
export function DemoBanner() {
  if (!SHOW_DEMO_DATA_CONTROLS) return null;
  return (
    <p className="border-b border-line bg-muted px-4 py-1 text-center text-[11px] text-ink-soft">
      Hackathon demo. Listings, deals, and people shown are sample data.
    </p>
  );
}
