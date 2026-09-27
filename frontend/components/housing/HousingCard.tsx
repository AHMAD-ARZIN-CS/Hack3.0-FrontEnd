import Link from "next/link";
import { BedDouble, CalendarDays, MapPin } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { HOUSING_AMENITIES } from "@/config/housing";
import { tagLabel } from "@/config/tags";
import { toDateKey, startOfToday } from "@/lib/dates";
import { formatAvailability, formatCents } from "@/lib/format";
import type { HousingPost } from "@/types/models";

/** Person-first housing card: who, roughly where, when, how much. No address, no photo grid. */
export function HousingCard({ post, campusShortName }: { post: HousingPost; campusShortName?: string }) {
  const isRoom = post.type === "room-available";
  const price = isRoom ? post.monthlyRentCents : post.budgetMaxCents;
  const amenities = post.amenities.slice(0, 3);

  return (
    <article className="rounded-2xl border border-line bg-surface p-4" data-testid="housing-card" data-post-id={post.id}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={isRoom ? "success" : "brand"}>{isRoom ? "Room available" : "Looking for a room"}</Badge>
        {post.roomType && <Badge>{post.roomType === "private" ? "Private room" : "Shared room"}</Badge>}
        {post.isDemo && <DemoBadge />}
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold leading-snug">
          <Link href={`/housing/${post.id}`} className="hover:underline" data-testid="housing-link">
            {post.title}
          </Link>
        </h3>
        {price !== undefined && (
          <p className="shrink-0 text-right leading-tight" data-testid="housing-price">
            <span className="block text-lg font-extrabold">{isRoom ? formatCents(price) : `≤ ${formatCents(price)}`}</span>
            <span className="text-xs text-ink-soft">{isRoom ? "per month" : "budget / mo"}</span>
          </p>
        )}
      </div>

      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        <li className="flex items-center gap-1.5" data-testid="housing-area">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {post.areaName}
          {post.distanceMiles !== undefined && ` · ~${post.distanceMiles} mi from ${campusShortName ?? "campus"}`}
        </li>
        <li className="flex items-center gap-1.5">
          <CalendarDays aria-hidden className="size-4 shrink-0" />
          {formatAvailability(post.availableFrom, toDateKey(startOfToday()))}
          {post.leaseLengthMonths ? ` · ${post.leaseLengthMonths}-month lease` : ""}
        </li>
        {amenities.length > 0 && (
          <li className="flex flex-wrap items-center gap-1.5">
            <BedDouble aria-hidden className="size-4 shrink-0" />
            {amenities.map((a) => tagLabel(HOUSING_AMENITIES, a)).join(" · ")}
          </li>
        )}
      </ul>

      <div className="mt-3 border-t border-line pt-3">
        <AuthorLine author={post.author} createdAt={post.createdAt} compact />
      </div>
    </article>
  );
}
