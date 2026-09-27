"use client";

/**
 * Chooses the page chrome and access rule by route (D33).
 * - Public routes: full-width, own header, no tabs.
 * - Auth-flow routes (verify email, onboarding): focused layout, needs a session.
 * - App routes: top bar + tabs, needs a verified, onboarded account. Otherwise redirects to the next step.
 * The gate is UX only. Real protection is the backend refusing unauthenticated API calls.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { TopBar } from "@/components/layout/TopBar";
import { LoadingList } from "@/components/ui/States";
import { AUTH_FLOW_ROUTES, AUTH_MODE, PUBLIC_ROUTES } from "@/config/app";
import { useSession } from "@/hooks/useSession";
import { nextStepFor, refreshSession } from "@/services/auth";

const WIDE_ROUTES = ["/", "/discover"];

const matches = (path: string, list: readonly string[]) => list.some((r) => path === r || path.startsWith(`${r}/`));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const isPublic = matches(pathname, PUBLIC_ROUTES);
  const isFlow = matches(pathname, AUTH_FLOW_ROUTES);

  // Backend auth: load the provider session once.
  useEffect(() => {
    if (AUTH_MODE === "backend" && session === undefined) void refreshSession();
  }, [session]);

  const target = session === undefined ? null : nextStepFor(session);
  // Flow pages: go wherever the account's next step is (finished accounts go to Home).
  // App pages: only a finished account stays.
  const redirect = isPublic || target === null ? null : isFlow ? (target !== pathname ? target : null) : target !== "/" ? target : null;

  useEffect(() => {
    if (redirect && redirect !== pathname) router.replace(redirect);
  }, [redirect, pathname, router]);

  if (isPublic) {
    return (
      <>
        <DemoBanner />
        <main id="main">{children}</main>
      </>
    );
  }

  const ready = session !== undefined && !redirect;

  if (isFlow) {
    return (
      <>
        <DemoBanner />
        <main id="main" className="mx-auto max-w-lg px-4 pb-16 pt-6">
          {ready ? children : <LoadingList count={2} label="Loading" />}
        </main>
      </>
    );
  }

  // Feed-style pages get a second column on wide screens; forms and detail pages stay readable width.
  const wide = WIDE_ROUTES.includes(pathname);
  return (
    <>
      <TopBar />
      <div className="lg:pl-64">
        <DemoBanner />
        <main id="main" className={`mx-auto px-4 pb-28 pt-4 lg:px-8 lg:pb-12 lg:pt-8 ${wide ? "max-w-screen-sm lg:max-w-6xl" : "max-w-screen-sm lg:max-w-3xl"}`}>
          {ready ? children : <LoadingList count={3} label="Checking your account" />}
        </main>
      </div>
      <BottomNavigation />
    </>
  );
}
