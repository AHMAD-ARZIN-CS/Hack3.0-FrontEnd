"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Field, FormError, inputCls, Logo } from "@/components/auth/AuthParts";
import { SHOW_DEMO_AUTH_CONTROLS } from "@/config/app";
import { useSession } from "@/hooks/useSession";
import { AuthError, changeEmail, nextStepFor, refreshSession, resendVerification, signOut, simulateEmailVerifiedMock } from "@/services/auth";

/** Account is authenticated but the email isn't confirmed yet. Nothing else in the app opens until it is. */
export default function VerifyEmailPage() {
  const router = useRouter();
  const session = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  if (!session) return null;

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (ok) setNotice(ok);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-testid="verify-email">
      <Logo />
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-center">
        <MailCheck aria-hidden className="mx-auto size-12 text-brand" />
        <h1 className="mt-3 text-2xl font-extrabold">Verify your email</h1>
        <p className="mt-2 text-ink-soft">
          We sent a verification link to <span className="font-semibold text-ink" data-testid="verify-email-address">{session.email}</span>. Open it to
          continue.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {notice && (
          <p role="status" className="rounded-xl bg-success/10 p-3 text-sm font-semibold text-success" data-testid="verify-notice">
            {notice}
          </p>
        )}
        <FormError message={error} />

        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            run("continue", async () => {
              const s = await refreshSession();
              if (s?.emailVerified) router.replace(nextStepFor(s));
              else throw new AuthError("invalid-credentials", "We haven't seen the link opened yet. Check your inbox and spam folder.");
            })
          }
          className="min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60"
          data-testid="verify-continue"
        >
          {busy === "continue" ? "Checking…" : "I've verified, continue"}
        </button>

        {SHOW_DEMO_AUTH_CONTROLS && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("simulate", async () => router.replace(nextStepFor(await simulateEmailVerifiedMock())))}
            className="min-h-12 w-full rounded-xl border border-warn bg-warn/10 font-semibold disabled:opacity-60"
            data-testid="verify-simulate"
          >
            Demo: simulate opening the link
          </button>
        )}

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-sm">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("resend", resendVerification, `We sent a new link to ${session.email}.`)}
            className="min-h-10 font-semibold text-brand"
            data-testid="verify-resend"
          >
            {busy === "resend" ? "Sending…" : "Resend link"}
          </button>
          <button type="button" onClick={() => setEditing((v) => !v)} className="min-h-10 font-semibold text-brand" data-testid="verify-change-toggle">
            Change email
          </button>
          <button type="button" onClick={() => run("out", async () => { await signOut(); router.replace("/welcome"); })} className="min-h-10 font-semibold text-ink-soft">
            Sign out
          </button>
        </div>

        {editing && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void run("change", async () => {
                const s = await changeEmail(newEmail);
                setEditing(false);
                setNewEmail("");
                setNotice(`We sent a verification link to ${s.email}.`);
              });
            }}
            className="space-y-3 rounded-2xl border border-line bg-surface p-4"
            data-testid="change-email-form"
          >
            <Field id="new-email" label="New email">
              <input id="new-email" type="email" inputMode="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} />
            </Field>
            <button type="submit" disabled={!!busy} className="min-h-11 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60">
              Update and resend
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
