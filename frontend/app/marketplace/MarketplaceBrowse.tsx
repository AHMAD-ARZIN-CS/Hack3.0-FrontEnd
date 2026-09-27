"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { ListingCard, MarketplaceSafetyNotice } from "@/components/marketplace/ListingCard";
import { Chip } from "@/components/ui/Chip";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { ITEM_CONDITIONS, LISTING_CATEGORIES, LISTING_PRICE_OPTIONS, MARKETPLACE_COPY } from "@/config/marketplace";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getListings } from "@/services/marketplace";
import { getCurrentUser } from "@/services/user";
import type { ItemCondition, ListingCategory, ListingQuery } from "@/types/models";

const selectCls =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand";

/** Discover → Marketplace. Filters live in the URL: ?q=&cat=&cond=&max=&verified=1&mine=1 */
export function MarketplaceBrowse() {
  const { currentCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const me = useAsync(() => getCurrentUser(), []);

  const q = params.get("q") ?? "";
  const catParam = params.get("cat");
  const cat = LISTING_CATEGORIES.some((c) => c.id === catParam) ? (catParam as ListingCategory) : undefined;
  const condParam = params.get("cond");
  const cond = ITEM_CONDITIONS.some((c) => c.id === condParam) ? (condParam as ItemCondition) : undefined;
  const max = params.get("max") ?? "";
  const verified = params.get("verified") === "1";
  const mine = params.get("mine") === "1";

  const query: ListingQuery = mine
    ? { campusId: currentCampus.id, sellerId: me.data?.id ?? "__pending__", pageSize: 50 }
    : {
        campusId: currentCampus.id,
        pageSize: 50,
        ...(q ? { q } : {}),
        ...(cat ? { category: cat } : {}),
        ...(cond ? { condition: cond } : {}),
        ...(max !== "" ? { maxPriceCents: Number(max) } : {}),
        ...(verified ? { verifiedOnly: true } : {}),
      };
  const results = useAsync(() => (mine && !me.data ? new Promise<never>(() => {}) : getListings(query)), [query]);
  const filtersOn = !!(q || cat || cond || max !== "" || verified);

  function update(changes: Record<string, string | undefined>) {
    // Read the live URL, not the render-time params, so two quick changes don't overwrite each other.
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }
  const clearFilters = () => router.replace(pathname, { scroll: false });

  return (
    <>
      <Link href="/discover" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Discover
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
          <p className="text-sm text-ink-soft">Textbooks, supplies, and other items from students near {currentCampus.shortName}.</p>
        </div>
        <Link
          href="/marketplace/new"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-on-brand"
          data-testid="sell-link"
        >
          <Plus aria-hidden className="size-4" /> List item
        </Link>
      </div>

      <div role="tablist" aria-label="Which listings" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            [false, "Browse"],
            [true, "Your listings"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={label}
            role="tab"
            aria-selected={mine === m}
            onClick={() => (m ? router.replace(`${pathname}?mine=1`, { scroll: false }) : clearFilters())}
            className={`min-h-11 rounded-lg text-sm font-semibold ${mine === m ? "bg-surface shadow-sm" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!mine && (
        <>
          <div className="mt-3">
            <SearchBar
              key={q}
              initialValue={q}
              label="Search marketplace"
              placeholder="Calculator, MTH 1 textbook, hoodie…"
              onSearch={(v) => update({ q: v || undefined })}
            />
          </div>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" aria-label="Category" role="group">
            <Chip selected={!cat} onClick={() => update({ cat: undefined })}>
              All
            </Chip>
            {LISTING_CATEGORIES.map((c) => (
              <Chip key={c.id} selected={cat === c.id} onClick={() => update({ cat: cat === c.id ? undefined : c.id })}>
                {c.label}
              </Chip>
            ))}
          </div>
          <fieldset className="mt-2 grid grid-cols-2 gap-2" data-testid="marketplace-filters">
            <legend className="sr-only">Filters</legend>
            <label className="text-xs font-semibold text-ink-soft">
              Price
              <select aria-label="Price" value={max} onChange={(e) => update({ max: e.target.value || undefined })} className={selectCls}>
                {LISTING_PRICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Condition
              <select aria-label="Condition" value={cond ?? ""} onChange={(e) => update({ cond: e.target.value || undefined })} className={selectCls}>
                <option value="">Any condition</option>
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
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
            <MarketplaceSafetyNotice />
          </div>
        </>
      )}

      <div className="mt-4" aria-live="polite">
        {results.loading && <LoadingList label="Loading listings" />}
        {results.error != null && <ErrorState onRetry={results.reload} />}
        {results.data && (
          <>
            <p className="mb-2 text-sm text-ink-soft" data-testid="listing-count">
              {results.data.total} {results.data.total === 1 ? "item" : "items"}
              {mine ? "" : ` near ${currentCampus.shortName}`}
            </p>
            {results.data.items.length === 0 ? (
              <EmptyState
                title={mine ? "You haven't listed anything yet" : filtersOn ? "No items match" : `No items near ${currentCampus.shortName} yet`}
                hint={mine ? "List a textbook or supplies you don't need." : filtersOn ? "Try another word or clear the filters." : "Be the first to list something."}
                action={
                  filtersOn && !mine ? (
                    <button onClick={clearFilters} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                      Clear filters
                    </button>
                  ) : (
                    <Link href="/marketplace/new" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
                      List an item
                    </Link>
                  )
                }
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2" data-testid="listing-list">
                {results.data.items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        Looking for notes or study guides? They&apos;re free in{" "}
        <Link href="/academic" className="font-semibold text-brand underline">Academic</Link>. Rooms are in{" "}
        <Link href="/housing" className="font-semibold text-brand underline">Housing</Link>.
      </p>
      <p className="mt-2 text-xs text-ink-soft" data-testid="marketplace-demo-notice">
        {MARKETPLACE_COPY.demoNotice} {MARKETPLACE_COPY.noPayment}
      </p>
    </>
  );
}
