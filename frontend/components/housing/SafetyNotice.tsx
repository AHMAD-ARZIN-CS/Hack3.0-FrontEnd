import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { HOUSING_SAFETY } from "@/config/housing";

/** Verification is not a safety guarantee. Shown on browse (short) and detail (full). */
export function SafetyNotice({ full = false }: { full?: boolean }) {
  return (
    <aside className="rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm" data-testid="housing-safety">
      <p className="flex items-start gap-2 font-semibold">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        {full ? "Stay safe" : "Verified means current student. It is not a safety guarantee."}
      </p>
      {full && (
        <>
          <p className="mt-1.5">{HOUSING_SAFETY.verification}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {HOUSING_SAFETY.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-2 text-ink-soft">{HOUSING_SAFETY.fairHousing}</p>
          <Link href="/safety" className="mt-2 inline-flex min-h-10 items-center font-semibold text-brand underline">
            Campus safety resources
          </Link>
        </>
      )}
    </aside>
  );
}
