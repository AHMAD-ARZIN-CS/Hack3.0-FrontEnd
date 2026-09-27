"use client";

/**
 * Shared pieces for public + auth screens so they read as the same product as the app:
 * same green, same rounded cards, same type. Passwords are only held in the form's own state.
 */
import Link from "next/link";
import { useId, useState } from "react";
import { BookOpen, Compass, Eye, EyeOff, Home, Users } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { SHOW_DEMO_AUTH_CONTROLS } from "@/config/app";

export function Logo({ className = "" }: { className?: string }) {
  return (
    // LOGO: sign-in, sign-up, and landing header. Change the logo in components/brand/Logo.tsx
    <Link href="/welcome" className={`inline-flex text-brand ${className}`}>
      <LogoLockup />
    </Link>
  );
}

const PILLARS = [
  { icon: Users, label: "Community" },
  { icon: BookOpen, label: "Academic" },
  { icon: Compass, label: "Discover" },
  { icon: Home, label: "Housing" },
];

/** Two-column on desktop (brand panel + form), single column on phones. */
export function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand p-10 text-on-brand lg:flex">
        {/* LOGO: blue panel on desktop sign-in. Uses the inverted mark. Change it in components/brand/Logo.tsx */}
        <Link href="/welcome" className="inline-flex text-lg">
          <LogoLockup size="lg" inverted />
        </Link>
        <div>
          <p className="text-4xl font-extrabold leading-tight">
            Your campus.
            <br />
            Your people.
            <br />
            Everything easier to find.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {PILLARS.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-on-brand/15 px-3 py-1.5 text-sm font-semibold">
                <Icon aria-hidden className="size-4" /> {label}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-80">For students at Chabot College, Diablo Valley College, and Cal State East Bay.</p>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:min-h-0 lg:justify-center">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto mt-8 w-full max-w-md lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {SHOW_DEMO_AUTH_CONTROLS && (
            <p className="mt-8 rounded-xl bg-warn/15 p-3 text-xs" data-testid="mock-auth-note">
              Demo mode. Accounts are simulated in this browser. Passwords are never stored. Real sign-in comes with the backend.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full min-h-12 rounded-xl border border-line bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-brand aria-[invalid=true]:border-danger";

export function Field({
  label,
  error,
  hint,
  children,
  id,
}: {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" id={`${id}-error`} className="mt-1 text-sm text-danger" data-testid={`error-${id}`}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Password input with show/hide. Never logs or persists the value. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const toggleId = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputCls} pr-12`}
        />
        <button
          id={toggleId}
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-muted"
          data-testid={`${id}-toggle`}
        >
          {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
    </Field>
  );
}

export function SubmitButton({ busy, children, busyText }: { busy: boolean; children: React.ReactNode; busyText: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60"
    >
      {busy && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-on-brand border-t-transparent" />}
      {busy ? busyText : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger" data-testid="form-error">
      {message}
    </p>
  );
}
