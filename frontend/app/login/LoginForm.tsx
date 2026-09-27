"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame, Field, FormError, inputCls, PasswordField, SubmitButton } from "@/components/auth/AuthParts";
import { SHOW_DEMO_AUTH_CONTROLS } from "@/config/app";
import { useCampus } from "@/context/CampusContext";
import { useSession } from "@/hooks/useSession";
import { AuthError, nextStepFor, signIn, signInAsDemo } from "@/services/auth";
import type { AuthSession } from "@/types/models";

export function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const { setCampus } = useCampus();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  // Returning users who are already signed in go straight to their next step.
  useEffect(() => {
    if (session && !busy) router.replace(nextStepFor(session));
  }, [session, busy, router]);

  function landed(s: AuthSession) {
    if (s.homeCampusId) setCampus(s.homeCampusId);
    router.replace(nextStepFor(s));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const s = await signIn({ email, password });
      setPassword(""); // don't keep the password around after the call
      landed(s);
    } catch (err) {
      setPassword("");
      setError(err instanceof AuthError ? { field: err.field, message: err.message } : { message: "Couldn't sign in. Check your connection and try again." });
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to your campus community.">
      <form onSubmit={submit} noValidate className="space-y-4" data-testid="login-form">
        <FormError message={error && !error.field ? error.message : null} />
        <Field id="email" label="Email" error={error?.field === "email" ? error.message : undefined}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error?.field === "email"}
            className={inputCls}
          />
        </Field>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={error?.field === "password" ? error.message : undefined}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="min-h-10 py-2 text-sm font-semibold text-brand">
            Forgot password?
          </Link>
        </div>
        <SubmitButton busy={busy} busyText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      {SHOW_DEMO_AUTH_CONTROLS && (
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            landed(await signInAsDemo());
          }}
          disabled={busy}
          className="mt-3 min-h-12 w-full rounded-xl border border-brand/40 bg-brand/5 font-semibold text-brand disabled:opacity-60"
          data-testid="demo-signin"
        >
          Continue as the demo student
        </button>
      )}

      <p className="mt-6 text-center text-sm">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand underline">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}
