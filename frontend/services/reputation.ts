/**
 * Reputation from contribution events (DECISIONS D21, D24, D32). Pure functions, mock mode.
 * In API mode the backend returns stats/points/level/badges/activity and this file is not used.
 * Weights and thresholds come only from config/reputation.ts. Components never calculate reputation.
 */
import {
  ACTIVITY_DAILY_CAP,
  ACTIVITY_WEEKS,
  BADGE_RULES,
  CONTRIBUTION_RULES,
  HELPFUL_POINTS_MAX_VOTES_PER_VOTER,
  LEVELS,
} from "@/config/reputation";
import { addDays, startOfToday, toDateKey } from "@/lib/dates";
import type { Badge, Contribution, ContributionActivity, ContributionDay, ContributionEvent, ContributionStats } from "@/types/models";

export interface Reputation {
  stats: ContributionStats;
  points: number;
  level: number;
  levelName: string;
  nextLevelAt?: number;
  badges: Badge[];
}

export function computeStats(events: ContributionEvent[]): ContributionStats {
  const count = (t: ContributionEvent["type"]) => events.filter((e) => e.type === t).length;
  const helpful = events.filter((e) => e.type === "helpful-vote-received");
  return {
    resourcesApproved: count("academic-resource-approved"),
    tipsApproved: count("academic-tip-approved"),
    helpfulVotesReceived: helpful.length,
    studentsHelped: new Set(helpful.map((e) => e.actorId).filter(Boolean)).size,
    communityPostsHelpful: count("community-post-helpful"),
    communityAnswersHelpful: count("community-answer-helpful"),
    verifiedResources: count("verified-resource-contribution"),
    verifiedExchanges: count("verified-exchange"),
  };
}

/** Points with the per-voter cap on helpful votes. */
export function computePoints(events: ContributionEvent[]): number {
  const votesByVoter = new Map<string, number>();
  let points = 0;
  for (const e of events) {
    if (e.type === "helpful-vote-received") {
      const voter = e.actorId ?? "unknown";
      const n = (votesByVoter.get(voter) ?? 0) + 1;
      votesByVoter.set(voter, n);
      if (n > HELPFUL_POINTS_MAX_VOTES_PER_VOTER) continue;
    }
    points += CONTRIBUTION_RULES[e.type].points;
  }
  return points;
}

function contributionsByCourse(events: ContributionEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) {
    if ((e.type === "academic-resource-approved" || e.type === "academic-tip-approved") && e.courseId) {
      out[e.courseId] = (out[e.courseId] ?? 0) + 1;
    }
  }
  return out;
}

function earnedBadgeIds(events: ContributionEvent[]): Set<string> {
  const stats = computeStats(events);
  const input = { stats, points: computePoints(events), contributionsByCourse: contributionsByCourse(events) };
  return new Set(BADGE_RULES.filter((r) => r.earned(input)).map((r) => r.id));
}

/** Badges with earnedAt = the time of the event that first met the rule. */
export function computeBadges(events: ContributionEvent[]): Badge[] {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const earnedAt = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    if (earnedAt.size === BADGE_RULES.length) break;
    for (const id of earnedBadgeIds(sorted.slice(0, i + 1))) {
      if (!earnedAt.has(id)) earnedAt.set(id, sorted[i].occurredAt);
    }
  }
  return BADGE_RULES.filter((r) => earnedAt.has(r.id)).map(({ id, name, description }) => ({ id, name, description, earnedAt: earnedAt.get(id) }));
}

export function computeReputation(events: ContributionEvent[]): Reputation {
  const points = computePoints(events);
  const current = [...LEVELS].reverse().find((l) => points >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > points);
  return {
    stats: computeStats(events),
    points,
    level: current.level,
    levelName: current.name,
    nextLevelAt: next?.min,
    badges: computeBadges(events),
  };
}

/** Graph: the person's own recognized contributions per day, capped per day. */
export function computeActivity(userId: string, events: ContributionEvent[], weeks: number = ACTIVITY_WEEKS): ContributionActivity {
  const today = startOfToday();
  const start = addDays(today, -(weeks * 7 - 1));
  const startKey = toDateKey(start);
  const byDay = new Map<string, ContributionDay>();
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  for (const e of sorted) {
    const rule = CONTRIBUTION_RULES[e.type];
    if (!rule.inGraph || !rule.graphType) continue;
    const key = toDateKey(new Date(e.occurredAt));
    if (key < startKey) continue;
    const day = byDay.get(key) ?? { date: key, count: 0, byType: {} };
    if (day.count >= ACTIVITY_DAILY_CAP) continue; // anti-spam cap
    day.count += 1;
    day.byType![rule.graphType] = (day.byType![rule.graphType] ?? 0) + 1;
    byDay.set(key, day);
  }
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { userId, startDate: startKey, endDate: toDateKey(today), days, total: days.reduce((s, d) => s + d.count, 0) };
}

/** History: newest first. helpfulCount is the live count of helpful events on that item. */
export function computeHistory(events: ContributionEvent[]): Contribution[] {
  const helpfulBySource = new Map<string, number>();
  for (const e of events) {
    if (e.type === "helpful-vote-received") {
      const k = `${e.sourceType}:${e.sourceId}`;
      helpfulBySource.set(k, (helpfulBySource.get(k) ?? 0) + 1);
    }
  }
  return events
    .filter((e) => CONTRIBUTION_RULES[e.type].inHistory && CONTRIBUTION_RULES[e.type].graphType)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map((e) => ({
      type: CONTRIBUTION_RULES[e.type].graphType!,
      id: e.sourceId,
      title: e.title ?? CONTRIBUTION_RULES[e.type].label,
      courseId: e.courseId,
      kind: e.kind,
      parentId: e.parentId,
      helpfulCount: helpfulBySource.get(`${e.sourceType}:${e.sourceId}`) ?? 0,
      createdAt: e.occurredAt,
    }));
}
