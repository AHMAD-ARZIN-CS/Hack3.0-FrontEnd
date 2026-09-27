"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, LogOut } from "lucide-react";
import { ProfileView } from "@/components/profile/ProfileView";
import { ErrorState, LoadingList } from "@/components/ui/States";
import { APP_NAME, SUPPORTED_CAMPUSES } from "@/config/app";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { signOut } from "@/services/auth";
import { getMyProfile, listDemoProfiles } from "@/services/profiles";

/** Own profile: all offerings with visibility switches, campus browsing, demo links. */
export default function MyProfilePage() {
  const router = useRouter();
  const { currentCampus, campuses, setCampus } = useCampus();
  const me = useAsync(() => getMyProfile(), []);
  const others = useAsync(() => listDemoProfiles(), []);

  return (
    <>
      {me.loading && <LoadingList count={3} label="Loading your profile" />}
      {me.error != null && <ErrorState onRetry={me.reload} />}
      {me.data && (
        <>
          <ProfileView key={me.data.id} profile={me.data} isOwner />
          <Link
            href={`/profile/${me.data.id}`}
            className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface font-semibold"
          >
            <Eye aria-hidden className="size-4" /> See how others see your profile
          </Link>
        </>
      )}

      <section className="mt-8">
        <h2 className="mb-2 font-bold">Browsing campus</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Choose which campus to browse</legend>
          {campuses.map((c) => (
            <label
              key={c.id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 ${
                c.id === currentCampus.id ? "border-brand bg-brand/5" : "border-line bg-surface"
              }`}
            >
              <input
                type="radio"
                name="campus"
                value={c.id}
                checked={c.id === currentCampus.id}
                onChange={() => setCampus(c.id)}
                className="size-4 accent-brand"
              />
              <span>
                <span className="font-semibold">{c.name}</span>
                <span className="block text-sm text-ink-soft">{c.city}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      {others.data && others.data.length > 0 && (
        <section className="mt-8" data-testid="demo-profiles">
          <h2 className="mb-2 font-bold">Demo: other student profiles</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {others.data.map((u) => (
              <li key={u.id}>
                <Link href={`/profile/${u.id}`} className="flex min-h-12 items-center justify-between px-4 py-2">
                  <span>
                    <span className="font-semibold">{u.displayName}</span>
                    <span className="block text-sm text-ink-soft">
                      {SUPPORTED_CAMPUSES.find((c) => c.id === u.campusId)?.shortName}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 text-sm text-ink-soft">
        <h2 className="mb-1 font-bold text-ink">About {APP_NAME}</h2>
        <p>
          A student-built hackathon project that helps East Bay students find existing resources, share course knowledge,
          and connect. It is not an official college system. Verification confirms student status only and does not
          guarantee safety. In demo mode, sign-in is simulated in this browser.
        </p>
      </section>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.replace("/welcome");
        }}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface font-semibold text-danger"
        data-testid="sign-out"
      >
        <LogOut aria-hidden className="size-4" /> Sign out
      </button>
    </>
  );
}
