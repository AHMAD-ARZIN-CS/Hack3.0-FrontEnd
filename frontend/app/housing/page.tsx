"use client";

import Link from "next/link";
import { ArrowRight, House, PenLine, Search } from "lucide-react";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { SafetyNotice } from "@/components/housing/SafetyNotice";
import { LoadingList } from "@/components/ui/States";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getResources } from "@/services/resources";

/** Housing start: pick your situation first (need-first principle). */
export default function HousingStartPage() {
  const { currentCampus } = useCampus();
  const help = useAsync(() => getResources({ campusId: currentCampus.id, need: "housing", pageSize: 3 }), [currentCampus.id]);

  return (
    <>
      <p className="text-sm font-semibold text-golden-ink">{currentCampus.name}</p>
      <h1 className="text-2xl font-extrabold tracking-tight">Housing</h1>
      <p className="mb-4 text-ink-soft">Find a room or a roommate among students near {currentCampus.shortName}.</p>

      <div className="grid gap-3" data-testid="housing-start">
        <Link
          href="/housing/browse?type=room-available"
          className="flex items-center justify-between gap-3 rounded-2xl bg-brand p-4 text-on-brand hover:opacity-95"
          data-testid="start-need-housing"
        >
          <span className="flex gap-3">
            <Search aria-hidden className="mt-0.5 size-6 shrink-0" />
            <span>
              <span className="block text-lg font-extrabold">I need housing</span>
              <span className="block text-sm opacity-90">Browse rooms other students have available.</span>
            </span>
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0" />
        </Link>
        <Link
          href="/housing/browse?type=looking-for-roommate"
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand"
          data-testid="start-have-housing"
        >
          <span className="flex gap-3">
            <House aria-hidden className="mt-0.5 size-6 shrink-0 text-golden-ink" />
            <span>
              <span className="block text-lg font-extrabold">I have housing / need a roommate</span>
              <span className="block text-sm text-ink-soft">See students who are looking for a room.</span>
            </span>
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0 text-ink-soft" />
        </Link>
        <Link
          href="/housing/new"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line font-semibold text-brand"
          data-testid="start-post"
        >
          <PenLine aria-hidden className="size-4" /> Post a room or what you&apos;re looking for
        </Link>
      </div>

      <div className="mt-4">
        <SafetyNotice />
      </div>

      <section className="mt-6" aria-labelledby="help-heading">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="help-heading" className="font-bold">
            Housing help
          </h2>
          <Link href="/resources?need=housing" className="flex min-h-11 items-center text-sm font-semibold text-brand">
            All housing resources
          </Link>
        </div>
        {help.loading && <LoadingList count={1} label="Loading housing help" />}
        <div className="space-y-3">
          {help.data?.items.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      </section>
    </>
  );
}
