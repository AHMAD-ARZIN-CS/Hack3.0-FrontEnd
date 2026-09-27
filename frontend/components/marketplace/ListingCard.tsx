import Link from "next/link";
import { BookOpen, Lamp, Laptop, Package, PencilRuler, Shirt, ShieldAlert, type LucideIcon } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { ITEM_CONDITIONS, LISTING_CATEGORIES, MARKETPLACE_COPY } from "@/config/marketplace";
import { tagLabel } from "@/config/tags";
import { formatCents } from "@/lib/format";
import type { ListingCategory, MarketplaceListing } from "@/types/models";

const CATEGORY_ICONS: Record<ListingCategory, LucideIcon> = {
  textbook: BookOpen,
  supplies: PencilRuler,
  clothing: Shirt,
  electronics: Laptop,
  dorm: Lamp,
  other: Package,
};

/** Photo if the seller added one, otherwise a category icon. Never a stock photo. */
export function ListingThumb({ listing, size = "md" }: { listing: MarketplaceListing; size?: "md" | "lg" }) {
  const Icon = CATEGORY_ICONS[listing.category];
  const img = listing.images[0]?.previewUrl;
  const box = size === "lg" ? "size-24" : "size-16";
  if (img)
    // eslint-disable-next-line @next/next/no-img-element -- local blob previews and backend URLs, not optimizable
    return <img src={img} alt="" className={`${box} shrink-0 rounded-xl border border-line object-cover`} />;
  return (
    <span className={`${box} flex shrink-0 items-center justify-center rounded-xl bg-muted text-ink-soft`} aria-hidden>
      <Icon className={size === "lg" ? "size-9" : "size-7"} />
    </span>
  );
}

/** List row, not a product grid (D31). What, how much, what shape, who. */
export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const l = listing;
  return (
    <article className="rounded-2xl border border-line bg-surface p-3" data-testid="listing-card" data-listing-id={l.id}>
      <div className="flex gap-3">
        <ListingThumb listing={l} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-bold leading-snug">
              <Link href={`/marketplace/${l.id}`} className="hover:underline" data-testid="listing-link">
                {l.title}
              </Link>
            </h3>
            <p className="shrink-0 text-lg font-extrabold" data-testid="listing-price">
              {formatCents(l.priceCents)}
            </p>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {[tagLabel(ITEM_CONDITIONS, l.condition), tagLabel(LISTING_CATEGORIES, l.category), l.courseCode].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {l.status === "pending" && <Badge tone="warn">Pending pickup</Badge>}
            {l.status === "sold" && <Badge tone="danger">Sold</Badge>}
            {l.moderationStatus === "under-review" && <Badge tone="warn">Under review</Badge>}
            {l.isDemo && <DemoBadge />}
          </div>
        </div>
      </div>
      <div className="mt-2.5 border-t border-line pt-2.5">
        <AuthorLine author={l.seller} createdAt={l.createdAt} compact />
      </div>
    </article>
  );
}

export function MarketplaceSafetyNotice({ full = false }: { full?: boolean }) {
  return (
    <aside className="rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm" data-testid="marketplace-safety">
      <p className="flex items-start gap-2 font-semibold">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        {full ? "Stay safe" : MARKETPLACE_COPY.safetyShort}
      </p>
      {full && (
        <>
          <p className="mt-1.5">{MARKETPLACE_COPY.verification}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {MARKETPLACE_COPY.safetyTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link href="/safety" className="mt-2 inline-flex min-h-10 items-center font-semibold text-brand underline">
            Campus safety resources
          </Link>
        </>
      )}
    </aside>
  );
}
