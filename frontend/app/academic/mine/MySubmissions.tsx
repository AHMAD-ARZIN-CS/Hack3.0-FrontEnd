"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, PenLine, ShieldCheck } from "lucide-react";
import { ReviewBadge } from "@/components/academic/AcademicParts";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { SHOW_DEMO_DATA_CONTROLS } from "@/config/app";
import { MODERATOR_ROLE_LABEL, REJECT_REASONS, RESOURCE_TYPE_LABELS, REVIEW_STATUS_LABELS } from "@/config/academic";
import { useAsync } from "@/hooks/useAsync";
import { AcademicValidationError, getMyAcademicResources, getReviewHistory, moderateResourceDemo } from "@/services/academic";
import type { AcademicResource, ReviewReasonCode } from "@/types/models";

const WAITING = new Set(["submitted", "under-review"]);

function History({ id, version }: { id: string; version: number }) {
  const h = useAsync(() => getReviewHistory(id), [id, version]);
  if (!h.data || h.data.length === 0) return null;
  return (
    <ol className="mt-2 space-y-0.5 text-xs text-ink-soft" data-testid="review-history">
      {h.data.map((e) => (
        <li key={e.id}>
          {new Date(e.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ·{" "}
          {REVIEW_STATUS_LABELS[e.toStatus]} {e.actor === "reviewer" ? `(${MODERATOR_ROLE_LABEL})` : e.actor === "author" ? "(you)" : ""}
        </li>
      ))}
    </ol>
  );
}

/** Demo stand-in for a moderator. Only exists in mock mode and says so. */
function DemoModerator({ r, onDone }: { r: AcademicResource; onDone: (next: AcademicResource) => void }) {
  const [reason, setReason] = useState<ReviewReasonCode | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      onDone(await moderateResourceDemo(r.id, decision, reason || undefined));
    } catch (e) {
      setError(e instanceof AcademicValidationError ? e.message : "Couldn't update.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 rounded-xl border border-warn bg-warn/10 p-3" data-testid="demo-moderator">
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <ShieldCheck aria-hidden className="size-4" /> Demo: act as {MODERATOR_ROLE_LABEL}
      </p>
      <p className="text-xs text-ink-soft">Prototype only. In the real app a separate moderator account reviews this, never the author.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => act("approve")} className="min-h-10 rounded-lg bg-brand px-3 text-sm font-semibold text-on-brand disabled:opacity-60" data-testid="demo-approve">
          Approve and publish
        </button>
        <select aria-label="Reject reason" value={reason} onChange={(e) => setReason(e.target.value as ReviewReasonCode | "")} className="min-h-10 rounded-lg border border-line bg-surface px-2 text-sm">
          <option value="">Reject reason…</option>
          {REJECT_REASONS.map((x) => (
            <option key={x.code} value={x.code}>{x.label}</option>
          ))}
        </select>
        <button type="button" disabled={busy} onClick={() => act("reject")} className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm font-semibold disabled:opacity-60" data-testid="demo-reject">
          Reject
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function MySubmissions() {
  const justSubmitted = useSearchParams().get("submitted");
  const mine = useAsync(() => getMyAcademicResources(), []);
  const [overrides, setOverrides] = useState<Record<string, AcademicResource>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});

  return (
    <>
      <Link href="/academic" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Academic
      </Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">My submissions</h1>
        <Link href="/academic/new" className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-on-brand">
          <PenLine aria-hidden className="size-4" /> Share
        </Link>
      </div>

      {justSubmitted && (
        <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm" data-testid="submitted-banner">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          Submitted. It&apos;s pending review by a {MODERATOR_ROLE_LABEL}. Other students will see it after it&apos;s approved.
        </p>
      )}

      <div className="mt-4">
        {mine.loading && <LoadingList count={3} label="Loading your submissions" />}
        {mine.error != null && <ErrorState onRetry={mine.reload} />}
        {mine.data && mine.data.length === 0 && (
          <EmptyState title="Nothing shared yet" hint="Notes, study guides, and practice you made yourself help the next student." />
        )}
        {mine.data && mine.data.length > 0 && (
          <ul className="space-y-3" data-testid="my-submissions">
            {mine.data.map((orig) => {
              const r = overrides[orig.id] ?? orig;
              return (
                <li key={r.id} className="rounded-2xl border border-line bg-surface p-4" data-submission={r.id} data-status={r.reviewStatus}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ReviewBadge status={r.reviewStatus} />
                    <span className="text-xs text-ink-soft">{RESOURCE_TYPE_LABELS[r.resourceType].one}</span>
                  </div>
                  <p className="mt-1 font-bold">
                    {r.reviewStatus === "approved" ? (
                      <Link href={`/academic/${r.courseId}/${r.id}`} className="hover:underline" data-testid="published-link">
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </p>
                  {r.reviewStatus === "rejected" && r.reviewReason && (
                    <p className="mt-1 text-sm text-danger" data-testid="reject-reason">
                      Needs changes: {REJECT_REASONS.find((x) => x.code === r.reviewReason!.code)?.label ?? r.reviewReason.code}
                    </p>
                  )}
                  {WAITING.has(r.reviewStatus) && <p className="mt-1 text-sm text-ink-soft">Only you can see this until it&apos;s approved.</p>}
                  <History id={r.id} version={versions[r.id] ?? 0} />
                  {SHOW_DEMO_DATA_CONTROLS && WAITING.has(r.reviewStatus) && (
                    <DemoModerator
                      r={r}
                      onDone={(next) => {
                        setOverrides((o) => ({ ...o, [next.id]: next }));
                        setVersions((v) => ({ ...v, [next.id]: (v[next.id] ?? 0) + 1 }));
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
