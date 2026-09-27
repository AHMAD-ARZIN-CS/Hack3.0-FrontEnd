import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { CampusSelector } from "./CampusSelector";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3">
          {/* LOGO: phone top bar. Change the logo in components/brand/Logo.tsx */}
          <Link href="/" className="inline-flex text-base text-brand">
            <LogoLockup size="sm" />
          </Link>
          <CampusSelector />
        </div>
        <nav aria-label="Quick links" className="flex items-center gap-1">
          <Link
            href="/safety"
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            <ShieldAlert aria-hidden className="size-4" />
            Safety
          </Link>
        </nav>
      </div>
    </header>
  );
}
