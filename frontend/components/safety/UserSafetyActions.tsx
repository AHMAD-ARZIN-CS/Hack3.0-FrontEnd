"use client";

/**
 * Report or block a person (moderation prep, D31). Used on marketplace listings and public profiles.
 * Reporting sends a "profile" report. Blocking is private: the other person is not told.
 */
import { useState } from "react";
import { Ban, Flag } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { blockUser, getBlockedUserIds, unblockUser } from "@/services/blocks";
import { reportContent } from "@/services/reports";
import type { ReportReason } from "@/types/models";

const USER_REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "scam", label: "Scam or asked for payment in advance" },
  { id: "harassment", label: "Harassment or threats" },
  { id: "personal-info", label: "Shared someone's personal info" },
  { id: "spam", label: "Spam or fake account" },
  { id: "other", label: "Something else" },
];

export function UserSafetyActions({
  userId,
  displayName,
  onBlockChange,
}: {
  userId: string;
  displayName: string;
  onBlockChange?: (blocked: boolean) => void;
}) {
  const blockedIds = useAsync(() => getBlockedUserIds(), [userId]);
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  const isBlocked = blocked ?? (blockedIds.data ?? []).includes(userId);

  async function toggleBlock() {
    setBusy(true);
    if (isBlocked) await unblockUser(userId);
    else await blockUser(userId);
    setBlocked(!isBlocked);
    onBlockChange?.(!isBlocked);
    setBusy(false);
  }

  return (
    <div className="space-y-2" data-testid="user-safety">
      <div className="flex flex-wrap gap-2">
        {!reported && !reportOpen && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-ink-soft"
            data-testid="report-user"
          >
            <Flag aria-hidden className="size-4" /> Report {displayName}
          </button>
        )}
        <button
          type="button"
          onClick={toggleBlock}
          disabled={busy || blockedIds.loading}
          aria-pressed={isBlocked}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-ink-soft disabled:opacity-60"
          data-testid="block-user"
        >
          <Ban aria-hidden className="size-4" /> {isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}
        </button>
      </div>
      {isBlocked && (
        <p role="status" className="text-sm" data-testid="blocked-note">
          You blocked {displayName}. Their listings are hidden from you and they can&apos;t get requests from you. They aren&apos;t told.
        </p>
      )}
      {reported && (
        <p role="status" className="text-sm" data-testid="user-reported">
          Thanks. Moderators will review this account.
        </p>
      )}
      {reportOpen && !reported && (
        <fieldset className="rounded-xl bg-muted p-3" data-testid="report-user-panel">
          <legend className="float-left mb-2 w-full text-sm font-bold">What&apos;s wrong with this account?</legend>
          <div className="clear-both space-y-1">
            {USER_REPORT_REASONS.map((x) => (
              <label key={x.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="radio" name="user-reason" value={x.id} checked={reason === x.id} onChange={() => setReason(x.id)} className="size-4 accent-brand" />
                {x.label}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!reason}
            onClick={async () => {
              await reportContent({ targetType: "profile", targetId: userId, reason: reason! });
              setReported(true);
            }}
            className="mt-2 min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-50"
          >
            Send report
          </button>
        </fieldset>
      )}
    </div>
  );
}
