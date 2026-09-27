"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { PostCard } from "@/components/community/PostCard";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { COMMUNITY_LIMITS } from "@/config/community";
import { useAsync } from "@/hooks/useAsync";
import { addComment, getComments, getPost, setHelpfulAnswer, ValidationError } from "@/services/community";
import { getCourse } from "@/services/courses";
import { NotFoundError } from "@/services/mock";
import { getCurrentUser } from "@/services/user";
import type { Comment } from "@/types/models";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const post = useAsync(() => getPost(postId), [postId]);
  const courseId = post.data?.courseId;
  const course = useAsync(() => (courseId ? getCourse(courseId) : Promise.resolve(undefined)), [courseId]);
  const loaded = useAsync(() => getComments(postId), [postId]);
  const me = useAsync(() => getCurrentUser(), []);

  const [added, setAdded] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedName, setBlockedName] = useState<string | null>(null);
  // undefined = use the loaded value; null = cleared this session
  const [answerId, setAnswerId] = useState<string | null | undefined>(undefined);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const allComments = [...(loaded.data ?? []), ...added];

  const loadedAnswer = (loaded.data ?? []).find((c) => c.isHelpfulAnswer)?.id;
  const currentAnswer = answerId === undefined ? loadedAnswer : answerId ?? undefined;
  const canChooseAnswer = !!post.data && post.data.postType === "question" && post.data.authorId === me.data?.id;

  async function chooseAnswer(commentId: string | null) {
    setAnswerError(null);
    try {
      const r = await setHelpfulAnswer(postId, commentId);
      setAnswerId(r.helpfulAnswerCommentId ?? null);
    } catch (e) {
      // Only our own validation messages are shown. Backend/transport text stays off the screen.
      setAnswerError(e instanceof ValidationError ? e.message : "Couldn't update. Try again.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const c = await addComment({ postId, body: draft });
      setAdded((list) => [...list, c]);
      setDraft("");
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Couldn't post comment. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Link href="/community" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Community
      </Link>

      {post.loading && <LoadingList count={2} label="Loading post" />}
      {post.error instanceof NotFoundError && <EmptyState title="Post not found" hint="It may have been deleted." />}
      {post.error != null && !(post.error instanceof NotFoundError) && <ErrorState onRetry={post.reload} />}

      {post.data && post.data.status !== "active" && (
        <EmptyState title="This post was removed" hint="It broke the community guidelines or was taken down by its author." />
      )}

      {blockedName && (
        <p role="status" className="rounded-xl bg-muted p-3 text-sm">
          You blocked {blockedName}. Their posts and comments are hidden from your feed.
        </p>
      )}

      {post.data && post.data.status === "active" && (
        <>
          <PostCard
            post={{ ...post.data, commentCount: allComments.filter((c) => c.status === "active").length }}
            course={course.data}
            viewerId={me.data?.id}
            variant="detail"
            onBlocked={(_, name) => setBlockedName(name)}
          />

          <section className="mt-5" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="mb-2 font-bold">
              Comments
            </h2>
            {loaded.loading && <LoadingList count={1} label="Loading comments" />}
            <ul className="space-y-2" data-testid="comment-list">
              {allComments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-xl border bg-surface p-3 ${currentAnswer === c.id ? "border-success/50" : "border-line"}`}
                  data-testid="comment"
                  data-comment-id={c.id}
                >
                  {c.status === "removed" ? (
                    <p className="text-sm italic text-ink-soft">Comment removed by moderators.</p>
                  ) : (
                    <>
                      {currentAnswer === c.id && (
                        <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success" data-testid="helpful-answer-badge">
                          <CheckCircle2 aria-hidden className="size-3.5" /> Helpful answer
                        </p>
                      )}
                      <AuthorLine author={c.author} createdAt={c.createdAt} compact />
                      <p className="mt-1.5 whitespace-pre-line text-[15px]">{c.body}</p>
                      {canChooseAnswer && c.authorId !== me.data?.id && (
                        <button
                          type="button"
                          onClick={() => chooseAnswer(currentAnswer === c.id ? null : c.id)}
                          aria-pressed={currentAnswer === c.id}
                          className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-ink-soft hover:border-success hover:text-success"
                          data-testid="mark-helpful-answer"
                        >
                          <CheckCircle2 aria-hidden className="size-4" /> {currentAnswer === c.id ? "Unmark helpful answer" : "Mark as helpful answer"}
                        </button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
            {answerError && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {answerError}
              </p>
            )}
            {canChooseAnswer && !currentAnswer && allComments.some((c) => c.status === "active" && c.authorId !== me.data?.id) && (
              <p className="mt-2 text-xs text-ink-soft" data-testid="answer-hint">
                Got what you needed? Mark the comment that helped as the helpful answer. It credits the person who answered.
              </p>
            )}
            {loaded.data && allComments.length === 0 && <p className="text-sm text-ink-soft">No comments yet. Start the conversation.</p>}

            <form onSubmit={submit} className="mt-3">
              <label htmlFor="comment-input" className="sr-only">
                Write a comment
              </label>
              <textarea
                id="comment-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={COMMUNITY_LIMITS.commentMax}
                rows={3}
                placeholder="Add a helpful reply…"
                className="w-full rounded-xl border border-line bg-surface p-3 text-base focus-visible:outline-2 focus-visible:outline-brand"
              />
              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="mt-2 min-h-11 rounded-xl bg-brand px-5 font-semibold text-on-brand disabled:opacity-50"
              >
                {sending ? "Posting…" : "Comment"}
              </button>
            </form>
          </section>
        </>
      )}
    </>
  );
}
