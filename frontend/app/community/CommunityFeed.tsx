"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ComposerPrompt } from "@/components/community/Composer";
import { PostCard } from "@/components/community/PostCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { POST_TYPES } from "@/config/community";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getFeed, unblockUser } from "@/services/community";
import { getCourses } from "@/services/courses";
import { getCurrentUser } from "@/services/user";
import type { PostType } from "@/types/models";

/** Campus feed. Filters in the URL: ?type=question, ?saved=1 */
export function CommunityFeed() {
  const { currentCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const typeParam = params.get("type");
  const postType = POST_TYPES.some((t) => t.id === typeParam) ? (typeParam as PostType) : undefined;
  const savedOnly = params.get("saved") === "1";

  const [blocked, setBlocked] = useState<{ id: string; name: string } | null>(null);
  const [version, setVersion] = useState(0);

  const feed = useAsync(
    () => getFeed({ campusId: currentCampus.id, postType, savedOnly: savedOnly || undefined, pageSize: 50 }),
    [currentCampus.id, postType, savedOnly, version],
  );
  const courses = useAsync(() => getCourses({ campusId: currentCampus.id, pageSize: 50 }), [currentCampus.id]);
  const me = useAsync(() => getCurrentUser(), []);
  const courseMap = new Map((courses.data?.items ?? []).map((c) => [c.id, c]));

  function setFilter(next: { type?: string; saved?: string }) {
    const q = new URLSearchParams();
    if (next.type) q.set("type", next.type);
    if (next.saved) q.set("saved", next.saved);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-petal-ink">{currentCampus.name}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{currentCampus.shortName} community</h1>
          <p className="text-sm text-ink-soft">Questions, study groups, events, and opportunities from your campus.</p>
        </div>
      </div>

      <div className="mb-3">
        <ComposerPrompt displayName={me.data?.displayName} campusShortName={currentCampus.shortName} />
      </div>

      <div role="group" aria-label="Filter posts" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        <Chip selected={!postType && !savedOnly} onClick={() => setFilter({})}>
          All
        </Chip>
        {POST_TYPES.map((t) => (
          <Chip key={t.id} selected={postType === t.id} onClick={() => setFilter({ type: postType === t.id ? undefined : t.id })}>
            {t.plural}
          </Chip>
        ))}
        <Chip selected={savedOnly} onClick={() => setFilter({ saved: savedOnly ? undefined : "1" })}>
          Saved
        </Chip>
      </div>

      {blocked && (
        <p role="status" className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-muted p-3 text-sm">
          You won&apos;t see posts from {blocked.name}.
          <button
            type="button"
            className="min-h-10 rounded-lg bg-surface px-3 font-semibold"
            onClick={async () => {
              await unblockUser(blocked.id);
              setBlocked(null);
              setVersion((v) => v + 1);
            }}
          >
            Undo
          </button>
        </p>
      )}

      <div className="mt-3 space-y-3" aria-live="polite">
        {feed.loading && <LoadingList label="Loading posts" />}
        {feed.error != null && <ErrorState onRetry={feed.reload} />}
        {feed.data &&
          (feed.data.items.length === 0 ? (
            <EmptyState
              title={savedOnly ? "No saved posts yet" : "No posts here yet"}
              hint={savedOnly ? "Tap Save on a post to keep it here." : `Be the first to post in the ${currentCampus.shortName} community.`}
              action={
                <Link href="/community/new" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
                  Start a conversation
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" data-testid="feed-list">
            {feed.data.items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                course={post.courseId ? courseMap.get(post.courseId) : undefined}
                viewerId={me.data?.id}
                onBlocked={(id, name) => {
                  setBlocked({ id, name });
                  setVersion((v) => v + 1);
                }}
              />
            ))}
            </div>
          ))}
      </div>
    </>
  );
}
