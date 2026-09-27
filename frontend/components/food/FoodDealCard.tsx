import Link from "next/link";
import { Clock, MapPin, Store } from "lucide-react";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { DIETARY_TAGS } from "@/config/food";
import { tagLabel } from "@/config/tags";
import { formatCents, formatPickupWindow, percentOff } from "@/lib/format";
import type { FoodDeal } from "@/types/models";

/** Surplus-food deal. Shows the student price vs original, pickup window, area, and what's left. */
export function FoodDealCard({ deal, campusShortName }: { deal: FoodDeal; campusShortName?: string }) {
  const soldOut = deal.status === "sold-out";
  const now = new Date().toISOString();
  const liveNow = deal.status === "available" && deal.pickupStart <= now && deal.pickupEnd > now;

  return (
    <article
      className={`rounded-2xl border border-line bg-surface p-4 ${soldOut ? "opacity-60" : ""}`}
      data-testid="deal-card"
      data-deal-id={deal.id}
      data-status={deal.status}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Store aria-hidden className="size-4 shrink-0" /> {deal.restaurantName}
          </p>
          <h3 className="mt-1 text-[17px] font-bold leading-snug">
            <Link href={`/food/${deal.id}`} className="hover:underline" data-testid="deal-link">
              {deal.title}
            </Link>
          </h3>
        </div>
        <p className="shrink-0 text-right leading-tight" data-testid="deal-price">
          <span className="block text-xl font-extrabold text-brand">{formatCents(deal.studentPriceCents)}</span>
          <span className="text-sm text-ink-soft line-through">{formatCents(deal.originalPriceCents)}</span>
          <span className="block text-xs font-semibold text-success">Save {percentOff(deal.originalPriceCents, deal.studentPriceCents)}%</span>
        </p>
      </div>

      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        <li className="flex items-center gap-1.5" data-testid="deal-window">
          <Clock aria-hidden className="size-4 shrink-0" />
          {formatPickupWindow(deal.pickupStart, deal.pickupEnd)}
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {deal.pickupAreaName}
          {deal.distanceMiles !== undefined && ` · ~${deal.distanceMiles} mi from ${campusShortName ?? "campus"}`}
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {soldOut ? (
          <Badge tone="danger">Sold out</Badge>
        ) : (
          <>
            {liveNow && <Badge tone="success">Pickup open now</Badge>}
            <Badge tone="brand">{deal.quantityAvailable} left</Badge>
          </>
        )}
        {deal.viewerClaim && <Badge tone="warn">You have a hold</Badge>}
        {(deal.dietaryTags ?? []).map((t) => (
          <Badge key={t}>{tagLabel(DIETARY_TAGS, t)}</Badge>
        ))}
        {deal.isDemo && <DemoBadge />}
      </div>
    </article>
  );
}
