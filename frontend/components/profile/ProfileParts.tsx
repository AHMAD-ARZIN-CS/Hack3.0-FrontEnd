/**
 * Presentational pieces of a profile. No data fetching, no reputation math.
 * Missing optional fields render nothing (public) or a gentle empty state (own).
 */
import Link from "next/link";
import { Award, BookOpen, GraduationCap, Lightbulb, MapPin, MessageSquare, Sparkles } from "lucide-react";
import { DemoBadge, VerifiedBadge, Badge as Pill } from "@/components/ui/Badge";
import { SUPPORTED_CAMPUSES } from "@/config/app";
import { ROLE_LABELS } from "@/config/community";
import { BADGE_DISCLAIMER, LIVE_PROFILE_STATS } from "@/config/reputation";
import type { TagOption } from "@/config/tags";
import { tagLabel } from "@/config/tags";
import { formatMonthYear } from "@/lib/dates";
import type { Badge, Contribution, Course, UserProfile } from "@/types/models";

export function Section({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section className="mt-6" data-testid={testId}>
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ProfileHeader({ profile }: { profile: UserProfile }) {
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === profile.campusId);
  const initials = profile.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const toNext = profile.nextLevelAt !== undefined ? profile.nextLevelAt - profile.points : undefined;

  return (
    <header className="rounded-2xl border border-line bg-surface p-4" data-testid="profile-header">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-extrabold text-brand"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight">{profile.displayName}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5" />
              {campus?.name ?? profile.campusId}
            </span>
            {profile.major && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap aria-hidden className="size-3.5" />
                {profile.major}
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(profile.role ?? "student") === "student" ? (
              profile.verifiedStudent ? <VerifiedBadge label="Verified student" /> : <Pill>Not verified yet</Pill>
            ) : (
              <>
                <Pill tone="brand">{ROLE_LABELS[profile.role!]}</Pill>
                {profile.roleVerified ? <VerifiedBadge label="Verified role" /> : <Pill>Role not confirmed</Pill>}
              </>
            )}
            <Pill tone="brand">
              Level {profile.level} · {profile.levelName}
            </Pill>
            {profile.isDemo && <DemoBadge />}
          </div>
        </div>
      </div>
      {profile.role && profile.role !== "student" && profile.roleTitle && (
        <p className="mt-2 text-sm text-ink-soft">{profile.roleTitle}</p>
      )}
      {profile.bio && <p className="mt-3 text-[15px]">{profile.bio}</p>}
      <p className="mt-3 text-xs text-ink-soft">
        {profile.points} contribution points
        {toNext !== undefined ? ` · ${toNext} to next level` : " · top level"} · Joined {formatMonthYear(profile.joinedAt)}
      </p>
    </header>
  );
}

/** Only metrics backed by a live contribution source (config LIVE_PROFILE_STATS, D32). */
export function StatGrid({ profile }: { profile: UserProfile }) {
  const s = profile.stats;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2" data-testid="profile-stats">
      {LIVE_PROFILE_STATS.map((m, i) => (
        <div
          key={m.key}
          data-stat={m.key}
          className={`rounded-xl border border-line bg-surface p-3 ${i === LIVE_PROFILE_STATS.length - 1 && LIVE_PROFILE_STATS.length % 2 === 1 ? "col-span-2" : ""}`}
        >
          <dt className="text-xs text-ink-soft">{m.label}</dt>
          <dd className="text-2xl font-extrabold">{s[m.key] ?? 0}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One tag category. Each category has its own look so they are never read as one list. */
export function TagGroup({
  ids,
  options,
  tone,
  testId,
}: {
  ids: string[];
  options: TagOption[];
  tone: "interest" | "marketplace";
  testId: string;
}) {
  const cls =
    tone === "interest"
      ? "border-[var(--activity-2)] bg-[var(--activity-1)]/40 text-ink"
      : "border-line bg-muted text-ink";
  return (
    <ul className="flex flex-wrap gap-1.5" data-testid={testId}>
      {ids.map((id) => (
        <li key={id} className={`rounded-full border px-3 py-1 text-sm font-medium ${cls}`}>
          {tagLabel(options, id)}
        </li>
      ))}
    </ul>
  );
}

export function CourseTags({ courses, testId }: { courses: Course[]; testId: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5" data-testid={testId}>
      {courses.map((c) => (
        <li key={c.id}>
          <Link
            href={`/academic/${c.id}`}
            title={c.title}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-brand/40 bg-brand/5 px-2.5 py-1 text-sm hover:bg-brand/10"
          >
            <BookOpen aria-hidden className="size-3.5 text-brand" />
            <span className="whitespace-nowrap font-semibold">{c.code}</span>
            <span className="text-ink-soft">{c.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function BadgeList({ badges }: { badges: Badge[] }) {
  return (
    <>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="profile-badges">
        {badges.map((b) => (
          <li key={b.id} className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3" data-badge={b.id}>
            <Award aria-hidden className="mt-0.5 size-5 shrink-0 text-warn" />
            <span>
              <span className="block font-semibold">{b.name}</span>
              <span className="block text-sm text-ink-soft">{b.description}</span>
              {b.earnedAt && (
                <span className="block text-xs text-ink-soft">
                  Earned {new Date(b.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <BadgeNote />
    </>
  );
}

export function BadgeNote() {
  return (
    <p className="mt-2 text-xs text-ink-soft" data-testid="badge-disclaimer">
      {BADGE_DISCLAIMER}
    </p>
  );
}

const KIND_LABEL: Record<string, string> = {
  notes: "Notes",
  "study-guide": "Study guide",
  practice: "Practice",
  "study-strategy": "Study strategy",
  tip: "Tip",
  question: "Question",
  discussion: "Discussion",
  "resource-share": "Shared resource",
  "study-group": "Study group",
  answer: "Helpful answer",
};

function historyHref(c: Contribution): string | undefined {
  if (c.type === "academic-resource" && c.courseId) return `/academic/${c.courseId}/${c.id}`;
  if (c.type === "academic-tip" && c.courseId) return `/academic/${c.courseId}?show=tips`;
  if (c.type === "community-post") return `/community/${c.id}`;
  if (c.type === "community-answer" && c.parentId) return `/community/${c.parentId}`;
  return undefined;
}

export function ContributionList({
  items,
  coursesById,
}: {
  items: Contribution[];
  coursesById: Map<string, Course>;
}) {
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface" data-testid="profile-history">
      {items.map((c) => {
        const course = c.courseId ? coursesById.get(c.courseId) : undefined;
        const Icon = c.type === "academic-tip" ? Lightbulb : c.type === "community-post" || c.type === "community-answer" ? MessageSquare : Sparkles;
        const href = historyHref(c);
        return (
          <li key={`${c.type}-${c.id}`} className="flex gap-3 p-3" data-history-type={c.type} data-history-id={c.id}>
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="font-semibold leading-snug">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {c.title}
                  </Link>
                ) : (
                  c.title
                )}
              </p>
              <p className="text-xs text-ink-soft">
                {[
                  c.kind ? KIND_LABEL[c.kind] ?? c.kind : undefined,
                  course?.code,
                  c.helpfulCount !== undefined ? `${c.helpfulCount} helpful` : undefined,
                  new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-3 text-sm text-ink-soft">{children}</p>;
}
