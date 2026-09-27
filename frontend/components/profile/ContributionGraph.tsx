"use client";

/**
 * Contribution history graph (weeks × weekdays).
 * Counts only meaningful contributions (approved resources/tips, community posts found helpful,
 * later, verified contributions). Never logins, time spent, post volume, or unreviewed posts (D24, D32).
 * SVG with a viewBox so it scales to any phone width without horizontal scroll.
 */
import { useId } from "react";
import { ACTIVITY_THRESHOLDS, ACTIVITY_WEEKS } from "@/config/reputation";
import { addDays, formatDayLabel, fromDateKey, toDateKey } from "@/lib/dates";
import type { ContributionActivity, ContributionDay, ContributionType } from "@/types/models";

const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 26; // weekday labels
const TOP = 14; // month labels
const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

const TYPE_LABELS: Record<ContributionType, [string, string]> = {
  "academic-resource": ["resource", "resources"],
  "academic-tip": ["tip", "tips"],
  "community-post": ["helpful community post", "helpful community posts"],
  "community-answer": ["community answer", "community answers"],
  "verified-resource": ["verified contribution", "verified contributions"],
  "verified-exchange": ["exchange", "exchanges"],
};

function shade(count: number): number {
  let level = 0;
  ACTIVITY_THRESHOLDS.forEach((t, i) => {
    if (count >= t) level = i + 1;
  });
  return level;
}

function describe(day: ContributionDay | undefined, date: Date): string {
  const when = formatDayLabel(date);
  if (!day || day.count === 0) return `No contributions on ${when}`;
  const parts = Object.entries(day.byType ?? {})
    .filter(([, n]) => n)
    .map(([type, n]) => `${n} ${TYPE_LABELS[type as ContributionType][n === 1 ? 0 : 1]}`);
  return `${day.count} contribution${day.count === 1 ? "" : "s"} on ${when}${parts.length ? `: ${parts.join(", ")}` : ""}`;
}

export function ContributionGraph({ activity }: { activity: ContributionActivity }) {
  const captionId = useId();
  const end = fromDateKey(activity.endDate);
  // First column starts on the Sunday so rows line up with weekdays.
  const firstDay = addDays(end, -(ACTIVITY_WEEKS - 1) * 7 - end.getDay());
  const byDate = new Map(activity.days.map((d) => [d.date, d]));

  const cells: { x: number; y: number; level: number; label: string; key: string }[] = [];
  const months: { x: number; label: string }[] = [];
  let lastMonth = -1;
  let lastLabelCol = -10;

  for (let col = 0; col < ACTIVITY_WEEKS; col++) {
    const colStart = addDays(firstDay, col * 7);
    if (colStart.getMonth() !== lastMonth) {
      if (col - lastLabelCol >= 3) {
        months.push({ x: LEFT + col * STEP, label: colStart.toLocaleString("en-US", { month: "short" }) });
        lastLabelCol = col;
      }
      lastMonth = colStart.getMonth();
    }
    for (let row = 0; row < 7; row++) {
      const date = addDays(colStart, row);
      if (date > end) break;
      const key = toDateKey(date);
      const day = byDate.get(key);
      cells.push({
        x: LEFT + col * STEP,
        y: TOP + row * STEP,
        level: shade(day?.count ?? 0),
        label: describe(day, date),
        key,
      });
    }
  }

  const width = LEFT + ACTIVITY_WEEKS * STEP;
  const height = TOP + 7 * STEP;
  const months6 = Math.round(ACTIVITY_WEEKS / 4.345);

  return (
    <figure className="m-0">
      <figcaption id={captionId} className="mb-2 text-sm text-ink-soft">
        <span className="font-semibold text-ink">{activity.total}</span> contribution{activity.total === 1 ? "" : "s"} in the
        last {months6} months
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-labelledby={captionId}
        className="block max-w-full"
        data-testid="contribution-graph"
      >
        {months.map((m) => (
          <text key={`${m.x}-${m.label}`} x={m.x} y={9} fontSize={8} fill="var(--ink-soft)">
            {m.label}
          </text>
        ))}
        {Object.entries(WEEKDAY_LABELS).map(([row, label]) => (
          <text key={row} x={0} y={TOP + Number(row) * STEP + CELL - 1} fontSize={8} fill="var(--ink-soft)">
            {label}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.key}
            x={c.x}
            y={c.y}
            width={CELL}
            height={CELL}
            rx={2.5}
            fill={`var(--activity-${c.level})`}
            data-level={c.level}
            data-date={c.key}
          >
            <title>{c.label}</title>
          </rect>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-ink-soft" aria-hidden>
        Fewer
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="inline-block size-2.5 rounded-[3px]" style={{ background: `var(--activity-${l})` }} />
        ))}
        More
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Counts approved resources and tips, and community posts other students found helpful. Logins, time spent, post
        volume, and unreviewed content don&apos;t count.
      </p>
    </figure>
  );
}
