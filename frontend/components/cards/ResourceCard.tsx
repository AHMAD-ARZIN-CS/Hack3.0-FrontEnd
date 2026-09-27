import { Clock, ExternalLink, MapPin, Phone } from "lucide-react";
import { Badge, DemoBadge, VerifiedBadge } from "@/components/ui/Badge";
import { RESOURCE_CATEGORY_LABELS } from "@/config/labels";
import type { Resource } from "@/types/models";

export function ResourceCard({ resource: r }: { resource: Resource }) {
  const isPhone = r.url.startsWith("tel:");
  return (
    <article
      className={`rounded-2xl border bg-surface p-4 ${r.isEmergency ? "border-danger/40 bg-danger/5" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={r.isEmergency ? "danger" : "brand"}>{RESOURCE_CATEGORY_LABELS[r.category]}</Badge>
        <Badge>{r.onCampus ? "On campus" : "Off campus"}</Badge>
        {r.verified && <VerifiedBadge label="Info checked" />}
        {r.isDemo && <DemoBadge />}
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug">{r.title}</h3>
      <p className="text-sm text-ink-soft">{r.provider}</p>
      <p className="mt-2 text-[15px]">{r.description}</p>

      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        {r.locationName && (
          <li className="flex items-center gap-1.5">
            <MapPin aria-hidden className="size-4" /> {r.locationName}
          </li>
        )}
        {r.hours && (
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden className="size-4" /> {r.hours}
          </li>
        )}
        {r.phone && (
          <li className="flex items-center gap-1.5">
            <Phone aria-hidden className="size-4" /> {r.phone}
          </li>
        )}
      </ul>
      {r.verified && r.lastVerifiedAt && (
        <p className="mt-2 text-xs text-ink-soft" data-testid="resource-checked">
          Checked on the official page{" "}
          {new Date(r.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Details can change.
        </p>
      )}

      {r.url && (
        <a
          href={r.url}
          target={isPhone ? undefined : "_blank"}
          rel={isPhone ? undefined : "noopener noreferrer"}
          className={`mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold ${
            r.isEmergency ? "bg-danger text-white" : "bg-brand text-on-brand"
          }`}
        >
          {isPhone ? (
            <>
              <Phone aria-hidden className="size-4" /> Call {r.url.replace("tel:", "")}
            </>
          ) : (
            <>
              Open official site <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">(opens in new tab)</span>
            </>
          )}
        </a>
      )}
    </article>
  );
}
