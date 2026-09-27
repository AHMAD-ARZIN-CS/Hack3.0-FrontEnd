import { AlertTriangle, SearchX } from "lucide-react";

export function LoadingList({ count = 3, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-danger">
        <AlertTriangle aria-hidden className="size-4" />
        Couldn&apos;t load this right now.
      </p>
      {message && <p className="mt-1 text-ink-soft">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-3 min-h-11 rounded-lg bg-surface px-4 font-semibold ring-1 ring-line">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
      <SearchX aria-hidden className="mx-auto size-6 text-ink-soft" />
      <p className="mt-2 font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
