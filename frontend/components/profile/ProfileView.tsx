"use client";

/**
 * Full profile layout, shared by own (/profile) and public (/profile/[userId]) views.
 * Data flow: profile (from services/profiles) + courses + activity (services) → presentational parts.
 */
import Link from "next/link";
import { useState } from "react";
import { ErrorState, LoadingList } from "@/components/ui/States";
import { INTEREST_TAGS, MARKETPLACE_TAGS } from "@/config/tags";
import { useAsync } from "@/hooks/useAsync";
import { getCoursesByIds } from "@/services/courses";
import { getContributionActivity, setOfferingVisibility } from "@/services/profiles";
import type { Course, ProfileOffering, UserProfile, Visibility } from "@/types/models";
import { ContributionGraph } from "./ContributionGraph";
import { OfferingList } from "./OfferingList";
import {
  BadgeList,
  BadgeNote,
  ContributionList,
  CourseTags,
  Empty,
  ProfileHeader,
  Section,
  StatGrid,
  TagGroup,
} from "./ProfileParts";

export function ProfileView({ profile, isOwner }: { profile: UserProfile; isOwner: boolean }) {
  const courseIds = [
    ...profile.academic.currentCourseIds,
    ...profile.academic.pastCourseIds,
    ...profile.recentContributions.map((c) => c.courseId).filter((id): id is string => !!id),
  ];
  const courses = useAsync(() => getCoursesByIds([...new Set(courseIds)]), [courseIds]);
  const activity = useAsync(() => getContributionActivity(profile.id), [profile.id]);

  const [offerings, setOfferings] = useState<ProfileOffering[]>(profile.offerings);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState(false);

  async function toggle(id: string, next: Visibility) {
    setPendingId(id);
    setToggleError(false);
    try {
      const updated = await setOfferingVisibility(id, next);
      setOfferings((list) => list.map((o) => (o.id === id ? { ...o, visibility: updated.visibility } : o)));
    } catch {
      setToggleError(true);
    } finally {
      setPendingId(null);
    }
  }

  const coursesById = new Map<string, Course>((courses.data ?? []).map((c) => [c.id, c]));
  const pick = (ids: string[]) => ids.map((id) => coursesById.get(id)).filter((c): c is Course => !!c);
  const current = pick(profile.academic.currentCourseIds);
  const past = pick(profile.academic.pastCourseIds);
  const hasCourses = profile.academic.currentCourseIds.length + profile.academic.pastCourseIds.length > 0;

  return (
    <div data-testid="profile-view" data-owner={isOwner ? "true" : "false"}>
      <ProfileHeader profile={profile} />
      <StatGrid profile={profile} />

      <Section title="Contribution activity" testId="profile-activity">
        <div className="rounded-2xl border border-line bg-surface p-3">
          {activity.loading && <LoadingList count={1} label="Loading activity" />}
          {activity.error != null && <ErrorState onRetry={activity.reload} />}
          {activity.data && <ContributionGraph activity={activity.data} />}
        </div>
      </Section>

      {(profile.badges.length > 0 || isOwner) && (
        <Section title="Badges">
          {profile.badges.length > 0 ? (
            <BadgeList badges={profile.badges} />
          ) : (
            <>
              <Empty>Share an approved resource to earn your first badge.</Empty>
              <BadgeNote />
            </>
          )}
        </Section>
      )}

      {(hasCourses || isOwner) && (
        <Section title="Courses" testId="profile-courses">
          {courses.loading && hasCourses && <LoadingList count={1} label="Loading courses" />}
          {!hasCourses && <Empty>No courses added yet.</Empty>}
          {isOwner && (
            <Link href="/academic/courses" className="mb-2 inline-flex min-h-10 items-center text-sm font-semibold text-brand" data-testid="manage-courses">
              Manage my courses
            </Link>
          )}
          {current.length > 0 && (
            <>
              <h3 className="mb-1.5 text-sm font-semibold text-ink-soft">Taking now</h3>
              <CourseTags courses={current} testId="courses-current" />
            </>
          )}
          {past.length > 0 && (
            <>
              <h3 className="mb-1.5 mt-3 text-sm font-semibold text-ink-soft">Previously taken</h3>
              <CourseTags courses={past} testId="courses-past" />
            </>
          )}
        </Section>
      )}

      {(profile.interests.length > 0 || isOwner) && (
        <Section title="Interests">
          {profile.interests.length > 0 ? (
            <TagGroup ids={profile.interests} options={INTEREST_TAGS} tone="interest" testId="tags-interests" />
          ) : (
            <Empty>No interests added yet.</Empty>
          )}
        </Section>
      )}

      {profile.marketplaceCategories.length > 0 && (
        <Section title="Exchanges">
          <TagGroup
            ids={profile.marketplaceCategories}
            options={MARKETPLACE_TAGS}
            tone="marketplace"
            testId="tags-marketplace"
          />
        </Section>
      )}

      {(offerings.length > 0 || isOwner) && (
        <Section title={isOwner ? "Needs & offerings" : "Currently"}>
          {isOwner && (
            <p className="mb-2 text-sm text-ink-soft">
              Hidden items are visible only to you. Details like addresses always stay on the Housing page.
            </p>
          )}
          {offerings.length > 0 ? (
            <OfferingList offerings={offerings} isOwner={isOwner} onToggle={toggle} pendingId={pendingId} />
          ) : (
            <Empty>Nothing listed.</Empty>
          )}
          {toggleError && <p role="alert" className="mt-2 text-sm text-danger">Couldn&apos;t update. Try again.</p>}
        </Section>
      )}

      <Section title="Contribution history">
        {profile.recentContributions.length > 0 ? (
          <ContributionList items={profile.recentContributions} coursesById={coursesById} />
        ) : (
          <Empty>No contributions yet. Approved resources and tips, and community posts other students find helpful, show up here.</Empty>
        )}
      </Section>
    </div>
  );
}
