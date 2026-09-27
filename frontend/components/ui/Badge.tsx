import { BadgeCheck, FlaskConical } from "lucide-react";

type Tone = "neutral" | "brand" | "success" | "warn" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-ink-soft",
  brand: "bg-brand/10 text-brand",
  success: "bg-success/12 text-success",
  warn: "bg-warn/20 text-ink",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Verified means checked/identity-verified. It never means "safe" (PROJECT_CONTEXT). */
export function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <Badge tone="success">
      <BadgeCheck aria-hidden className="size-3.5" />
      {label}
    </Badge>
  );
}

export function DemoBadge() {
  return (
    <Badge tone="warn">
      <FlaskConical aria-hidden className="size-3.5" />
      Demo
    </Badge>
  );
}
