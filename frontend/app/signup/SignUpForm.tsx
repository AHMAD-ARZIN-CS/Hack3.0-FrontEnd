"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame, Field, FormError, inputCls, PasswordField, SubmitButton } from "@/components/auth/AuthParts";
import { useSession } from "@/hooks/useSession";
import { AuthError, nextStepFor, PASSWORD_MIN, signUp } from "@/services/auth";

/** Only what's needed to create an account. Campus, major, and courses come in onboarding. */
export function SignUpForm() {
  const router = useRouter();
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  useEffect(() => {
    if (session && !busy) router.replace(nextStepFor(session));
  }, [session, busy, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError({ field: "confirm", message: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const s = await signUp({ displayName: name, email, password, confirmsStudent: isStudent, acceptsTerms: terms });
      setPassword("");
      setConfirm("");
      router.replace(nextStepFor(s));
    } catch (err) {
      setError(err instanceof AuthError ? { field: err.field, message: err.message } : { message: "Couldn't create your account. Try again." });
      setBusy(false);
    }
  }

  const fieldError = (f: string) => (error?.field === f ? error.message : undefined);

  return (
    <AuthFrame title="Join your campus" subtitle="For current students at Chabot, DVC, and Cal State East Bay.">
      <form onSubmit={submit} noValidate className="space-y-4" data-testid="signup-form">
        <FormError message={error && !error.field ? error.message : null} />
        <Field id="name" label="Your name" error={fieldError("displayName")} hint="Others see your first name and last initial.">
          <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldError("displayName")} className={inputCls} />
        </Field>
        <Field id="email" label="Email" error={fieldError("email")} hint="Your campus email makes student verification easier later. Only you see it.">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldError("email")}
            className={inputCls}
          />
        </Field>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={fieldError("password")}
          hint={`At least ${PASSWORD_MIN} characters.`}
        />
        <PasswordField id="confirm" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={fieldError("confirm")} />

        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="mt-1 size-4 accent-brand" data-testid="confirm-student" />
          <span className="text-sm">
            I&apos;m a current student at Chabot College, Diablo Valley College, or Cal State East Bay.
            <span className="block text-xs text-ink-soft">Faculty, staff, and clubs join later through a separate role review.</span>
          </span>
        </label>
        {fieldError("confirmsStudent") && (
          <p role="alert" className="-mt-2 text-sm text-danger" data-testid="error-confirmsStudent">
            {fieldError("confirmsStudent")}
          </p>
        )}
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 size-4 accent-brand" data-testid="accept-terms" />
          <span className="text-sm">
            I agree to the community guidelines and the{" "}
            <Link href="/privacy" className="font-semibold text-brand underline">
              privacy notice
            </Link>
            .
          </span>
        </label>
        {fieldError("acceptsTerms") && (
          <p role="alert" className="-mt-2 text-sm text-danger" data-testid="error-acceptsTerms">
            {fieldError("acceptsTerms")}
          </p>
        )}

        <SubmitButton busy={busy} busyText="Creating account…">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand underline">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
