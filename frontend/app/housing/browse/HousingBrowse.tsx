"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PenLine } from "lucide-react";
import { HousingCard } from "@/components/housing/HousingCard";
import { SafetyNotice } from "@/components/housing/SafetyNotice";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { AVAILABILITY_OPTIONS, BUDGET_OPTIONS, DISTANCE_OPTIONS } from "@/config/housing";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { addDays, startOfToday, toDateKey } from "@/lib/dates";
import { getHousingPosts } from "@/services/housing";
import type { HousingPostType, HousingQuery, RoomType } from "@/types/models";

const selectCls =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand";

/** Browse with filters in the URL: ?type=&max=&dist=&avail=&room=&verified=1 */
export function HousingBrowse() {
  const { currentCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const type: HousingPostType = params.get("type") === "looking-for-roommate" ? "looking-for-roommate" : "room-available";
  const max = params.get("max") ?? "";
  const dist = params.get("dist") ?? "";
  const avail = params.get("avail") ?? "";
  const roomParam = params.get("room");
  const room: RoomType | "" = roomParam === "private" || roomParam === "shared" ? roomParam : "";
  const verified = params.get("verified") === "1";

  const query: HousingQuery = {
    campusId: currentCampus.id,
    type,
    pageSize: 50,
    ...(max ? { maxPriceCents: Number(max) } : {}),
    ...(dist ? { maxDistanceMiles: Number(dist) } : {}),
    ...(avail ? { availableBy: toDateKey(addDays(startOfToday(), Number(avail))) } : {}),
    ...(room ? { roomType: room } : {}),
    ...(verified ? { verifiedOnly: true } : {}),
  };
  const results = useAsync(() => getHousingPosts(query), [query]);
  const filtersOn = !!(max || dist || avail || room || verified);

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }
  const clearFilters = () => router.replace(`${pathname}?type=${type}`, { scroll: false });
  const isRooms = type === "room-available";

  return (
    <>
      <Link href="/housing" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Housing
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">{isRooms ? "Rooms near " : "Students looking near "}{currentCampus.shortName}</h1>

      <div role="tablist" aria-label="What are you looking for" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["room-available", "Rooms available"],
            ["looking-for-roommate", "People looking"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            role="tab"
            aria-selected={type === t}
            onClick={() => update({ type: t })}
            className={`min-h-11 rounded-lg text-sm font-semibold ${type === t ? "bg-surface shadow-sm" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <fieldset className="mt-3 grid grid-cols-2 gap-2" data-testid="housing-filters">
        <legend className="sr-only">Filters</legend>
        <label className="text-xs font-semibold text-ink-soft">
          {isRooms ? "Budget" : "Their budget"}
          <select aria-label="Budget" value={max} onChange={(e) => update({ max: e.target.value })} className={selectCls}>
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Distance
          <select aria-label="Distance" value={dist} onChange={(e) => update({ dist: e.target.value })} className={selectCls}>
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Availability
          <select aria-label="Availability" value={avail} onChange={(e) => update({ avail: e.target.value })} className={selectCls}>
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Room type
          <select aria-label="Room type" value={room} onChange={(e) => update({ room: e.target.value })} className={selectCls}>
            <option value="">Any room</option>
            <option value="private">Private room</option>
            <option value="shared">Shared room</option>
          </select>
        </label>
      </fieldset>
      <div className="mt-2 flex items-center gap-2">
        <Chip selected={verified} onClick={() => update({ verified: verified ? undefined : "1" })}>
          Verified students only
        </Chip>
        {filtersOn && (
          <button onClick={clearFilters} className="min-h-10 px-2 text-sm font-semibold text-brand">
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-3">
        <SafetyNotice />
      </div>

      <div className="mt-4" aria-live="polite">
        {results.loading && <LoadingList label="Loading housing" />}
        {results.error != null && <ErrorState onRetry={results.reload} />}
        {results.data && (
          <>
            <p className="mb-2 text-sm text-ink-soft" data-testid="housing-count">
              {results.data.total} {results.data.total === 1 ? "post" : "posts"}
            </p>
            {results.data.items.length === 0 ? (
              <EmptyState
                title={filtersOn ? "No housing listings match these filters" : isRooms ? "No rooms posted yet" : "No one is looking right now"}
                hint={filtersOn ? "Try a higher budget or a wider distance." : "Check back soon, or post your own."}
                action={
                  filtersOn ? (
                    <button onClick={clearFilters} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                      Clear filters
                    </button>
                  ) : (
                    <Link
                      href={`/housing/new?type=${isRooms ? "room-available" : "looking-for-roommate"}`}
                      className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand"
                    >
                      Create a listing
                    </Link>
                  )
                }
              />
            ) : (
              <div className="space-y-3" data-testid="housing-list">
                {results.data.items.map((p) => (
                  <HousingCard key={p.id} post={p} campusShortName={currentCampus.shortName} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Link
        href={`/housing/new?type=${isRooms ? "looking-for-roommate" : "room-available"}`}
        className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line font-semibold text-brand"
      >
        <PenLine aria-hidden className="size-4" /> {isRooms ? "Post what you're looking for" : "Have a room? Post it"}
      </Link>
    </>
  );
}
