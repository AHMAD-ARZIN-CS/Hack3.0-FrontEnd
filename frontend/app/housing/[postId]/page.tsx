"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, Flag, MapPin, Send } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { SafetyNotice } from "@/components/housing/SafetyNotice";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { SHOW_DEMO_DATA_CONTROLS, SUPPORTED_CAMPUSES } from "@/config/app";
import { HOUSING_AMENITIES, HOUSING_LIMITS, HOUSING_PREFERENCES } from "@/config/housing";
import { tagLabel } from "@/config/tags";
import { useAsync } from "@/hooks/useAsync";
import { startOfToday, toDateKey } from "@/lib/dates";
import { formatAvailability, formatCents } from "@/lib/format";
import { closeHousingPost, getHousingPost, HousingValidationError, sendHousingRequest, setHousingProfileVisibility, simulateHousingAcceptedMock } from "@/services/housing";
import { NotFoundError } from "@/services/mock";
import { getUserProfile } from "@/services/profiles";
import { reportContent } from "@/services/reports";
import { getCurrentUser } from "@/services/user";
import type { ReportReason } from "@/types/models";

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "scam", label: "Asks for a deposit, payment, or financial info" },
  { id: "inaccurate", label: "Fake or misleading listing" },
  { id: "discrimination", label: "Excludes people unfairly (fair housing)" },
  { id: "personal-info", label: "Shares someone's personal info or address" },
  { id: "harassment", label: "Harassment" },
  { id: "other", label: "Something else" },
];

function HousingDetail() {
  const { postId } = useParams<{ postId: string }>();
  const justPosted = useSearchParams().get("posted") === "1";
  const post = useAsync(() => getHousingPost(postId), [postId]);
  const authorId = post.data?.authorId;
  const owner = useAsync(() => (authorId ? getUserProfile(authorId) : Promise.resolve(null)), [authorId]);
  const me = useAsync(() => getCurrentUser(), []);

  const p = post.data;
  const isOwn = !!p && me.data?.id === p.authorId;
  const isRoom = p?.type === "room-available";

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "hidden" | null>(null);
  const [closed, setClosed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  const draft =
    message ||
    (p ? (isRoom ? "Hi! I'm a student interested in your room. Is it still available?" : "Hi! I have a room that might fit what you're looking for.") : "");

  async function connect() {
    if (!p) return;
    setSending(true);
    setSendError(null);
    try {
      await sendHousingRequest(p.id, draft);
      setSent(true);
    } catch (e) {
      setSendError(e instanceof HousingValidationError ? e.message : "Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (post.loading) return <LoadingList count={3} label="Loading housing post" />;
  if (post.error instanceof NotFoundError)
    return (
      <EmptyState
        title="Housing post not found"
        hint="It may have been filled or removed."
        action={
          <Link href="/housing" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
            Back to Housing
          </Link>
        }
      />
    );
  if (post.error != null || !p) return <ErrorState onRetry={post.reload} />;

  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === p.campusId);
  const price = isRoom ? p.monthlyRentCents : p.budgetMaxCents;
  const currentVisibility = visibility ?? p.profileVisibility;

  return (
    <>
      <Link href={`/housing/browse?type=${p.type}`} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> {isRoom ? "Rooms" : "People looking"}
      </Link>

      {justPosted && (
        <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success" data-testid="posted-banner">
          <CheckCircle2 aria-hidden className="size-4" /> Posted. Students near {campus?.shortName} can see it now.
        </p>
      )}

      <article className="rounded-2xl border border-line bg-surface p-4" data-testid="housing-detail">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={isRoom ? "success" : "brand"}>{isRoom ? "Room available" : "Looking for a room"}</Badge>
          {p.roomType && <Badge>{p.roomType === "private" ? "Private room" : "Shared room"}</Badge>}
          {(p.status !== "active" || closed) && <Badge tone="warn">Closed</Badge>}
          {p.isDemo && <DemoBadge />}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight">{p.title}</h1>
        {price !== undefined && (
          <p className="mt-1 text-xl font-extrabold" data-testid="detail-price">
            {isRoom ? formatCents(price) : `Budget up to ${formatCents(price)}`}
            <span className="text-sm font-medium text-ink-soft"> / month</span>
          </p>
        )}
        <ul className="mt-2 space-y-1 text-[15px]">
          <li className="flex items-center gap-1.5" data-testid="detail-area">
            <MapPin aria-hidden className="size-4 shrink-0 text-ink-soft" />
            {p.areaName} (approximate area)
            {p.distanceMiles !== undefined && ` · ~${p.distanceMiles} mi from ${campus?.shortName}`}
          </li>
          <li className="flex items-center gap-1.5">
            <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-soft" />
            {formatAvailability(p.availableFrom, toDateKey(startOfToday()))}
            {p.leaseLengthMonths ? ` · ${p.leaseLengthMonths}-month lease` : ""}
          </li>
        </ul>
        <p className="mt-3 whitespace-pre-line text-[15px]">{p.description}</p>

        {p.amenities.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-1.5 text-sm font-bold">Amenities</h2>
            <ul className="flex flex-wrap gap-1.5" data-testid="detail-amenities">
              {p.amenities.map((a) => (
                <li key={a} className="rounded-full border border-line px-2.5 py-1 text-sm">{tagLabel(HOUSING_AMENITIES, a)}</li>
              ))}
            </ul>
          </section>
        )}
        {p.preferences.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-1.5 text-sm font-bold">Living preferences</h2>
            <ul className="flex flex-wrap gap-1.5" data-testid="detail-preferences">
              {p.preferences.map((x) => (
                <li key={x} className="rounded-full bg-muted px-2.5 py-1 text-sm">{tagLabel(HOUSING_PREFERENCES, x)}</li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-3 text-xs text-ink-soft">Exact address is shared only between the two of you, after you both agree to talk.</p>
      </article>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4" data-testid="owner-preview" aria-labelledby="owner-heading">
        <h2 id="owner-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Posted by
        </h2>
        <AuthorLine author={p.author} createdAt={p.createdAt} />
        {owner.data && (
          <p className="mt-2 text-sm text-ink-soft">
            {[owner.data.major, `Level ${owner.data.level} · ${owner.data.levelName}`, `${owner.data.stats.helpfulVotesReceived} helpful votes`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <Link href={`/profile/${p.authorId}`} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-brand underline" data-testid="owner-profile-link">
          View profile
        </Link>
      </section>

      {isOwn ? (
        <section className="mt-4 rounded-2xl border border-line bg-surface p-4" data-testid="owner-controls">
          <p className="font-bold">This is your post</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm">
              Show &quot;{isRoom ? "Housing available" : "Looking for roommate"}&quot; on my public profile
              <span className="block text-xs text-ink-soft">Only the status shows. Details stay here.</span>
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={currentVisibility === "public"}
              aria-label="Show housing status on my public profile"
              onClick={async () => {
                const next = currentVisibility === "public" ? "hidden" : "public";
                const updated = await setHousingProfileVisibility(p.id, next);
                setVisibility(updated.profileVisibility);
              }}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${
                currentVisibility === "public" ? "border-brand bg-brand text-on-brand" : "border-line"
              }`}
            >
              {currentVisibility === "public" ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
              {currentVisibility === "public" ? "Public" : "Hidden"}
            </button>
          </div>
          {!closed && p.status === "active" && (
            <button
              type="button"
              onClick={async () => {
                await closeHousingPost(p.id);
                setClosed(true);
                setVisibility("hidden");
              }}
              className="mt-3 min-h-11 rounded-xl border border-line px-4 text-sm font-semibold"
            >
              Mark as filled
            </button>
          )}
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4" data-testid="connect-panel" aria-labelledby="connect-heading">
          <h2 id="connect-heading" className="font-bold">
            {isRoom ? "Interested in this room?" : "Have a room for this student?"}
          </h2>
          {accepted || p.viewerRequestStatus === "accepted" ? (
            <div role="status" className="mt-2 rounded-xl bg-success/10 p-3 text-sm" data-testid="request-accepted">
              <p className="flex items-center gap-2 font-bold text-success">
                <CheckCircle2 aria-hidden className="size-4 shrink-0" /> Connection accepted
              </p>
              <p className="mt-1">
                {p.author.displayName} accepted your request. Messaging in East Bay Link comes next. Nothing was shared: your phone and email stay private until you
                both choose how to talk.
              </p>
            </div>
          ) : sent || p.viewerRequested ? (
            <>
              <p role="status" className="mt-2 flex items-start gap-2 text-sm" data-testid="request-sent">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                Request sent to {p.author.displayName}. If they accept, you can talk in East Bay Link (messaging comes later). Your phone and email stay private.
              </p>
              {SHOW_DEMO_DATA_CONTROLS && (
                <button
                  type="button"
                  onClick={async () => {
                    await simulateHousingAcceptedMock(p.id);
                    setAccepted(true);
                  }}
                  className="mt-2 min-h-10 rounded-lg border border-warn bg-warn/10 px-3 text-sm font-semibold"
                  data-testid="simulate-accept"
                >
                  Demo: simulate {p.author.displayName} accepting
                </button>
              )}
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">Send a short request. Don&apos;t include your phone, email, or address yet.</p>
              <label htmlFor="connect-message" className="sr-only">
                Message
              </label>
              <textarea
                id="connect-message"
                value={draft}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={HOUSING_LIMITS.messageMax}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-surface p-3 text-base focus-visible:outline-2 focus-visible:outline-brand"
              />
              {sendError && (
                <p role="alert" className="text-sm text-danger" data-testid="connect-error">
                  {sendError}
                </p>
              )}
              <button
                type="button"
                onClick={connect}
                disabled={sending}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-on-brand disabled:opacity-60"
                data-testid="connect-button"
              >
                <Send aria-hidden className="size-4" /> {sending ? "Sending…" : "Request to connect"}
              </button>
            </>
          )}
        </section>
      )}

      <div className="mt-4">
        <SafetyNotice full />
      </div>

      {!isOwn && (
        <div className="mt-4">
          {reported ? (
            <p role="status" className="text-sm">Thanks. Moderators will review this post.</p>
          ) : reportOpen ? (
            <fieldset className="rounded-xl bg-muted p-3" data-testid="report-panel">
              <legend className="float-left mb-2 w-full text-sm font-bold">What&apos;s wrong with this post?</legend>
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
                  await reportContent({ targetType: "housing-post", targetId: p.id, reason: reason! });
                  setReported(true);
                }}
                className="mt-2 min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50"
              >
                Send report
              </button>
            </fieldset>
          ) : (
            <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <Flag aria-hidden className="size-4" /> Report this post
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function HousingDetailPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <HousingDetail />
    </Suspense>
  );
}
