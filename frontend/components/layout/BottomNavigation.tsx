"use client";

/**
 * The one primary navigation. Phones: fixed bottom tabs (icon + label).
 * Desktop (lg): fixed left sidebar with logo, campus, and a one-line hint per area,
 * so the app uses the width instead of stretching a phone layout.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Compass, GraduationCap, ShieldAlert, UserRound, Users, type LucideIcon } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { NAV_ITEMS, type NavIcon } from "@/config/app";
import { CampusSelector } from "./CampusSelector";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  community: Users,
  academic: GraduationCap,
  discover: Compass,
  housing: BedDouble,
  profile: UserRound,
};

export function isNavActive(pathname: string, href: string, match: string[]): boolean {
  if (href === "/" ? pathname === "/" : pathname.startsWith(href)) return true;
  return match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:bg-sidebar lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-t-0 lg:px-3 lg:py-5"
    >
      <div className="hidden px-2 lg:block">
        {/* LOGO: desktop sidebar. Change the logo in components/brand/Logo.tsx */}
        <Link href="/" className="inline-flex text-lg text-brand">
          <LogoLockup />
        </Link>
        <div className="mt-4">
          <CampusSelector />
        </div>
      </div>

      <ul className="mx-auto grid max-w-screen-sm grid-cols-5 lg:mx-0 lg:mt-6 lg:flex lg:max-w-none lg:flex-col lg:gap-1">
        {NAV_ITEMS.map(({ href, label, hint, icon, match }) => {
          const Icon = NAV_ICONS[icon];
          const active = isNavActive(pathname, href, match);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-[15px] ${
                  active ? "text-brand lg:bg-surface lg:shadow-sm" : "text-ink-soft hover:text-ink lg:hover:bg-surface/60"
                }`}
              >
                <Icon aria-hidden className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="lg:flex lg:flex-col">
                  <span className={active ? "font-bold" : "lg:font-semibold"}>{label}</span>
                  <span className="hidden text-xs font-normal text-ink-soft lg:block">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto hidden px-2 lg:block">
        <Link href="/safety" className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-danger hover:bg-danger/10">
          <ShieldAlert aria-hidden className="size-4" /> Safety help
        </Link>
      </div>
    </nav>
  );
}
