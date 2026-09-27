"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { Chip } from "@/components/ui/Chip";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { NEEDS } from "@/config/app";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getResources } from "@/services/resources";
import type { NeedId, ResourceQuery } from "@/types/models";

type Where = "all" | "on" | "off";

/** Filters live in the URL (?need=food&q=pantry&where=on) so views are shareable. */
export function ResourceExplorer() {
  const { currentCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const needParam = params.get("need");
  const need = NEEDS.some((n) => n.id === needParam) ? (needParam as NeedId) : undefined;
  const q = params.get("q") ?? "";
  const whereParam = params.get("where");
  const where: Where = whereParam === "on" || whereParam === "off" ? whereParam : "all";

  const query: ResourceQuery = {
    campusId: currentCampus.id,
    need,
    q: q || undefined,
    onCampus: where === "all" ? undefined : where === "on",
    pageSize: 50,
  };
  const { data, loading, error, reload } = useAsync(() => getResources(query), [query]);

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const activeNeed = NEEDS.find((n) => n.id === need);

  return (
    <>
      <SearchBar
        key={q}
        initialValue={q}
        label="Search resources"
        placeholder="Try “pantry”, “tutoring”, “bus”"
        onSearch={(value) => update({ q: value || undefined })}
      />

      <div role="group" aria-label="Filter by need" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        <Chip selected={!need} onClick={() => update({ need: undefined })}>
          All
        </Chip>
        {NEEDS.map((n) => (
          <Chip key={n.id} selected={need === n.id} onClick={() => update({ need: need === n.id ? undefined : n.id })}>
            {n.short}
          </Chip>
        ))}
      </div>

      <div role="group" aria-label="Location" className="mt-2 flex gap-2">
        {(
          [
            ["all", "Everywhere"],
            ["on", "On campus"],
            ["off", "Off campus"],
          ] as const
        ).map(([value, label]) => (
          <Chip key={value} selected={where === value} onClick={() => update({ where: value === "all" ? undefined : value })}>
            {label}
          </Chip>
        ))}
      </div>

      {activeNeed?.feature && (
        <Link
          href={activeNeed.feature.href}
          className="mt-4 flex min-h-12 items-center justify-between rounded-2xl bg-brand px-4 py-3 font-semibold text-on-brand"
        >
          {activeNeed.feature.label}
          <ArrowRight aria-hidden className="size-5" />
        </Link>
      )}

      <div className="mt-4" aria-live="polite">
        {loading && <LoadingList label="Loading resources" />}
        {error != null && <ErrorState onRetry={reload} />}
        {data && (
          <>
            <p className="mb-2 text-sm text-ink-soft">
              {data.total} {data.total === 1 ? "resource" : "resources"} for {currentCampus.shortName}
              {activeNeed ? ` · ${activeNeed.short}` : ""}
              {q ? ` · “${q}”` : ""}
            </p>
            {data.items.length === 0 ? (
              <EmptyState
                title="No resources are available for this selection"
                hint="Try a different word or clear the filters. For urgent help, Safety has emergency contacts."
                action={
                  <button
                    onClick={() => update({ q: undefined, need: undefined, where: undefined })}
                    className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.items.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
