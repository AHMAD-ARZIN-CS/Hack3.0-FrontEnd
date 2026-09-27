import Link from "next/link";
import { HandHelping, Paperclip, Users } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { DemoBadge } from "@/components/ui/Badge";
import type { AcademicResource } from "@/types/models";
import { AccessBadge, ReviewBadge, TypeBadge } from "./AcademicParts";

/** Resource from a previous student. Knowledge first: title, what it is, who made it, how helpful. */
export function ResourceCard({ resource: r, showCourseCode }: { resource: AcademicResource; showCourseCode?: string }) {
  const href = `/academic/${r.courseId}/${r.id}`;
  return (
    <article className="rounded-2xl border border-line bg-surface p-4" data-testid="resource-card" data-resource-id={r.id}>
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={r.resourceType} />
        <AccessBadge access={r.access} />
        {showCourseCode && <span className="rounded-full border border-brand/40 px-2 py-0.5 text-xs font-semibold">{showCourseCode}</span>}
        {r.isDemo && <DemoBadge />}
      </div>
      <h3 className="mt-2 text-[17px] font-bold leading-snug">
        <Link href={href} className="hover:underline" data-testid="resource-link">
          {r.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[15px] text-ink-soft">{r.description}</p>
      <div className="mt-3">
        <AuthorLine author={r.author} createdAt={r.createdAt} compact />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1 font-semibold text-ink" data-testid="card-helpful">
          <HandHelping aria-hidden className="size-4" /> {r.helpfulCount} helpful
        </span>
        <span className="inline-flex items-center gap-1">
          <Users aria-hidden className="size-4" /> {r.accessCount} opened
        </span>
        {r.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip aria-hidden className="size-4" /> {r.attachments.length} file{r.attachments.length === 1 ? "" : "s"}
          </span>
        )}
        {r.context?.term && <span>· {r.context.term}</span>}
        <span className="ml-auto">
          <ReviewBadge status={r.reviewStatus} />
        </span>
      </div>
    </article>
  );
}
