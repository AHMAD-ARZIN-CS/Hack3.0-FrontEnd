"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Flag, Hash, Send, ShieldAlert } from "lucide-react";
import { AuthorLine } from "@/components/community/AuthorLine";
import { ListingThumb, MarketplaceSafetyNotice } from "@/components/marketplace/ListingCard";
import { UserSafetyActions } from "@/components/safety/UserSafetyActions";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { SUPPORTED_CAMPUSES } from "@/config/app";
import { ITEM_CONDITIONS, LISTING_CATEGORIES, MARKETPLACE_COPY, MARKETPLACE_LIMITS } from "@/config/marketplace";
import { tagLabel } from "@/config/tags";
import { useAsync } from "@/hooks/useAsync";
import { formatCents, timeAgo } from "@/lib/format";
import { getBlockedUserIds } from "@/services/blocks";
import { getListing, MarketplaceValidationError, reportListing, sendListingRequest, setListingProfileVisibility, setListingStatus } from "@/services/marketplace";
import { NotFoundError } from "@/services/mock";
import { getUserProfile } from "@/services/profiles";
import { getCurrentUser } from "@/services/user";
import type { ListingStatus, ReportReason, Visibility } from "@/types/models";

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "prohibited-item", label: "Item isn't allowed (weapons, alcohol, drugs, exam material)" },
  { id: "scam", label: "Asks for payment in advance, a deposit, or shipping" },
  { id: "copyright", label: "Textbook PDF or copied course material" },
  { id: "inaccurate", label: "Fake or misleading listing" },
  { id: "personal-info", label: "Shares someone's personal info" },
  { id: "other", label: "Something else" },
];

function ListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const justPosted = useSearchParams().get("posted") === "1";
  const listing = useAsync(() => getListing(listingId), [listingId]);
  const sellerId = listing.data?.sellerId;
  const seller = useAsync(() => (sellerId ? getUserProfile(sellerId) : Promise.resolve(null)), [sellerId]);
  const me = useAsync(() => getCurrentUser(), []);
  const blockedIds = useAsync(() => getBlockedUserIds(), [listingId]);

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  if (listing.loading) return <LoadingList count={3} label="Loading listing" />;
  if (listing.error instanceof NotFoundError)
    return (
      <EmptyState
        title="Listing not found"
        hint="It may have been sold or removed."
        action={
          <Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
            Back to Marketplace
          </Link>
        }
      />
    );
  if (listing.error != null || !listing.data) return <ErrorState onRetry={listing.reload} />;

  const l = listing.data;
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === l.campusId);
  const isOwn = me.data?.id === l.sellerId;
  const currentStatus = status ?? l.status;
  const currentVisibility = visibility ?? l.profileVisibility;
  const isBlocked = blocked ?? (blockedIds.data ?? []).includes(l.sellerId);
  const draft = message || "Hi! Is this still available? I can meet on campus.";

  async function connect() {
    setSending(true);
    setSendError(null);
    try {
      await sendListingRequest(l.id, draft);
      setSent(true);
    } catch (e) {
      setSendError(e instanceof MarketplaceValidationError ? e.message : "Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(next: ListingStatus) {
    const updated = await setListingStatus(l.id, next);
    setStatus(updated.status);
    setVisibility(updated.profileVisibility);
  }

  return (
    <>
      <Link href={isOwn ? "/marketplace?mine=1" : "/marketplace"} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Marketplace
      </Link>

      {justPosted && (
        <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success" data-testid="posted-banner">
          <CheckCircle2 aria-hidden className="size-4" /> Listed. Students near {campus?.shortName} can see it now.
        </p>
      )}
      {l.moderationStatus === "under-review" && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-xl bg-warn/10 p-3 text-sm" data-testid="review-banner">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Moderators are reviewing this listing after a report. Other students can&apos;t see it until the review is done.
        </p>
      )}

      <article className="rounded-2xl border border-line bg-surface p-4" data-testid="listing-detail">
        {l.images.length > 0 ? (
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1" data-testid="listing-images">
            {l.images.map((img) =>
              img.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob previews and backend URLs
                <img key={img.attachmentId} src={img.previewUrl} alt={`Photo: ${l.title}`} className="h-48 w-auto shrink-0 rounded-xl border border-line object-cover" />
              ) : null,
            )}
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-3">
            <ListingThumb listing={l} size="lg" />
            <p className="text-sm text-ink-soft">No photos added.</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{tagLabel(LISTING_CATEGORIES, l.category)}</Badge>
          <Badge>{tagLabel(ITEM_CONDITIONS, l.condition)}</Badge>
          {currentStatus === "pending" && <Badge tone="warn">Pending pickup</Badge>}
          {currentStatus === "sold" && <Badge tone="danger">Sold</Badge>}
          {l.isDemo && <DemoBadge />}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight">{l.title}</h1>
        <p className="mt-1 text-2xl font-extrabold text-brand" data-testid="detail-price">
          {formatCents(l.priceCents)}
        </p>
        {(l.courseCode || l.isbn) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <Hash aria-hidden className="size-4" />
            {[l.courseCode && `For ${l.courseCode}`, l.isbn && `ISBN ${l.isbn}`].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-3 whitespace-pre-line text-[15px]">{l.description}</p>
        <p className="mt-3 text-xs text-ink-soft">
          Listed {timeAgo(l.createdAt)} near {campus?.shortName}. {MARKETPLACE_COPY.noPayment}
        </p>
      </article>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4" data-testid="seller-preview" aria-labelledby="seller-heading">
        <h2 id="seller-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Seller
        </h2>
        <AuthorLine author={l.seller} />
        {seller.data && (
          <p className="mt-2 text-sm text-ink-soft">
            {[seller.data.major, `Level ${seller.data.level} · ${seller.data.levelName}`].filter(Boolean).join(" · ")}
          </p>
        )}
        <Link href={`/profile/${l.sellerId}`} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-brand underline" data-testid="seller-profile-link">
          View profile
        </Link>
        {!isOwn && me.data && (
          <div className="mt-2 border-t border-line pt-2">
            <UserSafetyActions userId={l.sellerId} displayName={l.seller.displayName} onBlockChange={setBlocked} />
          </div>
        )}
      </section>

      {isOwn ? (
        <section className="mt-4 rounded-2xl border border-line bg-surface p-4" data-testid="owner-controls">
          <p className="font-bold">This is your listing</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Listing status">
            {(
              [
                ["active", "Available"],
                ["pending", "Pending"],
                ["sold", "Sold"],
              ] as const
            ).map(([s, label]) => (
              <button
                key={s}
                type="button"
                aria-pressed={currentStatus === s}
                onClick={() => changeStatus(s)}
                className={`min-h-11 rounded-lg text-sm font-semibold ${currentStatus === s ? "bg-surface shadow-sm" : "text-ink-soft"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {currentStatus === "active" && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm">
                Show on my public profile
                <span className="block text-xs text-ink-soft">Off by default. Shows the title and a link here.</span>
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={currentVisibility === "public"}
                aria-label="Show this listing on my public profile"
                onClick={async () => {
                  const updated = await setListingProfileVisibility(l.id, currentVisibility === "public" ? "hidden" : "public");
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
          )}
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4" data-testid="connect-panel" aria-labelledby="connect-heading">
          <h2 id="connect-heading" className="font-bold">
            Want this?
          </h2>
          {isBlocked ? (
            <p className="mt-1 text-sm" data-testid="connect-blocked">You blocked this seller. Unblock them to send a request.</p>
          ) : sent || l.viewerRequested ? (
            <p role="status" className="mt-2 flex items-start gap-2 text-sm" data-testid="request-sent">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
              Request sent to {l.seller.displayName}. If they accept, you can plan a meetup in East Bay Link (messaging comes later). Your phone and email stay private.
            </p>
          ) : currentStatus !== "active" ? (
            <p className="mt-1 text-sm" data-testid="connect-unavailable">
              {currentStatus === "sold" ? "This item is sold." : "Someone is already picking this up. Check back later."}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">Send a short request. Don&apos;t include your phone, email, or address.</p>
              <label htmlFor="connect-message" className="sr-only">
                Message
              </label>
              <textarea
                id="connect-message"
                value={draft}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MARKETPLACE_LIMITS.messageMax}
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
        <MarketplaceSafetyNotice full />
      </div>

      {!isOwn && (
        <div className="mt-4">
          {reported ? (
            <p role="status" className="text-sm" data-testid="listing-reported">Thanks. The listing is flagged for review and hidden from the list until a moderator checks it.</p>
          ) : reportOpen ? (
            <fieldset className="rounded-xl bg-muted p-3" data-testid="report-panel">
              <legend className="float-left mb-2 w-full text-sm font-bold">What&apos;s wrong with this listing?</legend>
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
                  await reportListing(l.id, reason!);
                  setReported(true);
                }}
                className="mt-2 min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50"
              >
                Send report
              </button>
            </fieldset>
          ) : (
            <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-soft" data-testid="report-listing">
              <Flag aria-hidden className="size-4" /> Report this listing
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <ListingDetail />
    </Suspense>
  );
}
