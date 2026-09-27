import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/auth/AuthParts";
import { APP_NAME } from "@/config/app";

export const metadata: Metadata = { title: "Privacy notice" };

/** Plain-language notice for the prototype. Not a legal policy (no legal review yet). */
export default function PrivacyPage() {
  const items: [string, string][] = [
    ["What your account holds", "Your name, email, campus, and anything you choose to add: major, courses, interests. Your password goes to the sign-in provider and is never stored by this app."],
    ["What other students see", "Your first name and last initial, campus, verification status, courses, interests, and what you've contributed. Never your email, phone, student ID, grades, or address."],
    ["What stays private", "The needs you pick during onboarding, your housing status (unless you turn it on), and who you've blocked."],
    ["Housing", "Posts show an approximate area only. Contact starts with a request. Don't share an address until you've agreed to meet."],
    ["Reports", "When you report something, the person you reported is not told who reported it."],
    ["This prototype", `${APP_NAME} is a hackathon project. In demo mode, accounts are simulated in your browser and all people and listings are sample data. It is not an official college service and has not had a legal review.`],
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Privacy notice</h1>
      <p className="mt-2 text-ink-soft">A plain-language summary of what {APP_NAME} keeps and who sees it.</p>
      <dl className="mt-6 space-y-3">
        {items.map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-surface p-4">
            <dt className="font-bold">{t}</dt>
            <dd className="mt-1 text-sm text-ink-soft">{d}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm">
        <Link href="/signup" className="font-semibold text-brand underline">Back to sign up</Link>
      </p>
    </div>
  );
}
