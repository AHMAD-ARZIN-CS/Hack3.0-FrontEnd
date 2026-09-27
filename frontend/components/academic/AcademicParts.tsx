/**
 * Small presentational pieces for Academic Exchange. No data fetching.
 */
import Link from "next/link";
import { BadgeCheck, BookOpen, ChevronRight, Clock, FileText, Image as ImageIcon, Lightbulb, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { INTEGRITY_RULES, RESOURCE_TYPE_LABELS, REVIEW_STATUS_LABELS } from "@/config/academic";
import { formatCents } from "@/lib/format";
import type { AccessModel, AcademicResourceType, Attachment, Course, ReviewStatus } from "@/types/models";

export function AccessBadge({ access }: { access: AccessModel }) {
  return access.model === "free" ? (
    <Badge tone="success">Free</Badge>
  ) : (
    <Badge tone="warn">{formatCents(access.priceCents)} · price preview</Badge>
  );
}

export function TypeBadge({ type }: { type: AcademicResourceType }) {
  return (
    <Badge tone="brand">
      <FileText aria-hidden className="size-3.5" />
      {RESOURCE_TYPE_LABELS[type].one}
    </Badge>
  );
}

/** "Reviewed & approved" for public items. Other states are only ever seen by the author. */
export function ReviewBadge({ status }: { status: ReviewStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success" data-testid="review-badge">
        <BadgeCheck aria-hidden className="size-3.5" /> {REVIEW_STATUS_LABELS.approved}
      </span>
    );
  }
  return (
    <Badge tone="warn">
      <Clock aria-hidden className="size-3.5" /> {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const total = (course.resourceCount ?? 0) + (course.tipCount ?? 0);
  return (
    <Link
      href={`/academic/${course.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand"
      data-testid="course-card"
      data-course-id={course.id}
    >
      <span className="flex min-w-0 gap-3">
        <BookOpen aria-hidden className="mt-0.5 size-6 shrink-0 text-brand" />
        <span className="min-w-0">
          <span className="block text-lg font-extrabold leading-tight">{course.code}</span>
          <span className="block text-[15px]">{course.title}</span>
          <span className="mt-1 block text-sm text-ink-soft">
            {total === 0
              ? "No resources yet. Be the first to share."
              : `${course.resourceCount ?? 0} resource${course.resourceCount === 1 ? "" : "s"} · ${course.tipCount ?? 0} tip${course.tipCount === 1 ? "" : "s"}`}
          </span>
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-soft" />
    </Link>
  );
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.includes("wordprocessingml")) return "Word doc";
  if (mime === "text/markdown") return "Markdown";
  if (mime.startsWith("text/")) return "Text";
  return "File";
}

/** File list. Real download only when the backend returns a signed downloadUrl. */
export function AttachmentList({ attachments, opened }: { attachments: Attachment[]; opened: boolean }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="space-y-2" data-testid="attachment-list">
      {attachments.map((a) => {
        const Icon = a.fileType.startsWith("image/") ? ImageIcon : FileText;
        return (
          <li key={a.attachmentId} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted" aria-hidden>
              <Icon className="size-6 text-ink-soft" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{a.fileName}</span>
              <span className="block text-xs text-ink-soft">
                {fileLabel(a.fileType)} · {formatBytes(a.fileSize)}
              </span>
            </span>
            {opened &&
              (a.downloadUrl ? (
                <a href={a.downloadUrl} className="min-h-10 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-on-brand">
                  Download
                </a>
              ) : (
                <span className="text-xs font-semibold text-ink-soft" data-testid="demo-file-label">
                  Demo file
                </span>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

export function IntegrityNote({ expanded = false }: { expanded?: boolean }) {
  return (
    <aside className="rounded-xl border border-line bg-muted/60 p-3 text-sm" data-testid="integrity-note">
      <p className="flex items-start gap-2 font-semibold">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
        {expanded ? "Academic integrity" : INTEGRITY_RULES.short}
      </p>
      {expanded && (
        <ul className="mt-1.5 list-disc space-y-1 pl-6 text-ink-soft">
          {INTEGRITY_RULES.long.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function TipIcon() {
  return <Lightbulb aria-hidden className="mt-0.5 size-5 shrink-0 text-warn" />;
}
