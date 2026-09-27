"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { nextStepFor } from "@/services/auth";

/** Hero buttons. Signed-in visitors get a way back into the app instead of "Join". */
export function LandingCta() {
  const session = useSession();
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
      {session ? (
        <Link href={nextStepFor(session)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-on-brand" data-testid="hero-continue">
          Continue to my campus <ArrowRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <Link href="/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-on-brand" data-testid="hero-join">
          Join your campus <ArrowRight aria-hidden className="size-4" />
        </Link>
      )}
      <a href="#how" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-6 font-semibold">
        See how it works
      </a>
    </div>
  );
}
