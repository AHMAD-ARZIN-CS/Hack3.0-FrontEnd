"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flag, MapPin, Minus, Plus, Store } from "lucide-react";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { SUPPORTED_CAMPUSES } from "@/config/app";
import { DIETARY_TAGS, FOOD_COPY, FOOD_HOLD_MINUTES, FOOD_MAX_PER_CLAIM } from "@/config/food";
import { tagLabel } from "@/config/tags";
import { useAsync } from "@/hooks/useAsync";
import { formatCents, formatPickupWindow, percentOff } from "@/lib/format";
import { cancelFoodClaim, claimFoodDeal, FoodError, getFoodDeal } from "@/services/food";
import { NotFoundError } from "@/services/mock";
import { reportContent } from "@/services/reports";
import type { FoodDealClaim, ReportReason } from "@/types/models";

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "inaccurate", label: "Wrong price, time, or food" },
  { id: "scam", label: "Asked me to pay in advance" },
  { id: "other", label: "Something else" },
];

export default function FoodDealPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const deal = useAsync(() => getFoodDeal(dealId), [dealId]);
  const [qty, setQty] = useState(1);
  const [claim, setClaim] = useState<FoodDealClaim | null | undefined>(undefined);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  if (deal.loading) return <LoadingList count={2} label="Loading deal" />;
  if (deal.error instanceof NotFoundError)
    return (
      <EmptyState
        title="Deal not found"
        action={
          <Link href="/food" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
            Back to Food
          </Link>
        }
      />
    );
  if (deal.error != null || !deal.data) return <ErrorState onRetry={deal.reload} />;

  const d = deal.data;
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === d.campusId);
  const hold = claim === undefined ? d.viewerClaim : claim ?? undefined;
  const remaining = left ?? d.quantityAvailable;
  const canHold = d.status === "available" && remaining > 0 && !hold;

  async function doClaim() {
    setBusy(true);
    setError(null);
    try {
      const c = await claimFoodDeal(d.id, qty);
      setClaim(c);
      setLeft(remaining - c.quantity);
    } catch (e) {
      setError(e instanceof FoodError ? e.message : "Couldn't hold this. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function doCancel() {
    if (!hold) return;
    setBusy(true);
    await cancelFoodClaim(hold.id);
    setLeft(remaining + hold.quantity);
    setClaim(null);
    setBusy(false);
  }

  return (
    <>
      <Link href="/food" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Food
      </Link>

      <article className="rounded-2xl border border-line bg-surface p-4" data-testid="deal-detail">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <Store aria-hidden className="size-4" /> {d.restaurantName}
          {d.cuisine && <span className="font-normal">· {d.cuisine}</span>}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{d.title}</h1>

        <div className="mt-3 flex items-end gap-3" data-testid="price-compare">
          <p className="text-3xl font-extrabold text-brand">{formatCents(d.studentPriceCents)}</p>
          <p className="pb-1 text-ink-soft">
            <span className="line-through">{formatCents(d.originalPriceCents)}</span> usual price
          </p>
          <Badge tone="success">Save {percentOff(d.originalPriceCents, d.studentPriceCents)}%</Badge>
        </div>

        <ul className="mt-3 space-y-1.5 text-[15px]">
          <li className="flex items-center gap-2" data-testid="pickup-window">
            <Clock aria-hidden className="size-4 shrink-0 text-ink-soft" /> Pickup {formatPickupWindow(d.pickupStart, d.pickupEnd)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 shrink-0 text-ink-soft" /> {d.pickupAreaName}
            {d.distanceMiles !== undefined && ` · ~${d.distanceMiles} mi from ${campus?.shortName}`}
          </li>
        </ul>
        {d.description && <p className="mt-3 text-[15px]">{d.description}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {d.status === "sold-out" ? <Badge tone="danger">Sold out</Badge> : <Badge tone="brand" >{remaining} left</Badge>}
          {(d.dietaryTags ?? []).map((t) => (
            <Badge key={t}>{tagLabel(DIETARY_TAGS, t)}</Badge>
          ))}
          {d.isDemo && <DemoBadge />}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-soft">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" /> {FOOD_COPY.allergy}
        </p>
      </article>

      <section className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4" data-testid="hold-panel">
        {hold ? (
          <div role="status" data-testid="hold-confirmation">
            <p className="flex items-center gap-2 text-lg font-extrabold text-success">
              <CheckCircle2 aria-hidden className="size-5" /> Held for you
            </p>
            <p className="mt-1">
              {hold.quantity} × {d.title}. Hold ends{" "}
              <span className="font-semibold">
                {new Date(hold.holdExpiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              .
            </p>
            <p className="mt-2 rounded-xl bg-surface p-3 text-center">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">Show this at pickup</span>
              <span className="block text-2xl font-extrabold tracking-widest" data-testid="pickup-code">{hold.pickupCode}</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">{FOOD_COPY.noPayment}</p>
            <button onClick={doCancel} disabled={busy} className="mt-3 min-h-11 rounded-xl border border-line bg-surface px-4 text-sm font-semibold">
              Cancel hold
            </button>
          </div>
        ) : canHold ? (
          <>
            <p className="font-bold">Want this?</p>
            <p className="text-sm text-ink-soft">We&apos;ll hold it for {FOOD_HOLD_MINUTES} minutes. You pay the restaurant at pickup.</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-semibold">Quantity</span>
              <button aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface">
                <Minus aria-hidden className="size-4" />
              </button>
              <span className="w-6 text-center text-lg font-bold" data-testid="qty">{qty}</span>
              <button
                aria-label="More"
                onClick={() => setQty((q) => Math.min(FOOD_MAX_PER_CLAIM, remaining, q + 1))}
                className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface"
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
            <button onClick={doClaim} disabled={busy} className="mt-3 min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60" data-testid="claim-button">
              {busy ? "Holding…" : `I want this · ${formatCents(d.studentPriceCents * qty)} at pickup`}
            </button>
          </>
        ) : (
          <p className="text-sm" data-testid="unavailable">
            {d.status === "sold-out" || remaining <= 0 ? "Sold out. Check other deals or free food help." : "This pickup window has ended."}
          </p>
        )}
      </section>

      <div className="mt-4">
        {reported ? (
          <p role="status" className="text-sm">Thanks. We&apos;ll check this deal.</p>
        ) : reportOpen ? (
          <fieldset className="rounded-xl bg-muted p-3" data-testid="report-panel">
            <legend className="float-left mb-2 w-full text-sm font-bold">What&apos;s wrong?</legend>
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
                await reportContent({ targetType: "food-deal", targetId: d.id, reason: reason! });
                setReported(true);
              }}
              className="mt-2 min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50"
            >
              Send report
            </button>
          </fieldset>
        ) : (
          <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Flag aria-hidden className="size-4" /> Report a problem with this deal
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-soft">{FOOD_COPY.demoNotice}</p>
    </>
  );
}
