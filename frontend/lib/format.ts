/** Display helpers. Keep formatting out of components. */

export function formatCents(cents: number): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatMiles(miles?: number): string | undefined {
  if (miles === undefined) return undefined;
  if (miles < 0.3) return "On campus";
  return `~${miles.toFixed(1)} mi from campus`;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt.format(new Date(startIso))} – ${fmt.format(new Date(endIso))}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMeeting(startIso: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(startIso));
}

/** "Available now" / "From Oct 15" for a YYYY-MM-DD date. */
export function formatAvailability(dateKey: string, todayKey: string): string {
  if (dateKey <= todayKey) return "Available now";
  const d = new Date(`${dateKey}T12:00:00`);
  return `From ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/** "Today 2:00 – 5:00 PM", "Tomorrow 10:00 AM – 12:00 PM", or "Sat 2:00 – 4:00 PM". */
export function formatPickupWindow(startIso: string, endIso: string, now: Date = new Date()): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dayDiff = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  const day = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : start.toLocaleDateString("en-US", { weekday: "short" });
  const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${t(start)} – ${t(end)}`;
}

export function percentOff(originalCents: number, priceCents: number): number {
  return originalCents > 0 ? Math.round((1 - priceCents / originalCents) * 100) : 0;
}
