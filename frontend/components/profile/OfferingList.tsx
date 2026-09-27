"use client";

/**
 * Needs / offerings on a profile (D22, D24).
 * Public view: receives only public offerings, shows a general label + link to the feature page.
 * Own view: shows every offering with a visibility switch. Hidden is the default.
 */
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OFFERING_CATEGORIES, tagLabel } from "@/config/tags";
import type { ProfileOffering, Visibility } from "@/types/models";

function detailHref(link: NonNullable<ProfileOffering["link"]>): string {
  if (link.type === "housing-post") return `/housing/${link.id}`;
  if (link.type === "marketplace-listing") return `/marketplace/${link.id}`;
  if (link.type === "academic-resource") return "/academic";
  return "/community";
}

export function OfferingList({
  offerings,
  isOwner,
  onToggle,
  pendingId,
}: {
  offerings: ProfileOffering[];
  isOwner: boolean;
  onToggle?: (id: string, next: Visibility) => void;
  pendingId?: string | null;
}) {
  return (
    <ul className="space-y-2" data-testid="profile-offerings">
      {offerings.map((o) => {
        const isPublic = o.visibility === "public";
        return (
          <li key={o.id} className="rounded-xl border border-line bg-surface p-3" data-offering={o.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={o.direction === "offering" ? "success" : "brand"}>
                    {o.direction === "offering" ? "Offering" : "Looking for"}
                  </Badge>
                  <Badge>{tagLabel(OFFERING_CATEGORIES, o.category)}</Badge>
                </div>
                <p className="mt-1 font-semibold">{o.label}</p>
                {o.link && (
                  <Link href={detailHref(o.link)} className="text-sm font-semibold text-brand underline">
                    Details in {o.link.type === "housing-post" ? "Housing" : o.link.type === "marketplace-listing" ? "Marketplace" : "the app"}
                  </Link>
                )}
              </div>
              {isOwner && onToggle && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  aria-label={`Show "${o.label}" on public profile`}
                  disabled={pendingId === o.id}
                  onClick={() => onToggle(o.id, isPublic ? "hidden" : "public")}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60 ${
                    isPublic ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink"
                  }`}
                >
                  {isPublic ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
                  {isPublic ? "Public" : "Hidden"}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
