import Link from "next/link";
import { PenLine } from "lucide-react";

/** Familiar "What's on your mind?" entry point. Opens the full post form. */
export function ComposerPrompt({
  displayName,
  campusShortName,
  testId = "new-post-link",
}: {
  displayName?: string;
  campusShortName: string;
  testId?: string;
}) {
  const initials = (displayName ?? "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Link
      href="/community/new"
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2 hover:border-brand"
      data-testid={testId}
    >
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
        {initials || <PenLine className="size-4" />}
      </span>
      <span className="flex-1 text-ink-soft">Ask a question or share something with {campusShortName}…</span>
      <span className="hidden rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand sm:inline">Post</span>
    </Link>
  );
}
