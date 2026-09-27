/**
 * Contribution + reputation rules (DECISIONS D21, D24, D32). The ONLY place weights live.
 * Mock mode computes with these in services/reputation.ts. In API mode the backend mirrors them.
 *
 * Principle: reward HELPING, not engagement.
 * Earns nothing: logins, screen time, page views, downloads, post or comment volume,
 * reactions without meaning, unapproved content, self-votes.
 */
import type { ContributionEventType, ContributionStats, ContributionType, PostType } from "@/types/models";

export interface ContributionRule {
  /** Human label for docs and tooltips. */
  label: string;
  points: number;
  /** Counts as a day of activity on the contribution graph (the person's own action). */
  inGraph: boolean;
  /** Listed in contribution history. */
  inHistory: boolean;
  /** Graph/history bucket. */
  graphType?: ContributionType;
  /** A source for this event exists in the app today. Metrics that need a non-live event are not shown. */
  live: boolean;
}

export const CONTRIBUTION_RULES: Record<ContributionEventType, ContributionRule> = {
  "academic-resource-approved": { label: "Resource approved", points: 10, inGraph: true, inHistory: true, graphType: "academic-resource", live: true },
  "academic-tip-approved": { label: "Tip approved", points: 3, inGraph: true, inHistory: true, graphType: "academic-tip", live: true },
  // Someone else's action, so it earns points but is not a day of the person's own activity.
  "helpful-vote-received": { label: "Marked helpful by a student", points: 2, inGraph: false, inHistory: false, live: true },
  "community-post-helpful": { label: "Community post found helpful", points: 4, inGraph: true, inHistory: true, graphType: "community-post", live: true },
  // Chosen by the person who asked, one per question (Q18). Not a vote count, so no popularity contest.
  "community-answer-helpful": { label: "Answer marked helpful by the asker", points: 5, inGraph: true, inHistory: true, graphType: "community-answer", live: true },
  "verified-resource-contribution": { label: "Resource contribution verified", points: 8, inGraph: true, inHistory: true, graphType: "verified-resource", live: false },
  "verified-exchange": { label: "Exchange confirmed by both sides", points: 5, inGraph: true, inHistory: true, graphType: "verified-exchange", live: false },
};

/**
 * Who can earn contribution credit (Q26: students only).
 * Faculty, staff, and organization posts still help people, but they don't earn points or badges.
 */
export const CONTRIBUTION_ELIGIBLE_ROLES: ("student" | "faculty-staff" | "organization")[] = ["student"];

/**
 * Anti-gaming: helpful votes from one student to one person count toward points at most this many times.
 * Stops two friends from farming points by marking everything the other posts.
 */
export const HELPFUL_POINTS_MAX_VOTES_PER_VOTER = 5;

/**
 * Community post types that can earn "community-post-helpful". Events, opportunities, and announcements
 * are promotion, not help, so they earn nothing even when marked helpful.
 */
export const COMMUNITY_CREDIT_POST_TYPES: PostType[] = ["question", "discussion", "resource-share", "study-group"];

/**
 * Profile metrics. A metric shows only when every event it depends on is live (D32:
 * only display metrics the data supports).
 */
export const PROFILE_STATS: { key: keyof ContributionStats; label: string; requires: ContributionEventType[] }[] = [
  { key: "resourcesApproved", label: "resources shared", requires: ["academic-resource-approved"] },
  { key: "tipsApproved", label: "tips shared", requires: ["academic-tip-approved"] },
  { key: "helpfulVotesReceived", label: "helpful votes", requires: ["helpful-vote-received"] },
  { key: "studentsHelped", label: "students helped", requires: ["helpful-vote-received"] },
  { key: "communityPostsHelpful", label: "community posts found helpful", requires: ["community-post-helpful"] },
  { key: "communityAnswersHelpful", label: "helpful answers", requires: ["community-answer-helpful"] },
  { key: "verifiedResources", label: "verified contributions", requires: ["verified-resource-contribution"] },
  { key: "verifiedExchanges", label: "verified exchanges", requires: ["verified-exchange"] },
];

/** The metrics the profile actually shows: only those whose events all have a live source. */
export const LIVE_PROFILE_STATS = PROFILE_STATS.filter((m) => m.requires.every((t) => CONTRIBUTION_RULES[t].live));

/** Ascending. A user is at the highest level whose `min` they reach. */
export const LEVELS: { level: number; name: string; min: number }[] = [
  { level: 1, name: "Newcomer", min: 0 },
  { level: 2, name: "Contributor", min: 20 },
  { level: 3, name: "Helper", min: 60 },
  { level: 4, name: "Guide", min: 150 },
  { level: 5, name: "Mentor", min: 300 },
];

export interface BadgeRuleInput {
  stats: ContributionStats;
  points: number;
  /** Approved academic resources + tips per course id. */
  contributionsByCourse: Record<string, number>;
}

/**
 * Student Hub recognition badges. They are NOT college certifications, academic credentials,
 * or institutional awards (shown on the profile as BADGE_DISCLAIMER).
 * Thresholds are fixed, never a ranking against other students.
 */
export const BADGE_RULES: {
  id: string;
  name: string;
  description: string;
  earned: (input: BadgeRuleInput) => boolean;
}[] = [
  {
    id: "resource-contributor",
    name: "Resource Contributor",
    description: "Shared a study resource that reviewers approved.",
    earned: ({ stats }) => stats.resourcesApproved >= 1,
  },
  {
    id: "course-contributor",
    name: "Course Contributor",
    description: "Shared 3 or more approved resources or tips for one course.",
    earned: ({ contributionsByCourse }) => Object.values(contributionsByCourse).some((n) => n >= 3),
  },
  {
    id: "community-helper",
    name: "Community Helper",
    description: "3 community posts that other students found helpful.",
    earned: ({ stats }) => stats.communityPostsHelpful >= 3,
  },
  {
    id: "helpful-10",
    name: "Helpful",
    description: "Received 10 helpful votes from other students.",
    earned: ({ stats }) => stats.helpfulVotesReceived >= 10,
  },
  {
    id: "helped-25",
    name: "Helped 25 students",
    description: "25 different students found your contributions helpful.",
    earned: ({ stats }) => stats.studentsHelped >= 25,
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    description: "Earned 150 contribution points. A fixed goal, not a ranking.",
    earned: ({ points }) => points >= 150,
  },
];

export const BADGE_DISCLAIMER = "Student Hub recognition only. Not a college award, certification, or academic credential.";

/** Contribution graph: count thresholds for shading levels 1–4 (0 = no contributions). */
export const ACTIVITY_THRESHOLDS = [1, 2, 4, 6] as const;

/** Anti-spam: at most this many contributions count toward the graph per day. */
export const ACTIVITY_DAILY_CAP = 8;

/** Weeks shown in the contribution graph. */
export const ACTIVITY_WEEKS = 26;

/** Public profiles list at most this many history items. */
export const PUBLIC_HISTORY_LIMIT = 10;
