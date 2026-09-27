import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, ShieldAlert, ShoppingBag, Signpost, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { DISCOVER_SECTIONS, type DiscoverIcon } from "@/config/app";

export const metadata: Metadata = { title: "Discover" };

const ICONS: Record<DiscoverIcon, LucideIcon> = {
  food: UtensilsCrossed,
  marketplace: ShoppingBag,
  resources: Signpost,
  opportunities: Briefcase,
};

/** Discover = four clear doors, not one page of everything (D35). Destinations come from config. */
export default function DiscoverPage() {
  return (
    <>
      <p className="text-sm font-semibold text-brand">Discover</p>
      <h1 className="text-3xl font-extrabold tracking-tight">What can you find near campus?</h1>
      <p className="mt-1 text-ink-soft">Pick where you want to go.</p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2" data-testid="discover-sections">
        {DISCOVER_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon];
          const live = section.status === "live";
          const body = (
            <>
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${live ? "bg-brand text-on-brand" : "bg-muted text-ink-soft"}`}>
                <Icon aria-hidden className="size-6" />
              </span>
              <span className="mt-3 flex items-center gap-2 text-lg font-bold">
                {section.title}
                {!live && <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-ink-soft">Not open yet</span>}
              </span>
              <span className="mt-1 block text-[15px] text-ink-soft">{section.description}</span>
              {live && (
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Open {section.title} <ArrowRight aria-hidden className="size-4" />
                </span>
              )}
            </>
          );
          const cls = "flex h-full flex-col rounded-2xl border bg-surface p-5";
          return (
            <li key={section.id} data-section={section.id}>
              {live ? (
                <Link href={section.href} className={`${cls} border-line hover:border-brand hover:shadow-sm`}>
                  {body}
                </Link>
              ) : (
                <div className={`${cls} border-dashed border-line`} aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Link href="/safety" className="mt-4 flex min-h-12 items-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-4 font-semibold text-danger">
        <ShieldAlert aria-hidden className="size-5" /> Need safety help? Emergency and campus safety contacts
      </Link>
    </>
  );
}
