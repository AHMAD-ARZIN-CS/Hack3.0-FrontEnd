"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { ProfileView } from "@/components/profile/ProfileView";
import { UserSafetyActions } from "@/components/safety/UserSafetyActions";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { NotFoundError } from "@/services/mock";
import { getCurrentUser } from "@/services/user";
import { getUserProfile } from "@/services/profiles";

/** Public profile. Shows only public offerings and never private fields (D22, D24). */
export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const profile = useAsync(() => getUserProfile(userId), [userId]);
  const me = useAsync(() => getCurrentUser(), []);
  const isSelf = me.data?.id === userId;

  return (
    <>
      <Link href="/profile" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> {isSelf ? "Back to your profile" : "Your profile"}
      </Link>

      {isSelf && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-brand/10 p-3 text-sm">
          <Info aria-hidden className="size-4 shrink-0 text-brand" />
          This is how other students see your profile. Hidden items are not shown.
        </p>
      )}

      {profile.loading && <LoadingList count={3} label="Loading profile" />}
      {profile.error instanceof NotFoundError && (
        <EmptyState title="Profile not found" hint="This student may have left or the link is wrong." />
      )}
      {profile.error != null && !(profile.error instanceof NotFoundError) && <ErrorState onRetry={profile.reload} />}
      {profile.data && <ProfileView key={profile.data.id} profile={profile.data} isOwner={false} />}
      {profile.data && me.data && !isSelf && (
        <div className="mt-6 border-t border-line pt-3">
          <UserSafetyActions userId={profile.data.id} displayName={profile.data.displayName} />
        </div>
      )}
    </>
  );
}
