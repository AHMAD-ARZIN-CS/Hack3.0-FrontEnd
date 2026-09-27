"use client";

import { AuthorLine } from "@/components/community/AuthorLine";
import { DemoBadge } from "@/components/ui/Badge";
import { TIP_CATEGORY_LABELS } from "@/config/academic";
import { toggleTipHelpful } from "@/services/academic";
import type { AcademicTip } from "@/types/models";
import { TipIcon } from "./AcademicParts";
import { HelpfulButton } from "./HelpfulButton";

/** Short advice about succeeding in the course. Never about rating the instructor. */
export function TipCard({ tip, viewerId }: { tip: AcademicTip; viewerId?: string }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4" data-testid="tip-card" data-tip-id={tip.id}>
      <div className="flex gap-2.5">
        <TipIcon />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {TIP_CATEGORY_LABELS[tip.category]}
            {tip.context?.term ? ` · ${tip.context.term}` : ""}
          </p>
          <p className="mt-1 text-[15px]">{tip.body}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <AuthorLine author={tip.author} createdAt={tip.createdAt} compact />
            <HelpfulButton
              size="sm"
              initialCount={tip.helpfulCount}
              initialMarked={!!tip.viewerMarkedHelpful}
              disabled={viewerId === tip.authorId}
              onToggle={(marked) => toggleTipHelpful(tip.id, marked)}
            />
          </div>
          {tip.isDemo && (
            <div className="mt-2">
              <DemoBadge />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
