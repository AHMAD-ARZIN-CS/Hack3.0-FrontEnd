"use client";

/**
 * One community post. Used in the feed (clamped, links to detail) and on the detail page (full).
 * People-first layout: author on top, conversation actions at the bottom. No prices, no grids.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarDays,
  Flag,
  HandHelping,
  HelpCircle,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Share2,
  ShieldOff,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";
import { postTypeLabel } from "@/config/community";
import { formatMeeting } from "@/lib/format";
import { blockUser, toggleHelpful, toggleSave } from "@/services/community";
import { reportContent } from "@/services/reports";
import type { Course, Post, PostType, ReportReason } from "@/types/models";
import { AuthorLine, avatarTint, initialsOf } from "./AuthorLine";
import { LinkedEntityCard } from "./LinkedEntityCard";

const TYPE_ICONS: Record<PostType, LucideIcon> = {
  question: HelpCircle,
  discussion: MessagesSquare,
  "resource-share": Share2,
  "study-group": Users,
  event: CalendarDays,
  opportunity: Briefcase,
  announcement: Megaphone,
};

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "harassment", label: "Harassment or personal attack" },
  { id: "spam", label: "Spam or selling" },
  { id: "personal-info", label: "Shares someone's personal info" },
  { id: "integrity", label: "Cheating material (exams, answer keys)" },
  { id: "inaccurate", label: "False or misleading" },
  { id: "other", label: "Something else" },
];

export function PostCard({
  post,
  course,
  viewerId,
  variant = "feed",
  onBlocked,
}: {
  post: Post;
  course?: Course;
  viewerId?: string;
  variant?: "feed" | "detail";
  onBlocked?: (userId: string, name: string) => void;
}) {
  const [helpful, setHelpful] = useState({ count: post.helpfulCount, mine: !!post.viewerMarkedHelpful });
  const [saved, setSaved] = useState(!!post.viewerSaved);
  const [panel, setPanel] = useState<"none" | "menu" | "report" | "reported">("none");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const isOwn = viewerId === post.authorId;
  const Icon = TYPE_ICONS[post.postType];
  const nonStudent = post.author.role && post.author.role !== "student";
  const detailHref = `/community/${post.id}`;

  async function onHelpful() {
    if (isOwn) return;
    try {
      const res = await toggleHelpful(post.id);
      setHelpful({ count: res.helpfulCount, mine: res.viewerMarkedHelpful });
    } catch {
      /* e.g. own post in API mode: keep current state */
    }
  }
  async function onSave() {
    try {
      const res = await toggleSave(post.id);
      setSaved(res.viewerSaved);
    } catch {
      /* keep current state */
    }
  }
  async function onReport() {
    if (!reason) return;
    setBusy(true);
    await reportContent({ targetType: "community-post", targetId: post.id, reason });
    setBusy(false);
    setPanel("reported");
  }
  async function onBlock() {
    setBusy(true);
    await blockUser(post.authorId);
    setBusy(false);
    onBlocked?.(post.authorId, post.author.displayName);
  }

  const Title = post.title ? (
    <h2 className="mt-2 text-[17px] font-bold leading-snug">
      {variant === "feed" ? (
        <Link href={detailHref} className="hover:underline">
          {post.title}
        </Link>
      ) : (
        post.title
      )}
    </h2>
  ) : null;

  return (
    <article
      className={
        variant === "feed"
          ? `px-4 py-4 ${post.postType === "announcement" ? "border-l-4 border-l-brand bg-brand/5" : ""}`
          : `rounded-2xl border bg-surface p-4 ${post.postType === "announcement" ? "border-brand/40" : "border-line"}`
      }
      data-testid="post-card"
      data-post-id={post.id}
      data-post-type={post.postType}
    >
      <div className="flex items-start justify-between gap-2">
        <AuthorLine author={post.author} createdAt={post.createdAt} />
        {!isOwn && (
          <button
            type="button"
            aria-label="More options"
            aria-expanded={panel === "menu"}
            onClick={() => setPanel(panel === "menu" ? "none" : "menu")}
            className="-mr-1 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <MoreHorizontal aria-hidden className="size-5" />
          </button>
        )}
      </div>

      {panel === "menu" && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-muted p-2" data-testid="post-menu">
          <button type="button" onClick={() => setPanel("report")} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-surface px-3 text-sm font-semibold">
            <Flag aria-hidden className="size-4" /> Report post
          </button>
          <button type="button" disabled={busy} onClick={onBlock} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-surface px-3 text-sm font-semibold">
            <ShieldOff aria-hidden className="size-4" /> Block {post.author.displayName}
          </button>
        </div>
      )}
      {panel === "report" && (
        <fieldset className="mt-2 rounded-xl bg-muted p-3" data-testid="report-panel">
          <legend className="float-left mb-2 w-full text-sm font-bold">Why are you reporting this?</legend>
          <div className="clear-both space-y-1">
            {REPORT_REASONS.map((r) => (
              <label key={r.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="radio" name={`reason-${post.id}`} value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="size-4 accent-brand" />
                {r.label}
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={!reason || busy} onClick={onReport} className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50">
              Send report
            </button>
            <button type="button" onClick={() => setPanel("none")} className="min-h-10 rounded-lg px-3 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </fieldset>
      )}
      {panel === "reported" && (
        <p role="status" className="mt-2 rounded-xl bg-muted p-3 text-sm">
          Thanks. Moderators will review this post.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-ink" data-testid="post-type">
          <Icon aria-hidden className="size-3.5" /> {postTypeLabel(post.postType)}
        </span>
        {course && (
          <span className="rounded-full border border-brand/40 bg-brand/5 px-2 py-0.5 font-semibold" data-testid="post-course">
            {course.code}
          </span>
        )}
        {post.tags.map((t) => (
          <span key={t} className="rounded-full px-1.5 py-0.5 text-ink-soft">
            #{t}
          </span>
        ))}
        {post.isDemo && <DemoBadge />}
      </div>

      {Title}
      <p className={`mt-1.5 whitespace-pre-line text-[15px] ${variant === "feed" ? "line-clamp-4" : ""}`}>{post.body}</p>

      {post.image && (
        <figure className="mt-3 overflow-hidden rounded-xl border border-line bg-muted" data-testid="post-image">
          <Image
            src={post.image.url}
            alt={post.image.alt}
            width={post.image.width}
            height={post.image.height}
            unoptimized
            className="h-auto max-h-96 w-full object-cover"
          />
        </figure>
      )}

      {post.meeting && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted p-3 text-sm" data-testid="post-meeting">
          {post.postType === "event" ? (
            <DateBlock iso={post.meeting.startsAt} />
          ) : (
            <CalendarDays aria-hidden className="size-5 shrink-0 text-brand" />
          )}
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{formatMeeting(post.meeting.startsAt)}</span>
            {post.meeting.recurring && <span className="text-ink-soft"> · {post.meeting.recurring}</span>}
            <span className="block text-ink-soft">{post.meeting.locationName}</span>
          </span>
        </div>
      )}

      {post.going && post.going.count > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft" data-testid="post-going">
          <span className="flex -space-x-1.5" aria-hidden>
            {post.going.preview.map((u) => (
              <span key={u.id} className={`flex size-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-surface ${avatarTint(u)}`}>
                {initialsOf(u.displayName)}
              </span>
            ))}
          </span>
          <span>
            <span className="font-semibold text-ink">{post.going.count}</span> {post.postType === "study-group" ? "in this group" : "going"}
          </span>
        </div>
      )}

      {post.linkedPreview && <LinkedEntityCard preview={post.linkedPreview} />}

      {nonStudent && (
        <p className="mt-2 text-xs text-ink-soft" data-testid="not-official-note">
          Posted by {post.author.role === "organization" ? "a campus group" : "an individual"}. Not an official college statement.
        </p>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        <button
          type="button"
          onClick={onHelpful}
          disabled={isOwn}
          aria-pressed={helpful.mine}
          title={isOwn ? "You can't mark your own post" : undefined}
          className={`flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold disabled:cursor-default ${
            helpful.mine ? "bg-petal/12 text-petal-ink" : "text-ink-soft hover:bg-muted"
          }`}
          data-testid="helpful-button"
        >
          <HandHelping aria-hidden className="size-4" /> Helpful <span data-testid="helpful-count">{helpful.count}</span>
        </button>
        {variant === "feed" ? (
          <Link href={detailHref} className="flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink-soft hover:bg-muted" data-testid="comments-link">
            <MessageCircle aria-hidden className="size-4" /> {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </Link>
        ) : (
          <span className="flex min-h-10 items-center gap-1.5 px-2.5 text-sm font-semibold text-ink-soft">
            <MessageCircle aria-hidden className="size-4" /> {post.commentCount}
          </span>
        )}
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          className={`ml-auto flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold ${saved ? "text-brand" : "text-ink-soft hover:bg-muted"}`}
          data-testid="save-button"
        >
          {saved ? <BookmarkCheck aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}

/** Calendar-style date for event posts. Shown in the viewer's local time zone. */
function DateBlock({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <CalendarDays aria-hidden className="size-5 shrink-0 text-brand" />;
  return (
    <span aria-hidden className="flex w-14 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface text-center" data-testid="event-date-block">
      <span className="bg-petal-ink py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{d.toLocaleDateString("en-US", { month: "short" })}</span>
      <span className="font-display text-2xl font-bold leading-8">{d.getDate()}</span>
      <span className="pb-1 text-[10px] font-semibold uppercase text-ink-soft">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
    </span>
  );
}
