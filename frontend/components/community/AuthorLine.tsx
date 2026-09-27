import Link from "next/link";
import { BadgeCheck, Building2, GraduationCap, UserRound } from "lucide-react";
import { SUPPORTED_CAMPUSES } from "@/config/app";
import { ROLE_LABELS } from "@/config/community";
import { timeAgo } from "@/lib/format";
import type { PublicUser } from "@/types/models";

/** Avatar tints. Decorative only: a color never signals rank, role, or trust. */
const AVATAR_TINTS = [
  "bg-brand/12 text-brand-deep",
  "bg-petal/18 text-petal-ink",
  "bg-sage/15 text-sage-ink",
  "bg-golden/20 text-golden-ink",
];

/** FNV-1a: spreads similar ids ("user_maya", "user_lee") across all tints. */
function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function avatarTint(user: Pick<PublicUser, "id" | "role">) {
  return (user.role ?? "student") === "student" ? AVATAR_TINTS[hashId(user.id) % AVATAR_TINTS.length] : "bg-brand-deep text-on-brand";
}

/** First letter of the first and last word: "Maya Lopez" → "ML", "Demo Student J." → "DJ". */
export function initialsOf(name: string) {
  const words = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Who posted, with role and campus (D25).
 * Faculty/staff "Verified role" only when roleVerified is true (review process, not email).
 */
export function AuthorLine({ author, createdAt, compact }: { author: PublicUser; createdAt?: string; compact?: boolean }) {
  const role = author.role ?? "student";
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === author.campusId)?.shortName;
  const initials = initialsOf(author.displayName);
  const tint = avatarTint(author);
  const RoleIcon = role === "faculty-staff" ? GraduationCap : role === "organization" ? Building2 : UserRound;

  const verifiedText =
    role === "student"
      ? author.verifiedStudent
        ? "Verified student"
        : undefined
      : author.roleVerified
        ? "Verified role"
        : "Role not confirmed";

  return (
    <div className="flex items-start gap-2.5" data-testid="author-line" data-role={role}>
      <Link
        href={`/profile/${author.id}`}
        aria-hidden
        tabIndex={-1}
        className={`flex shrink-0 items-center justify-center rounded-full font-bold ${compact ? "size-8 text-xs" : "size-10 text-sm"} ${tint}`}
      >
        {initials}
      </Link>
      <div className="min-w-0 leading-tight">
        <Link href={`/profile/${author.id}`} className="font-semibold hover:underline" data-testid="author-link">
          {author.displayName}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-0.5 font-medium text-ink">
            <RoleIcon aria-hidden className="size-3.5" />
            {ROLE_LABELS[role]}
          </span>
          {campus && <span>· {campus}</span>}
          {verifiedText && (
            <span
              className={`inline-flex items-center gap-0.5 ${verifiedText === "Role not confirmed" ? "" : "text-success"}`}
              data-testid="author-verification"
            >
              · {verifiedText !== "Role not confirmed" && <BadgeCheck aria-hidden className="size-3.5" />}
              {verifiedText}
            </span>
          )}
          {createdAt && <span>· {timeAgo(createdAt)}</span>}
        </p>
        {!compact && role !== "student" && author.roleTitle && (
          <p className="mt-0.5 text-xs text-ink-soft">{author.roleTitle}</p>
        )}
      </div>
    </div>
  );
}
