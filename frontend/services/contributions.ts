/**
 * Contribution event ledger (D32). MOCK mode only: in API mode the backend records events
 * and returns computed profiles, so nothing here is called over the network.
 *
 * Sources today:
 * - Approved academic resources and tips (seeded from data/mock/academic.ts; the review flow will call recordApproval).
 * - Helpful votes on academic resources, tips, and credited community posts (seeded + live via recordHelpfulVote).
 * - First helpful vote on a credited community post → "community-post-helpful".
 * Defined but no source yet: verified-resource-contribution, verified-exchange (config `live: false`).
 *
 * Only students earn credit (config CONTRIBUTION_ELIGIBLE_ROLES, Q26).
 * Seeded helpful votes come from a pool of anonymous demo voters so "students helped" has real
 * distinct ids to count. The current demo user's own votes are recorded live under their id.
 */
import { COMMUNITY_CREDIT_POST_TYPES, CONTRIBUTION_ELIGIBLE_ROLES } from "@/config/reputation";
import { MOCK_RESOURCES_ACADEMIC, MOCK_TIPS } from "@/data/mock/academic";
import { MOCK_POSTS } from "@/data/mock/posts";
import { MOCK_USERS } from "@/data/mock/users";
import type { ContributionEvent, ContributionEventType, ContributionSourceType, PostType } from "@/types/models";

const DEMO_VOTER_POOL = 40;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const events: ContributionEvent[] = [];
let idCounter = 1;

/** Only students earn credit (CONTRIBUTION_ELIGIBLE_ROLES). Unknown users default to student (new sign-ups). */
function canEarn(userId: string): boolean {
  const role = MOCK_USERS.find((u) => u.base.id === userId)?.base.role ?? "student";
  return CONTRIBUTION_ELIGIBLE_ROLES.includes(role);
}

function push(e: Omit<ContributionEvent, "id">): ContributionEvent | undefined {
  if (!canEarn(e.userId)) return undefined;
  const ev = { ...e, id: `ce_${idCounter++}` };
  events.push(ev);
  return ev;
}

/** Stable small hash so seeded voters look the same on every load. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** First sentence of a tip, used as its history title. */
export function tipTitle(body: string): string {
  const first = body.split(/(?<=\.)\s/)[0].replace(/\.$/, "");
  return first.length > 80 ? `${first.slice(0, 77)}…` : first;
}

function seedHelpfulVotes(recipientId: string, sourceType: ContributionSourceType, sourceId: string, count: number, since: number) {
  const offset = hash(sourceId) % DEMO_VOTER_POOL;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    push({
      userId: recipientId,
      type: "helpful-vote-received",
      sourceType,
      sourceId,
      actorId: `demo_voter_${((offset + i) % DEMO_VOTER_POOL) + 1}`,
      occurredAt: new Date(since + ((now - since) * (i + 1)) / (count + 1)).toISOString(),
      isDemo: true,
    });
  }
}

function seed() {
  const now = Date.now();
  for (const r of MOCK_RESOURCES_ACADEMIC) {
    if (r.reviewStatus !== "approved") continue; // unapproved content earns nothing
    const at = now - r.daysAgo * DAY;
    push({ userId: r.authorId, type: "academic-resource-approved", sourceType: "academic-resource", sourceId: r.id, title: r.title, courseId: r.courseId, kind: r.resourceType, occurredAt: new Date(at).toISOString(), isDemo: true });
    seedHelpfulVotes(r.authorId, "academic-resource", r.id, r.helpfulCount, at);
  }
  for (const t of MOCK_TIPS) {
    if (t.reviewStatus !== "approved") continue;
    const at = now - t.daysAgo * DAY;
    push({ userId: t.authorId, type: "academic-tip-approved", sourceType: "academic-tip", sourceId: t.id, title: tipTitle(t.body), courseId: t.courseId, kind: "tip", occurredAt: new Date(at).toISOString(), isDemo: true });
    seedHelpfulVotes(t.authorId, "academic-tip", t.id, t.helpfulCount, at);
  }
  for (const p of MOCK_POSTS) {
    if (p.status !== "active" || !COMMUNITY_CREDIT_POST_TYPES.includes(p.postType) || p.helpfulCount <= 0) continue;
    const at = now - p.hoursAgo * HOUR;
    seedHelpfulVotes(p.authorId, "community-post", p.id, p.helpfulCount, at);
    const firstVote = events.find((e) => e.type === "helpful-vote-received" && e.sourceId === p.id);
    if (!firstVote) continue; // author not eligible
    push({ userId: p.authorId, type: "community-post-helpful", sourceType: "community-post", sourceId: p.id, title: p.title, courseId: p.courseId, kind: p.postType, occurredAt: firstVote.occurredAt, isDemo: true });
  }
}
seed();

// ---------- reads ----------

export function mockEventsForUser(userId: string): ContributionEvent[] {
  return events.filter((e) => e.userId === userId);
}

// ---------- writes (called by other services, never by components) ----------

export interface HelpfulVoteInput {
  recipientId: string;
  actorId: string;
  sourceType: "academic-resource" | "academic-tip" | "community-post";
  sourceId: string;
  title?: string;
  courseId?: string;
  /** Required for community posts. Non-credited types (events, opportunities, announcements) earn nothing. */
  postType?: PostType;
}

/** A student marked someone else's content helpful. Self-votes are ignored. */
export function recordHelpfulVote(v: HelpfulVoteInput): void {
  if (v.recipientId === v.actorId) return;
  if (v.sourceType === "community-post" && (!v.postType || !COMMUNITY_CREDIT_POST_TYPES.includes(v.postType))) return;
  const exists = events.some((e) => e.type === "helpful-vote-received" && e.sourceId === v.sourceId && e.actorId === v.actorId);
  if (exists) return; // one vote per student per item
  const occurredAt = new Date().toISOString();
  push({ userId: v.recipientId, type: "helpful-vote-received", sourceType: v.sourceType, sourceId: v.sourceId, actorId: v.actorId, occurredAt });
  if (v.sourceType === "community-post" && !events.some((e) => e.type === "community-post-helpful" && e.sourceId === v.sourceId)) {
    push({ userId: v.recipientId, type: "community-post-helpful", sourceType: "community-post", sourceId: v.sourceId, title: v.title, courseId: v.courseId, kind: v.postType, occurredAt });
  }
}

/** The student removed their helpful mark. The milestone goes too if no helpful votes remain. */
export function revokeHelpfulVote(sourceId: string, actorId: string): void {
  const i = events.findIndex((e) => e.type === "helpful-vote-received" && e.sourceId === sourceId && e.actorId === actorId);
  if (i === -1) return;
  const [removed] = events.splice(i, 1);
  if (removed.sourceType === "community-post" && !events.some((e) => e.type === "helpful-vote-received" && e.sourceId === sourceId)) {
    const m = events.findIndex((e) => e.type === "community-post-helpful" && e.sourceId === sourceId);
    if (m !== -1) events.splice(m, 1);
  }
}

/** For the academic review flow (not built yet): a reviewer approved a resource or tip. */
export function recordApproval(input: {
  type: Extract<ContributionEventType, "academic-resource-approved" | "academic-tip-approved">;
  authorId: string;
  reviewerId: string;
  sourceId: string;
  title: string;
  courseId: string;
  kind: string;
}): void {
  if (events.some((e) => e.type === input.type && e.sourceId === input.sourceId)) return;
  push({
    userId: input.authorId,
    type: input.type,
    sourceType: input.type === "academic-resource-approved" ? "academic-resource" : "academic-tip",
    sourceId: input.sourceId,
    actorId: input.reviewerId,
    title: input.title,
    courseId: input.courseId,
    kind: input.kind,
    occurredAt: new Date().toISOString(),
  });
}

/** Moderation removed content: every event tied to it stops counting. */
export function revokeEventsForSource(sourceType: ContributionSourceType, sourceId: string): void {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].sourceType === sourceType && events[i].sourceId === sourceId) events.splice(i, 1);
  }
}

/** Question author marked a comment as the helpful answer (Q18). One per question: moving it moves the credit. */
export function recordHelpfulAnswer(input: { answerAuthorId: string; askerId: string; postId: string; commentId: string; postTitle?: string; courseId?: string }): void {
  if (input.answerAuthorId === input.askerId) return;
  revokeHelpfulAnswerForPost(input.postId);
  push({
    userId: input.answerAuthorId,
    type: "community-answer-helpful",
    sourceType: "community-comment",
    sourceId: input.commentId,
    actorId: input.askerId,
    title: input.postTitle,
    courseId: input.courseId,
    kind: "answer",
    parentId: input.postId,
    occurredAt: new Date().toISOString(),
  });
}

export function revokeHelpfulAnswerForPost(postId: string): void {
  const i = events.findIndex((e) => e.type === "community-answer-helpful" && e.parentId === postId);
  if (i !== -1) events.splice(i, 1);
}
