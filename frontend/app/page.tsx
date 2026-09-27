"use client";

/**
 * Community home: the first screen after sign-in. People and conversation come first;
 * shortcuts, needs, and campus resources sit in a side column on desktop and below on phones.
 */
import Link from "next/link";
import {
  ChevronRight,
  GraduationCap,
  HandCoins,
  Home as HomeIcon,
  MessagesSquare,
  ShieldAlert,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { ComposerPrompt } from "@/components/community/Composer";
import { PostCard } from "@/components/community/PostCard";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { NEEDS } from "@/config/app";
import { ONBOARDING_NEEDS } from "@/config/onboarding";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { getMyFirstName, getMyOnboardingNeeds } from "@/services/auth";
import { getFeed } from "@/services/community";
import { getResources } from "@/services/resources";
import { getCurrentUser } from "@/services/user";
import type { NeedId } from "@/types/models";

const NEED_ICONS: Record<NeedId, LucideIcon> = {
  study: GraduationCap,
  food: UtensilsCrossed,
  housing: HomeIcon,
  money: HandCoins,
  community: Users,
  safety: ShieldAlert,
};

const HOME_POST_COUNT = 3;
const HOME_RESOURCE_COUNT = 3;

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { currentCampus } = useCampus();
  const session = useSession();
  const me = useAsync(() => getCurrentUser(), []);
  const latest = useAsync(() => getFeed({ campusId: currentCampus.id, pageSize: HOME_POST_COUNT }), [currentCampus.id]);
  const resources = useAsync(
    () => getResources({ campusId: currentCampus.id, onCampus: true, pageSize: HOME_RESOURCE_COUNT }),
    [currentCampus.id],
  );

  // First name and needs are private onboarding answers: read from the auth service, never from the profile.
  const firstName = session ? getMyFirstName() : undefined;
  const myNeeds = session ? getMyOnboardingNeeds() : [];
  const shortcuts = ONBOARDING_NEEDS.filter((n) => myNeeds.includes(n.id));

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div>
        <header data-testid="home-greeting">
          <p className="text-sm font-semibold text-brand">{currentCampus.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {greetingFor(new Date().getHours())}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-ink-soft">What&apos;s happening at your campus?</p>
        </header>

        <div className="mt-4">
          <ComposerPrompt displayName={me.data?.displayName} campusShortName={currentCampus.shortName} testId="home-composer" />
        </div>

        <section aria-labelledby="latest-heading" className="mt-4">
          <h2 id="latest-heading" className="sr-only">
            Latest from {currentCampus.shortName} community
          </h2>
          {latest.loading && <LoadingList count={2} label="Loading community posts" />}
          {latest.error != null && <ErrorState onRetry={latest.reload} />}
          {latest.data && latest.data.items.length === 0 && (
            <EmptyState
              title={`No posts at ${currentCampus.shortName} yet`}
              hint="Be the first to ask a question or share something useful."
              action={
                <Link href="/community/new" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
                  Start a conversation
                </Link>
              }
            />
          )}
          {latest.data && latest.data.items.length > 0 && (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" data-testid="home-latest-posts">
              {latest.data.items.map((p) => (
                <PostCard key={p.id} post={p} viewerId={me.data?.id} />
              ))}
            </div>
          )}
        </section>

        <Link
          href="/community"
          className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand"
        >
          <span className="flex items-center gap-3">
            <MessagesSquare aria-hidden className="size-6 shrink-0 text-brand" />
            <span>
              <span className="block font-bold">See all of {currentCampus.shortName} community</span>
              <span className="block text-sm text-ink-soft">Questions, events, study groups, opportunities</span>
            </span>
          </span>
          <ChevronRight aria-hidden className="size-5 text-ink-soft" />
        </Link>
      </div>

      <aside className="lg:sticky lg:top-8" aria-label="Shortcuts">
        {shortcuts.length > 0 && (
          <section aria-labelledby="foryou-heading" className="mt-6 lg:mt-0" data-testid="home-for-you">
            <h2 id="foryou-heading" className="text-lg font-bold">For you</h2>
            <p className="text-xs text-ink-soft">From what you picked during setup. Only you see this.</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {shortcuts.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-brand/40 bg-brand/5 px-3.5 text-sm font-semibold text-brand">
                    {n.label} <ChevronRight aria-hidden className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="need-heading" className="mt-8 lg:mt-6 lg:first:mt-0">
          <h2 id="need-heading" className="text-xl font-extrabold tracking-tight">
            What do you need today?
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {NEEDS.map((need) => {
              const Icon = NEED_ICONS[need.id];
              const urgent = need.id === "safety";
              const featured = need.id === "study"; // Academic is a primary system (D18)
              return (
                <li key={need.id} className={featured ? "col-span-2" : undefined}>
                  <Link
                    href={need.href}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                      featured
                        ? "min-h-24 border-sage-ink bg-sage-ink text-on-brand hover:opacity-95"
                        : urgent
                          ? "min-h-24 border-danger/30 bg-danger/5 hover:bg-danger/10"
                          : "min-h-24 border-line bg-surface hover:border-brand"
                    }`}
                  >
                    <Icon aria-hidden className={`size-6 ${featured ? "text-on-brand" : urgent ? "text-danger" : need.id === "housing" ? "text-golden-ink" : "text-brand"}`} />
                    <span className="text-[15px] font-bold leading-tight">
                      {need.label}
                      {featured && <span className="block text-sm font-medium opacity-90">Notes, study guides, and tips from students who took your course</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="campus-heading" className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="campus-heading" className="text-lg font-bold">
              On campus at {currentCampus.shortName}
            </h2>
            <Link href="/resources" className="flex min-h-11 items-center text-sm font-semibold text-brand">
              See all {resources.data ? `(${resources.data.total})` : ""} <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
          {resources.loading && <LoadingList count={2} label="Loading campus resources" />}
          {resources.error != null && <ErrorState onRetry={resources.reload} />}
          {resources.data && resources.data.items.length === 0 && (
            <EmptyState title="No campus resources listed yet" hint="County and state help is still on the Resources page." />
          )}
          {resources.data && resources.data.items.length > 0 && (
            <div className="space-y-3">
              {resources.data.items.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
