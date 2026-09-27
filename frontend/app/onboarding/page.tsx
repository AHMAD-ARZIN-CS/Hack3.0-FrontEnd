"use client";

/**
 * Progressive onboarding (D33): one short question per step. Only campus is required.
 * Answers are saved on the last step ("Enter my community"), so leaving early saves nothing.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, Clock, GraduationCap, MapPin } from "lucide-react";
import { FormError, inputCls, Logo } from "@/components/auth/AuthParts";
import { Chip } from "@/components/ui/Chip";
import { LoadingList } from "@/components/ui/States";
import { SUPPORTED_CAMPUSES } from "@/config/app";
import { ONBOARDING_NEEDS, ONBOARDING_STEPS, STUDENT_STANDINGS } from "@/config/onboarding";
import { INTEREST_TAGS } from "@/config/tags";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { AuthError, completeOnboarding } from "@/services/auth";
import { getCourses } from "@/services/courses";
import type { CampusId, StudentStanding } from "@/types/models";

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const { setCampus } = useCampus();
  const [step, setStep] = useState(0);
  const [campusId, setCampusId] = useState<CampusId | "">("");
  const [major, setMajor] = useState("");
  const [standing, setStanding] = useState<StudentStanding | "">("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courses = useAsync(() => (campusId ? getCourses({ campusId, pageSize: 50 }) : Promise.resolve(null)), [campusId]);
  const campus = SUPPORTED_CAMPUSES.find((c) => c.id === campusId);
  const firstName = session?.displayName.split(" ")[0] ?? "";

  async function finish() {
    if (!campusId) return;
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding({
        homeCampusId: campusId,
        major,
        standing: standing || undefined,
        currentCourseIds: courseIds,
        interests,
        needs,
      });
      setCampus(campusId);
      router.replace("/");
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Couldn't save. Try again.");
      setBusy(false);
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, ONBOARDING_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const primary = "min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-50";
  const secondary = "min-h-12 w-full rounded-xl border border-line bg-surface font-semibold";

  return (
    <div data-testid="onboarding" data-step={step}>
      <div className="flex items-center justify-between">
        <Logo />
        {step > 0 && step < 4 && (
          <button type="button" onClick={back} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand">
            <ArrowLeft aria-hidden className="size-4" /> Back
          </button>
        )}
      </div>

      <ol aria-label="Onboarding progress" className="mt-6 grid grid-cols-5 gap-1.5">
        {ONBOARDING_STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            <span className={`mt-1 block text-[11px] font-semibold ${i === step ? "text-brand" : "text-ink-soft"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="mt-6" aria-labelledby="s-campus">
          <h1 id="s-campus" className="text-2xl font-extrabold">Hi {firstName}. Which campus is yours?</h1>
          <p className="mt-1 text-ink-soft">You&apos;ll see people, posts, and resources from this campus first. You can switch any time.</p>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Campus">
            {SUPPORTED_CAMPUSES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={campusId === c.id}
                onClick={() => {
                  setCampusId(c.id);
                  setCourseIds([]);
                }}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-4 text-left ${campusId === c.id ? "border-brand bg-brand/5" : "border-line bg-surface"}`}
                data-testid={`campus-${c.id}`}
              >
                <MapPin aria-hidden className={`size-5 shrink-0 ${campusId === c.id ? "text-brand" : "text-ink-soft"}`} />
                <span>
                  <span className="block font-bold">{c.name}</span>
                  <span className="block text-sm text-ink-soft">{c.city}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" disabled={!campusId} onClick={next} className={`${primary} mt-5`} data-testid="next">
            Continue
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-6" aria-labelledby="s-about">
          <h1 id="s-about" className="text-2xl font-extrabold">About you</h1>
          <p className="mt-1 text-ink-soft">Both are optional. They help classmates find you.</p>
          <label htmlFor="major" className="mt-4 mb-1 block font-semibold">
            Major or field of study
          </label>
          <input id="major" value={major} maxLength={80} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" className={inputCls} />
          <fieldset className="mt-4">
            <legend className="mb-2 font-semibold">Where are you in school?</legend>
            <div className="grid grid-cols-2 gap-2">
              {STUDENT_STANDINGS.map((s) => (
                <label key={s.id} className={`flex cursor-pointer flex-col rounded-xl border p-3 ${standing === s.id ? "border-brand bg-brand/5" : "border-line bg-surface"}`}>
                  <input type="radio" name="standing" value={s.id} checked={standing === s.id} onChange={() => setStanding(s.id)} className="sr-only" />
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-xs text-ink-soft">{s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" onClick={next} className={`${primary} mt-5`} data-testid="next">
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6" aria-labelledby="s-courses">
          <h1 id="s-courses" className="text-2xl font-extrabold">What are you taking?</h1>
          <p className="mt-1 text-ink-soft">We&apos;ll show notes, tips, and study groups for these courses.</p>
          <div className="mt-4">
            {courses.loading && <LoadingList count={2} label="Loading courses" />}
            {courses.data && courses.data.items.length === 0 && (
              <p className="rounded-xl border border-dashed border-line p-3 text-sm text-ink-soft" data-testid="no-courses">
                The course list for {campus?.shortName} isn&apos;t in East Bay Link yet. You can add courses later from your profile.
              </p>
            )}
            {courses.data && courses.data.items.length > 0 && (
              <ul className="space-y-2" data-testid="course-options">
                {courses.data.items.map((c) => (
                  <li key={c.id}>
                    <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${courseIds.includes(c.id) ? "border-brand bg-brand/5" : "border-line bg-surface"}`}>
                      <input type="checkbox" checked={courseIds.includes(c.id)} onChange={() => setCourseIds(toggle(courseIds, c.id))} className="size-4 accent-brand" />
                      <GraduationCap aria-hidden className="size-4 shrink-0 text-brand" />
                      <span>
                        <span className="font-semibold">{c.code}</span> <span className="text-ink-soft">{c.title}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setCourseIds([]); next(); }} className={secondary} data-testid="skip">
              Skip for now
            </button>
            <button type="button" onClick={next} className={primary} data-testid="next">
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6" aria-labelledby="s-interests">
          <h1 id="s-interests" className="text-2xl font-extrabold">What are you into?</h1>
          <p className="mt-1 text-ink-soft">Pick a few. Shown on your profile so people with the same interests can find you.</p>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="interest-options">
            {INTEREST_TAGS.map((t) => (
              <Chip key={t.id} selected={interests.includes(t.id)} onClick={() => setInterests(toggle(interests, t.id))}>
                {t.label}
              </Chip>
            ))}
          </div>
          <h2 className="mt-6 text-lg font-bold">What could help right now?</h2>
          <p className="text-sm text-ink-soft">Only you see this. We use it to put the right shortcuts on your Home.</p>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="need-options">
            {ONBOARDING_NEEDS.map((n) => (
              <Chip key={n.id} selected={needs.includes(n.id)} onClick={() => setNeeds(toggle(needs, n.id))}>
                {n.label}
              </Chip>
            ))}
          </div>
          <button type="button" onClick={next} className={`${primary} mt-6`} data-testid="next">
            Continue
          </button>
        </section>
      )}

      {step === 4 && campus && (
        <section className="mt-6" aria-labelledby="s-welcome" data-testid="welcome-step">
          <div className="rounded-2xl bg-brand p-6 text-on-brand">
            <CheckCircle2 aria-hidden className="size-10" />
            <h1 id="s-welcome" className="mt-3 text-3xl font-extrabold">Welcome to {campus.shortName}, {firstName}</h1>
            <p className="mt-1 flex items-center gap-1.5 opacity-90">
              <MapPin aria-hidden className="size-4" /> {campus.name}
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
              <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
              <span><span className="font-semibold">Account ready.</span> Your email is confirmed.</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3" data-testid="student-verification-status">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
              <span>
                <span className="font-semibold">Student verification: {session?.studentVerification === "verified" ? "verified" : "pending"}.</span> Signing in doesn&apos;t make you
                verified. Your profile shows &quot;Verified student&quot; only after your enrollment is confirmed.
              </span>
            </li>
            {courseIds.length + interests.length > 0 && (
              <li className="rounded-xl border border-line bg-surface p-3">
                {courseIds.length} course{courseIds.length === 1 ? "" : "s"} · {interests.length} interest{interests.length === 1 ? "" : "s"} added to your profile
              </li>
            )}
          </ul>
          <FormError message={error} />
          <button type="button" onClick={finish} disabled={busy} className={`${primary} mt-5`} data-testid="enter-community">
            {busy ? "Setting up…" : "Enter my community"}
          </button>
          <button type="button" onClick={back} className="mt-2 min-h-10 w-full text-sm font-semibold text-brand">
            Change my answers
          </button>
        </section>
      )}
    </div>
  );
}
