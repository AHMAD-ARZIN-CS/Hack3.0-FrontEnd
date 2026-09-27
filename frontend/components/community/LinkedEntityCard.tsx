import Link from "next/link";
import { ArrowRight, BookOpenCheck, Briefcase, ExternalLink, House, LifeBuoy, UserRound, Users } from "lucide-react";
import type { LinkedEntityPreview, LinkedEntityType } from "@/types/models";

const ICONS: Record<LinkedEntityType, typeof ArrowRight> = {
  "academic-resource": BookOpenCheck,
  resource: LifeBuoy,
  opportunity: Briefcase,
  "study-group": Users,
  "housing-post": House,
  profile: UserRound,
};

/** A post's link to something elsewhere in the app. Renders a clear action when the page exists. */
export function LinkedEntityCard({ preview }: { preview: LinkedEntityPreview }) {
  const Icon = ICONS[preview.type];
  const inner = (
    <>
      <span className="flex min-w-0 gap-2.5">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{preview.title}</span>
          {preview.subtitle && <span className="block text-xs text-ink-soft">{preview.subtitle}</span>}
          {preview.description && <span className="mt-1 block text-sm text-ink-soft">{preview.description}</span>}
          <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            {preview.available ? (preview.href ? preview.actionLabel : `${preview.actionLabel} (page coming soon)`) : "No longer available"}
            {preview.href && (preview.external ? <ExternalLink aria-hidden className="size-3.5" /> : <ArrowRight aria-hidden className="size-3.5" />)}
          </span>
        </span>
      </span>
    </>
  );
  const cls = "mt-3 block rounded-xl border border-brand/25 bg-brand/5 p-3";

  if (!preview.available || !preview.href) {
    return (
      <div className={`${cls} ${preview.available ? "" : "opacity-60"}`} data-testid="linked-entity" data-linked-type={preview.type}>
        {inner}
      </div>
    );
  }
  if (preview.external) {
    return (
      <a href={preview.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-brand/10`} data-testid="linked-entity" data-linked-type={preview.type}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={preview.href} className={`${cls} hover:bg-brand/10`} data-testid="linked-entity" data-linked-type={preview.type}>
      {inner}
    </Link>
  );
}
