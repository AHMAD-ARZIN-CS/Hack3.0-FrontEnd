/**
 * Community service. The ONLY way UI gets community data.
 *
 * mock mode: in-memory store built from data/mock/posts.ts. Writes last until page reload.
 * api mode:  endpoints in docs/DATA_CONTRACT.md §6 / §8.
 *
 * Rules (D25):
 * - Feed is campus-scoped and shows only status "active" posts.
 * - Blocked authors are filtered out for the viewer.
 * - Linked entities are resolved here into display-ready previews.
 * - Announcements only from faculty/staff or organizations (checked on create).
 * - Nothing is auto-posted from Housing/Food/Marketplace.
 */
import { DATA_MODE } from "@/config/app";
import { COMMUNITY_LIMITS, POST_TYPES } from "@/config/community";
import { MOCK_COURSES } from "@/data/mock/courses";
import { MOCK_OPPORTUNITIES } from "@/data/mock/opportunities";
import { MOCK_COMMENTS, MOCK_POSTS, type MockComment, type MockPost } from "@/data/mock/posts";
import { MOCK_RESOURCES } from "@/data/mock/resources";
import { CURRENT_USER_ID, MOCK_USERS } from "@/data/mock/users";
import { apiGet, apiPost } from "@/services/api/client";
import { mockEventsForUser, recordHelpfulAnswer, recordHelpfulVote, revokeHelpfulAnswerForPost, revokeHelpfulVote } from "@/services/contributions";
import { blockUser as blockUserShared, isBlockedMock, unblockUser as unblockUserShared } from "@/services/blocks";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging, matchesText } from "@/services/query";
import { mockPublicUser } from "@/services/authors";
import { mockFindPublicResource } from "@/services/academic";
import type {
  Comment,
  LinkedEntityPreview,
  LinkedEntityRef,
  NewCommentInput,
  NewPostInput,
  Paged,
  Post,
  PostQuery,
} from "@/types/models";

// ---------- in-memory mock store ----------
const posts: MockPost[] = structuredClone(MOCK_POSTS);
const comments: MockComment[] = structuredClone(MOCK_COMMENTS);
const helpfulByViewer = new Set<string>(); // postIds
const savedByViewer = new Set<string>(["post_research_opp"]);
// Blocks live in services/blocks.ts (one list shared with Marketplace, D31).
let idCounter = 1;

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const roundToHour = (ms: number) => new Date(Math.round(ms / 3_600_000) * 3_600_000).toISOString();

const publicUser = mockPublicUser;

const KIND_ACTION: Record<string, [string, string]> = {
  "study-guide": ["Study guide", "View study guide"],
  notes: ["Notes", "View notes"],
  practice: ["Practice set", "View practice set"],
  "study-strategy": ["Study strategy", "View study strategy"],
};

/** Turns a {type, id} link into something the UI can render. */
function resolveLinked(ref: LinkedEntityRef): LinkedEntityPreview {
  const missing = (title: string): LinkedEntityPreview => ({ ...ref, title, actionLabel: "Not available", available: false });

  switch (ref.type) {
    case "academic-resource": {
      const r = mockFindPublicResource(ref.id);
      if (!r) return missing("Study resource");
      const course = MOCK_COURSES.find((k) => k.id === r.courseId);
      const author = MOCK_USERS.find((u) => u.base.id === r.authorId)?.base.displayName;
      const [kindLabel, action] = KIND_ACTION[r.resourceType] ?? ["Resource", "View resource"];
      return {
        ...ref,
        title: r.title,
        subtitle: [kindLabel, course?.code, author ? `by ${author}` : undefined].filter(Boolean).join(" · "),
        actionLabel: action,
        href: `/academic/${r.courseId}/${r.id}`,
        available: true,
      };
    }
    case "resource": {
      const r = MOCK_RESOURCES.find((x) => x.id === ref.id);
      if (!r) return missing("Resource");
      return {
        ...ref,
        title: r.title,
        subtitle: r.provider,
        description: r.description,
        actionLabel: "View resource",
        href: `/resources?q=${encodeURIComponent(r.title)}`,
        available: true,
      };
    }
    case "opportunity": {
      const o = MOCK_OPPORTUNITIES.find((x) => x.id === ref.id);
      if (!o || (o.reviewStatus && o.reviewStatus !== "published")) return missing("Opportunity"); // Q24: unpublished suggestions never show
      const deadline = o.deadline
        ? `Apply by ${new Date(`${o.deadline}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : undefined;
      return {
        ...ref,
        title: o.title,
        subtitle: [o.organization, deadline].filter(Boolean).join(" · "),
        description: o.description,
        actionLabel: "View opportunity",
        href: o.url,
        external: !!o.url,
        available: true,
      };
    }
    case "profile": {
      const u = MOCK_USERS.find((x) => x.base.id === ref.id);
      if (!u) return missing("Profile");
      return { ...ref, title: u.base.displayName, actionLabel: "View profile", href: `/profile/${u.base.id}`, available: true };
    }
    case "housing-post":
      return { ...ref, title: "Housing post", actionLabel: "View in Housing", href: `/housing/${ref.id}`, available: true };
    case "study-group":
      return missing("Study group");
  }
}

function toPost(m: MockPost): Post {
  const { hoursAgo, meetingInHours, goingUserIds, goingCount, ...rest } = m;
  return {
    ...rest,
    going: goingUserIds ? { count: Math.max(goingCount ?? 0, goingUserIds.length), preview: goingUserIds.slice(0, 4).map((id) => publicUser(id)) } : undefined,
    author: publicUser(m.authorId),
    createdAt: hoursAgoIso(hoursAgo),
    meeting:
      m.meeting && meetingInHours !== undefined
        ? { ...m.meeting, startsAt: roundToHour(Date.now() + meetingInHours * 3_600_000) }
        : m.meeting,
    linkedPreview: m.linkedEntity ? resolveLinked(m.linkedEntity) : undefined,
    commentCount: comments.filter((c) => c.postId === m.id && c.status === "active").length,
    viewerMarkedHelpful: helpfulByViewer.has(m.id),
    viewerSaved: savedByViewer.has(m.id),
  };
}

function toComment(m: MockComment): Comment {
  const { hoursAgo, ...rest } = m;
  const post = posts.find((p) => p.id === m.postId);
  return {
    ...rest,
    author: publicUser(m.authorId),
    createdAt: hoursAgoIso(hoursAgo),
    isHelpfulAnswer: post?.helpfulAnswerCommentId === m.id && m.status === "active",
  };
}

function findPost(id: string): MockPost {
  const p = posts.find((x) => x.id === id);
  if (!p) throw new NotFoundError("Post");
  return p;
}

// ---------- reads ----------

export async function getFeed(query: PostQuery): Promise<Paged<Post>> {
  if (DATA_MODE === "api") return apiGet<Paged<Post>>("/posts", query);
  const items = posts
    .filter(
      (p) =>
        p.campusId === query.campusId &&
        p.status === "active" &&
        !isBlockedMock(p.authorId) &&
        (!query.postType || p.postType === query.postType) &&
        (!query.courseId || p.courseId === query.courseId) &&
        (!query.authorId || p.authorId === query.authorId) &&
        (!query.savedOnly || savedByViewer.has(p.id)) &&
        matchesText(query.q, p.title, p.body, ...p.tags),
    )
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .map(toPost);
  return mockDelay(applyPaging(items, query));
}

/** Returns removed/hidden posts too so the detail page can show "This post was removed". */
export async function getPost(id: string): Promise<Post> {
  if (DATA_MODE === "api") return apiGet<Post>(`/posts/${encodeURIComponent(id)}`);
  const p = toPost(findPost(id));
  if (p.status !== "active") return mockDelay({ ...p, title: undefined, body: "", linkedEntity: undefined, linkedPreview: undefined });
  return mockDelay(p);
}

/** Removed comments come back as placeholders (no body). Blocked authors are hidden. */
export async function getComments(postId: string): Promise<Comment[]> {
  if (DATA_MODE === "api") return apiGet<Comment[]>(`/posts/${encodeURIComponent(postId)}/comments`);
  return mockDelay(
    comments
      .filter((c) => c.postId === postId && c.status !== "hidden" && !isBlockedMock(c.authorId))
      .sort((a, b) => b.hoursAgo - a.hoursAgo)
      .map((c) => (c.status === "removed" ? { ...toComment(c), body: "" } : toComment(c))),
  );
}

/** Current user's own approved academic resources, for linking in a "Shared resource" post. */
export async function getLinkableResources(): Promise<LinkedEntityPreview[]> {
  if (DATA_MODE === "api") return apiGet<LinkedEntityPreview[]>("/me/linkable-resources");
  // Approved resources come from the contribution ledger (D32), newest first.
  return mockDelay(
    mockEventsForUser(CURRENT_USER_ID)
      .filter((e) => e.type === "academic-resource-approved")
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map((e) => resolveLinked({ type: "academic-resource", id: e.sourceId }))
      .filter((p) => p.available),
  );
}

// ---------- writes ----------

export async function createPost(input: NewPostInput): Promise<Post> {
  const title = input.title?.trim();
  const body = input.body.trim();
  const type = POST_TYPES.find((t) => t.id === input.postType);
  if (!type) throw new ValidationError("postType", "Choose a post type.");
  if (title && title.length > COMMUNITY_LIMITS.titleMax) throw new ValidationError("title", `Title must be under ${COMMUNITY_LIMITS.titleMax} characters.`);
  if (body.length < COMMUNITY_LIMITS.bodyMin) throw new ValidationError("body", `Write at least ${COMMUNITY_LIMITS.bodyMin} characters.`);
  if (body.length > COMMUNITY_LIMITS.bodyMax) throw new ValidationError("body", `Keep it under ${COMMUNITY_LIMITS.bodyMax} characters.`);
  if (type.needsMeeting && (!input.meeting?.startsAt || !input.meeting.locationName.trim()))
    throw new ValidationError("meeting", "Add a date, time, and place.");
  if (type.needsLink && !input.linkedEntity) throw new ValidationError("linkedEntity", "Choose what you're sharing.");
  const tags = (input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tags.length > COMMUNITY_LIMITS.tagsMax) throw new ValidationError("tags", `Up to ${COMMUNITY_LIMITS.tagsMax} tags.`);

  if (DATA_MODE === "api") return apiPost<Post>("/posts", { ...input, title, body, tags });

  const me = MOCK_USERS.find((u) => u.base.id === CURRENT_USER_ID)!.base;
  if (!type.allowedRoles.includes(me.role ?? "student"))
    throw new ValidationError("postType", "Only verified faculty, staff, or organizations can post announcements.");

  const created: MockPost = {
    id: `post_new_${idCounter++}`,
    authorId: me.id,
    campusId: input.campusId,
    postType: input.postType,
    title: title || undefined,
    body,
    courseId: input.courseId,
    tags,
    attachments: [],
    linkedEntity: input.linkedEntity,
    meeting: input.meeting,
    helpfulCount: 0,
    commentCount: 0,
    status: "active",
    hoursAgo: 0,
    isDemo: true,
  };
  posts.unshift(created);
  return mockDelay(toPost(created));
}

export async function addComment(input: NewCommentInput): Promise<Comment> {
  const body = input.body.trim();
  if (!body) throw new ValidationError("body", "Write a comment first.");
  if (body.length > COMMUNITY_LIMITS.commentMax) throw new ValidationError("body", "Comment is too long.");
  if (DATA_MODE === "api") return apiPost<Comment>(`/posts/${encodeURIComponent(input.postId)}/comments`, { body });
  findPost(input.postId);
  const c: MockComment = { id: `c_new_${idCounter++}`, postId: input.postId, authorId: CURRENT_USER_ID, body, status: "active", hoursAgo: 0, isDemo: true };
  comments.push(c);
  return mockDelay(toComment(c), 150);
}

/** One helpful mark per viewer per post. Authors can't mark their own posts. */
export async function toggleHelpful(postId: string): Promise<{ helpfulCount: number; viewerMarkedHelpful: boolean }> {
  if (DATA_MODE === "api") return apiPost(`/posts/${encodeURIComponent(postId)}/helpful`);
  const p = findPost(postId);
  if (p.authorId === CURRENT_USER_ID) throw new ValidationError("helpful", "You can't mark your own post helpful.");
  if (helpfulByViewer.has(postId)) {
    helpfulByViewer.delete(postId);
    p.helpfulCount -= 1;
    revokeHelpfulVote(postId, CURRENT_USER_ID);
  } else {
    helpfulByViewer.add(postId);
    p.helpfulCount += 1;
    // Credits the author only for credited post types (config COMMUNITY_CREDIT_POST_TYPES, D32).
    recordHelpfulVote({ recipientId: p.authorId, actorId: CURRENT_USER_ID, sourceType: "community-post", sourceId: postId, title: p.title, courseId: p.courseId, postType: p.postType });
  }
  return mockDelay({ helpfulCount: p.helpfulCount, viewerMarkedHelpful: helpfulByViewer.has(postId) }, 100);
}

/**
 * Question author marks ONE comment as the helpful answer, or clears it with commentId null (Q18).
 * Credits the comment's author once (config CONTRIBUTION_RULES). Not a vote, so no popularity contest.
 */
export async function setHelpfulAnswer(postId: string, commentId: string | null): Promise<{ helpfulAnswerCommentId?: string }> {
  if (DATA_MODE === "api") return apiPost(`/posts/${encodeURIComponent(postId)}/helpful-answer`, { commentId });
  const p = findPost(postId);
  if (p.authorId !== CURRENT_USER_ID) throw new ValidationError("helpfulAnswer", "Only the person who asked can choose the helpful answer.");
  if (p.postType !== "question") throw new ValidationError("helpfulAnswer", "Only questions have a helpful answer.");
  if (commentId === null) {
    p.helpfulAnswerCommentId = undefined;
    revokeHelpfulAnswerForPost(postId);
    return mockDelay({ helpfulAnswerCommentId: undefined }, 100);
  }
  const c = comments.find((x) => x.id === commentId && x.postId === postId);
  if (!c || c.status !== "active") throw new NotFoundError("Comment");
  if (c.authorId === CURRENT_USER_ID) throw new ValidationError("helpfulAnswer", "You can't mark your own comment.");
  p.helpfulAnswerCommentId = commentId;
  recordHelpfulAnswer({
    answerAuthorId: c.authorId,
    askerId: CURRENT_USER_ID,
    postId,
    commentId,
    postTitle: p.title ?? (p.body.length > 80 ? `${p.body.slice(0, 77)}…` : p.body),
    courseId: p.courseId,
  });
  return mockDelay({ helpfulAnswerCommentId: commentId }, 100);
}

export async function toggleSave(postId: string): Promise<{ viewerSaved: boolean }> {
  if (DATA_MODE === "api") return apiPost(`/posts/${encodeURIComponent(postId)}/save`);
  findPost(postId);
  if (savedByViewer.has(postId)) savedByViewer.delete(postId);
  else savedByViewer.add(postId);
  return mockDelay({ viewerSaved: savedByViewer.has(postId) }, 100);
}

/** Viewer-side block: hides the user's posts and comments for the viewer only. Delegates to services/blocks.ts. */
export async function blockUser(userId: string): Promise<void> {
  if (userId === CURRENT_USER_ID) throw new ValidationError("block", "You can't block yourself.");
  await blockUserShared(userId);
}

export async function unblockUser(userId: string): Promise<void> {
  await unblockUserShared(userId);
}
