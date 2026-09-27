"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Flag, FolderOpen, Users } from "lucide-react";
import { AccessBadge, AttachmentList, IntegrityNote, ReviewBadge, TypeBadge } from "@/components/academic/AcademicParts";
import { HelpfulButton } from "@/components/academic/HelpfulButton";
import { ResourceCard } from "@/components/academic/ResourceCard";
import { AuthorLine } from "@/components/community/AuthorLine";
import { DemoBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { RESOURCE_TYPE_LABELS } from "@/config/academic";
import { useAsync } from "@/hooks/useAsync";
import { formatCents } from "@/lib/format";
import { getAcademicCourse, getAcademicResource, getAcademicResources, openResource, toggleResourceHelpful } from "@/services/academic";
import { NotFoundError } from "@/services/mock";
import { reportContent } from "@/services/reports";
import { getCurrentUser } from "@/services/user";
import type { Attachment, ReportReason } from "@/types/models";

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "integrity", label: "Exam, quiz, or answer key material" },
  { id: "copyright", label: "Copied textbook or instructor material" },
  { id: "personal-attack", label: "Attacks an instructor or student" },
  { id: "inaccurate", label: "Wrong or misleading" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Something else" },
];

export default function ResourceDetailPage() {
  const { courseId, resourceId } = useParams<{ courseId: string; resourceId: string }>();
  const resource = useAsync(() => getAcademicResource(resourceId), [resourceId]);
  const course = useAsync(() => getAcademicCourse(courseId), [courseId]);
  const me = useAsync(() => getCurrentUser(), []);
  const campusId = resource.data?.campusId;
  const more = useAsync(
    () => (campusId ? getAcademicResources({ campusId, courseId, pageSize: 4 }) : Promise.resolve(null)),
    [campusId, courseId],
  );

  const [opened, setOpened] = useState<{ attachments: Attachment[]; accessCount: number } | null>(null);
  const [opening, setOpening] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  const r = resource.data;
  const isOwn = !!r && me.data?.id === r.authorId;
  const mismatch = r && r.courseId !== courseId;

  async function open() {
    if (!r) return;
    setOpening(true);
    try {
      setOpened(await openResource(r.id));
    } finally {
      setOpening(false);
    }
  }

  return (
    <>
      <Link href={`/academic/${courseId}`} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> {course.data?.code ?? "Course"}
      </Link>

      {resource.loading && <LoadingList count={2} label="Loading resource" />}
      {(resource.error instanceof NotFoundError || mismatch) && (
        <EmptyState
          title="Resource not found"
          hint="It may be under review, removed, or the link is wrong."
          action={
            <Link href={`/academic/${courseId}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
              Back to course
            </Link>
          }
        />
      )}
      {resource.error != null && !(resource.error instanceof NotFoundError) && <ErrorState onRetry={resource.reload} />}

      {r && !mismatch && (
        <>
          <article className="rounded-2xl border border-line bg-surface p-4" data-testid="resource-detail">
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeBadge type={r.resourceType} />
              <AccessBadge access={r.access} />
              {course.data && (
                <Link href={`/academic/${course.data.id}`} className="rounded-full border border-brand/40 px-2 py-0.5 text-xs font-semibold hover:bg-brand/5">
                  {course.data.code} · {course.data.title}
                </Link>
              )}
              {r.isDemo && <DemoBadge />}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight">{r.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              <ReviewBadge status={r.reviewStatus} />
              {r.context?.term && <span>Made for {r.context.term}</span>}
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden className="size-4" /> {opened?.accessCount ?? r.accessCount} students opened this
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 p-3" data-testid="resource-author">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Shared by</p>
              <AuthorLine author={r.author} createdAt={r.createdAt} />
            </div>

            <p className="mt-4 whitespace-pre-line text-[15px]">{r.description}</p>
            {r.body && (
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-bg p-3 font-mono text-sm" data-testid="resource-body">
                {r.body}
              </pre>
            )}

            {r.attachments.length > 0 && (
              <section className="mt-4" aria-labelledby="files-heading">
                <h2 id="files-heading" className="mb-2 font-bold">
                  Files
                </h2>
                <AttachmentList attachments={opened?.attachments ?? r.attachments} opened={!!opened || isOwn} />
              </section>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {r.access.model === "paid" && !r.viewerHasAccess ? (
                <p className="rounded-xl bg-warn/15 p-3 text-sm">
                  {formatCents(r.access.priceCents)} · Paid resources are a preview only. Payments are not enabled.
                </p>
              ) : (
                !opened &&
                !isOwn && (
                  <button
                    type="button"
                    onClick={open}
                    disabled={opening}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-on-brand disabled:opacity-60"
                    data-testid="open-resource"
                  >
                    <FolderOpen aria-hidden className="size-4" /> {opening ? "Opening…" : RESOURCE_TYPE_LABELS[r.resourceType].action}
                  </button>
                )
              )}
              {opened && (
                <p role="status" className="text-sm text-ink-soft" data-testid="opened-status">
                  Opened. Demo files can&apos;t be downloaded yet.
                </p>
              )}
              <HelpfulButton
                initialCount={r.helpfulCount}
                initialMarked={!!r.viewerMarkedHelpful}
                disabled={isOwn}
                onToggle={(marked) => toggleResourceHelpful(r.id, marked)}
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">&quot;Helpful&quot; rates this resource, not the student who shared it.</p>

            <div className="mt-4 border-t border-line pt-3">
              {reported ? (
                <p role="status" className="text-sm">Thanks. Reviewers will check this resource.</p>
              ) : reportOpen ? (
                <fieldset className="rounded-xl bg-muted p-3" data-testid="report-panel">
                  <legend className="float-left mb-2 w-full text-sm font-bold">What&apos;s wrong with this resource?</legend>
                  <div className="clear-both space-y-1">
                    {REPORT_REASONS.map((x) => (
                      <label key={x.id} className="flex min-h-10 items-center gap-2 text-sm">
                        <input type="radio" name="reason" value={x.id} checked={reason === x.id} onChange={() => setReason(x.id)} className="size-4 accent-brand" />
                        {x.label}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!reason}
                    onClick={async () => {
                      await reportContent({ targetType: "academic-resource", targetId: r.id, reason: reason! });
                      setReported(true);
                    }}
                    className="mt-2 min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50"
                  >
                    Send report
                  </button>
                </fieldset>
              ) : (
                !isOwn && (
                  <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-soft">
                    <Flag aria-hidden className="size-4" /> Report this resource
                  </button>
                )
              )}
            </div>
          </article>

          <div className="mt-4">
            <IntegrityNote expanded />
          </div>

          {more.data && more.data.items.filter((x) => x.id !== r.id).length > 0 && (
            <section className="mt-6" aria-labelledby="more-heading">
              <h2 id="more-heading" className="mb-2 font-bold">
                More for {course.data?.code}
              </h2>
              <div className="space-y-3">
                {more.data.items
                  .filter((x) => x.id !== r.id)
                  .slice(0, 3)
                  .map((x) => (
                    <ResourceCard key={x.id} resource={x} />
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
