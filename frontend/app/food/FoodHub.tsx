"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { FoodDealCard } from "@/components/food/FoodDealCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { DIETARY_TAGS, FOOD_COPY, FOOD_DISTANCE_OPTIONS, FOOD_PRICE_OPTIONS } from "@/config/food";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getFoodDeals } from "@/services/food";
import { getResources } from "@/services/resources";
import type { FoodDealQuery } from "@/types/models";

const selectCls =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand";

/** Food in Discover: free help first, then discounted surplus food. Filters: ?dist=&max=&now=1&diet= */
export function FoodHub() {
  const { currentCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dist = params.get("dist") ?? "";
  const max = params.get("max") ?? "";
  const now = params.get("now") === "1";
  const diet = params.get("diet") ?? "";

  const help = useAsync(() => getResources({ campusId: currentCampus.id, need: "food", pageSize: 3 }), [currentCampus.id]);
  const query: FoodDealQuery = {
    campusId: currentCampus.id,
    pageSize: 50,
    ...(dist ? { maxDistanceMiles: Number(dist) } : {}),
    ...(max ? { maxPriceCents: Number(max) } : {}),
    ...(now ? { availableNow: true } : {}),
    ...(diet ? { dietaryTag: diet } : {}),
  };
  const deals = useAsync(() => getFoodDeals(query), [query]);
  const filtersOn = !!(dist || max || now || diet);

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const clear = () => router.replace(pathname, { scroll: false });

  return (
    <>
      <Link href="/discover" className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Discover
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Food & Basic Needs</h1>
      <p className="text-sm font-semibold text-brand">{currentCampus.name}</p>
      <p className="mb-4 text-ink-soft">Free food help first, plus discounted surplus food from places near campus.</p>

      <section aria-labelledby="free-heading">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="free-heading" className="font-bold">
            Free food help
          </h2>
          <Link href="/resources?need=food" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
            All food resources <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        {help.loading && <LoadingList count={1} label="Loading food help" />}
        {help.error != null && <ErrorState onRetry={help.reload} />}
        <div className="space-y-3" data-testid="food-help">
          {help.data?.items.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      </section>

      <section aria-labelledby="deals-heading" className="mt-8">
        <h2 id="deals-heading" className="font-bold">
          Surplus food deals near {currentCampus.shortName}
        </h2>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft" data-testid="food-demo-notice">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" /> {FOOD_COPY.demoNotice}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2" data-testid="food-filters">
          <label className="text-xs font-semibold text-ink-soft">
            Distance
            <select aria-label="Distance" value={dist} onChange={(e) => update({ dist: e.target.value })} className={selectCls}>
              {FOOD_DISTANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            Price
            <select aria-label="Price" value={max} onChange={(e) => update({ max: e.target.value })} className={selectCls}>
              {FOOD_PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div role="group" aria-label="More filters" className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          <Chip selected={now} onClick={() => update({ now: now ? undefined : "1" })}>
            Pickup open now
          </Chip>
          {DIETARY_TAGS.map((t) => (
            <Chip key={t.id} selected={diet === t.id} onClick={() => update({ diet: diet === t.id ? undefined : t.id })}>
              {t.label}
            </Chip>
          ))}
        </div>

        <div className="mt-3" aria-live="polite">
          {deals.loading && <LoadingList label="Loading deals" />}
          {deals.error != null && <ErrorState onRetry={deals.reload} />}
          {deals.data &&
            (deals.data.items.length === 0 ? (
              <EmptyState
                title={filtersOn ? "No deals match these filters" : `No deals near ${currentCampus.shortName} right now`}
                hint={filtersOn ? "Try a wider distance or remove a filter." : "Check the free food help above. New deals show up during the day."}
                action={
                  filtersOn ? (
                    <button onClick={clear} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3" data-testid="deal-list">
                {deals.data.items.map((d) => (
                  <FoodDealCard key={d.id} deal={d} campusShortName={currentCampus.shortName} />
                ))}
              </div>
            ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">{FOOD_COPY.noPayment}</p>
      </section>
    </>
  );
}
