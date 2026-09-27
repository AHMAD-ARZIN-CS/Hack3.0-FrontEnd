import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BookOpen,
  Compass,
  Flag,
  GraduationCap,
  HandHelping,
  Lightbulb,
  MapPin,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/auth/AuthParts";
import { LogoLockup } from "@/components/brand/Logo";
import { APP_NAME, SUPPORTED_CAMPUSES } from "@/config/app";
import { LandingCta } from "./LandingCta";

export const metadata: Metadata = {
  title: `${APP_NAME} · Your campus, your people`,
  description: "Find course help, campus opportunities, food, housing, resources, and students who can help, in one local campus community.",
};

const FRAGMENTS = [
  { need: "Course knowledge", now: "Scattered across group chats and students who already took the class", icon: BookOpen },
  { need: "Housing", now: "Unrelated listing sites with no campus context", icon: BedDouble },
  { need: "Food and resources", now: "Separate programs, each with its own page", icon: UtensilsCrossed },
  { need: "Opportunities", now: "Buried in email", icon: Sparkles },
  { need: "Campus information", now: "Spread over several websites", icon: Compass },
];

const STEPS = [
  { title: "Join your campus", body: "Pick Chabot, DVC, or CSUEB. Everything you see starts there.", icon: MapPin },
  { title: "Find your community", body: "Questions, study groups, and events from students at your campus.", icon: Users },
  { title: "Discover what helps", body: "Notes and tips for your courses, food, housing, resources, and opportunities.", icon: Search },
  { title: "Contribute back", body: "Share what worked for you. Your profile shows how you've helped.", icon: HandHelping },
];

const TRUST = [
  { title: "Campus-aware profiles", body: "Profiles show campus, courses, and contributions. Never your email, phone, grades, or address.", icon: UserRoundCheck },
  { title: "Student verification", body: "Signing in doesn't make you verified. The Verified student label appears only after enrollment is confirmed.", icon: BadgeCheck },
  { title: "Faculty and staff roles", body: "Roles are reviewed. A college email alone never grants one.", icon: GraduationCap },
  { title: "Privacy-aware housing", body: "Posts show an approximate area, never an address. Contact starts with a request, not your phone number.", icon: ShieldCheck },
  { title: "Community moderation", body: "Posts, listings, and people can be reported. Study resources are reviewed before they're public.", icon: Flag },
];

/** Sample product preview. Same card styles as the app, labeled as sample content. */
function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-label="Preview of the app with sample content" role="img">
      <div className="rounded-[2rem] border border-line bg-bg p-3 shadow-xl">
        <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2">
          {/* LOGO: landing page phone preview. Change the logo in components/brand/Logo.tsx */}
          <span className="text-sm text-brand">
            <LogoLockup size="sm" />
          </span>
          <span className="rounded-lg border border-line px-2 py-0.5 text-xs font-semibold">Chabot</span>
        </div>
        <div className="mt-2 space-y-2">
          <div className="rounded-2xl border border-line bg-surface p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <MessagesSquare aria-hidden className="size-3.5 text-brand" /> Community · Question
            </p>
            <p className="mt-1 text-sm font-bold">Anyone running a CSCI 14 study group this week?</p>
            <p className="mt-1 text-xs text-ink-soft">3 replies · 5 found helpful</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <BookOpen aria-hidden className="size-3.5 text-brand" /> Academic · MTH 1
            </p>
            <p className="mt-1 text-sm font-bold">Derivative rules one-page study guide</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
              <Lightbulb aria-hidden className="size-3.5" /> Shared by a student who took the course
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-line bg-surface p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <Compass aria-hidden className="size-3.5 text-brand" /> Discover
              </p>
              <p className="mt-1 text-sm font-bold">Food pantry open today</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <BedDouble aria-hidden className="size-3.5 text-brand" /> Housing
              </p>
              <p className="mt-1 text-sm font-bold">Room near campus</p>
              <p className="text-xs text-ink-soft">Approximate area only</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">Sample content</p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <div className="bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <nav aria-label="Site" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-ink-soft hover:text-ink sm:flex">
              How it works
            </a>
            <Link href="/login" className="flex min-h-11 items-center px-3 text-sm font-semibold text-brand" data-testid="nav-signin">
              Sign in
            </Link>
            <Link href="/signup" className="flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand" data-testid="nav-join">
              Join
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
            <MapPin aria-hidden className="size-4" /> Chabot · DVC · Cal State East Bay
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">
            Your campus.
            <br />
            Your people.
            <br />
            <span className="text-brand">Everything easier to find.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Find course help, campus opportunities, food, housing, resources, and students who can help, in one local campus community.
          </p>
          <LandingCta />
        </div>
        <ProductPreview />
      </section>

      {/* One product, four parts */}
      <section className="border-y border-line bg-surface" aria-labelledby="parts-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="parts-heading" className="text-3xl font-extrabold tracking-tight">One place for your campus life</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">Four parts of the same app. One profile, one campus, one community connecting them.</p>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, name: "Community", body: "Ask questions, find study groups, see what's happening on campus." },
              { icon: BookOpen, name: "Academic", body: "Notes, study guides, and tips for your courses, reviewed before they're public." },
              { icon: Compass, name: "Discover", body: "Food, campus resources, student marketplace, and local opportunities." },
              { icon: BedDouble, name: "Housing", body: "Rooms and roommates near campus, with privacy built into every post." },
            ].map(({ icon: Icon, name, body }) => (
              <article key={name} className="rounded-2xl border border-line bg-bg p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-on-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-3 text-lg font-bold">{name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
            <UserRoundCheck aria-hidden className="size-4" /> Everything you share adds to one profile.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="problem-heading">
        <h2 id="problem-heading" className="text-3xl font-extrabold tracking-tight">Right now it&apos;s everywhere</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">What students need already exists. It&apos;s just spread out.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <ul className="space-y-2" data-testid="fragments">
            {FRAGMENTS.map(({ need, now, icon: Icon }) => (
              <li key={need} className="flex items-start gap-3 rounded-2xl border border-dashed border-line bg-surface p-4">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-soft" />
                <span>
                  <span className="block font-bold">{need}</span>
                  <span className="block text-sm text-ink-soft">{now}</span>
                </span>
              </li>
            ))}
          </ul>
          <ArrowRight aria-hidden className="mx-auto size-10 rotate-90 text-brand lg:rotate-0" />
          <div className="rounded-3xl bg-brand p-8 text-on-brand">
            <p className="text-2xl font-extrabold">{APP_NAME} connects them.</p>
            <p className="mt-2 opacity-90">One campus community where each piece links to the rest: a course leads to its study group, a study guide to the student who wrote it.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-surface" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="how-heading" className="text-3xl font-extrabold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, body, icon: Icon }, i) => (
              <li key={title} className="rounded-2xl border border-line bg-bg p-5">
                <span className="flex items-center gap-2 text-sm font-bold text-brand">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand text-on-brand">{i + 1}</span>
                  <Icon aria-hidden className="size-4" />
                </span>
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="text-3xl font-extrabold tracking-tight">Built for trust</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">What each label means, plainly. Verified means a current student. It does not guarantee anyone&apos;s safety.</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map(({ title, body, icon: Icon }) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-5">
              <Icon aria-hidden className="size-6 text-brand" />
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="bg-brand text-on-brand" aria-labelledby="final-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 id="final-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Join your campus community.</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">Free for students at {SUPPORTED_CAMPUSES.map((c) => c.shortName).join(", ")}.</p>
          <Link href="/signup" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-on-brand px-6 font-semibold text-brand">
            Join your campus <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-ink-soft sm:px-6">
        <p>{APP_NAME} is a student-built hackathon project. Not an official college service.</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/privacy" className="font-semibold hover:text-ink">Privacy</Link>
          <Link href="/login" className="font-semibold hover:text-ink">Sign in</Link>
        </nav>
      </footer>
    </div>
  );
}
