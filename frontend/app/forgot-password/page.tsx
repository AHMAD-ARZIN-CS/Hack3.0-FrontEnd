"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthFrame, Field, inputCls, SubmitButton } from "@/components/auth/AuthParts";
import { AuthError, requestPasswordReset } from "@/services/auth";

/** Same confirmation for every email, so the page never reveals who has an account. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Couldn't send the link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sentTo ? (
        <div role="status" className="rounded-2xl border border-success/40 bg-success/5 p-4" data-testid="reset-sent">
          <p className="flex items-center gap-2 font-bold text-success">
            <CheckCircle2 aria-hidden className="size-5" /> Check your email
          </p>
          <p className="mt-1 text-sm">
            If an account exists for <span className="font-semibold">{sentTo}</span>, a reset link is on its way. It can take a few minutes.
          </p>
          <button type="button" onClick={() => setSentTo(null)} className="mt-3 min-h-10 text-sm font-semibold text-brand">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4" data-testid="reset-form">
          <Field id="email" label="Email" error={error ?? undefined}>
            <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} className={inputCls} />
          </Field>
          <SubmitButton busy={busy} busyText="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand underline">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
