"use client";

/** Toggle chip for filters. Uses aria-pressed so screen readers announce state. */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
        selected ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
