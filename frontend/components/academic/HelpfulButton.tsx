"use client";

/** "Helpful" feedback on a resource or tip. It rates the content, never the student (D21). */
import { useState } from "react";
import { HandHelping } from "lucide-react";

export function HelpfulButton({
  initialCount,
  initialMarked,
  disabled,
  onToggle,
  size = "md",
}: {
  initialCount: number;
  initialMarked: boolean;
  disabled?: boolean;
  onToggle: (currentlyMarked: boolean) => Promise<{ helpfulCount: number; viewerMarkedHelpful: boolean }>;
  size?: "sm" | "md";
}) {
  const [state, setState] = useState({ count: initialCount, marked: initialMarked });
  const [busy, setBusy] = useState(false);

  async function click() {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const res = await onToggle(state.marked);
      setState({ count: res.helpfulCount, marked: res.viewerMarkedHelpful });
    } catch {
      /* e.g. self-vote rejected: keep state */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={disabled}
      aria-pressed={state.marked}
      title={disabled ? "You can't mark your own work as helpful" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold disabled:cursor-default disabled:opacity-60 ${
        size === "sm" ? "min-h-9 px-2 text-sm" : "min-h-11 px-3"
      } ${state.marked ? "bg-brand/10 text-brand" : "border border-line text-ink-soft hover:bg-muted"}`}
      data-testid="helpful-button"
    >
      <HandHelping aria-hidden className="size-4" />
      {state.marked ? "Helpful" : "Mark helpful"}
      <span className="font-bold" data-testid="helpful-count">
        {state.count}
      </span>
    </button>
  );
}
