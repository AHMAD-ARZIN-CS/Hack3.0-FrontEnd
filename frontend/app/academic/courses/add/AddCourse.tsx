"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Clock, MonitorSmartphone, Plus } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { MODALITY_LABELS, SECTION_CODE_LABELS } from "@/config/academic";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { addUserCourse, CourseMembershipError, getMyCourses, getTerms, searchSections } from "@/services/courses";
import type { CourseSection } from "@/types/models";

/** Add Course: term (current preselected) → search → pick a section → Added to My Courses. No forms. */
export function AddCourse() {
  const { currentCampus } = useCampus();
  const terms = useAsync(() => getTerms(currentCampus.id), [currentCampus.id]);
  const [termChoice, setTermChoice] = useState<string | null>(null);
  const termId = termChoice ?? terms.data?.[0]?.id ?? "";
  const [q, setQ] = useState("");
  const results = useAsync(() => (termId ? searchSections({ campusId: currentCampus.id, termId, q }) : Promise.resolve([])), [currentCampus.id, termId, q]);
  const mine = useAsync(() => getMyCourses(), []);
  const [added, setAdded] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sectionLabel = SECTION_CODE_LABELS[currentCampus.id] ?? "Section";
  const mySectionIds = new Set((mine.data ?? []).map((c) => c.sectionId).filter(Boolean));
  const myCourseIds = new Set((mine.data ?? []).filter((c) => c.status === "current").map((c) => c.courseId));

  async function add(key: string, input: Parameters<typeof addUserCourse>[0]) {
    setBusyId(key);
    setError(null);
    try {
      await addUserCourse(input);
      setAdded((a) => ({ ...a, [key]: true }));
    } catch (e) {
      setError(e instanceof CourseMembershipError ? e.message : "Couldn't add the course. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const addButton = (key: string, done: boolean, onAdd: () => void, label = "Add course") =>
    done ? (
      <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-success/10 px-3 text-sm font-bold text-success" data-testid="added">
        <Check aria-hidden className="size-4" /> Added to My Courses
      </span>
    ) : (
      <button
        type="button"
        onClick={onAdd}
        disabled={busyId === key}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-on-brand disabled:opacity-60"
        data-testid="add-course"
      >
        <Plus aria-hidden className="size-4" /> {busyId === key ? "Adding…" : label}
      </button>
    );

  return (
    <>
      <Link href="/academic/courses" className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> My courses
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Add a course</h1>
      <p className="mt-1 text-ink-soft">Search {currentCampus.shortName} classes by course code, title, or {sectionLabel.toLowerCase()} code.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-[180px_1fr]">
        <label className="text-xs font-semibold text-ink-soft">
          Term
          <select
            aria-label="Term"
            value={termId}
            onChange={(e) => setTermChoice(e.target.value)}
            className="mt-0.5 min-h-12 w-full rounded-xl border border-line bg-surface px-2 text-base font-semibold"
          >
            {(terms.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:pt-4">
          <SearchBar label="Search classes" placeholder="MTH 1, Calculus, or a section code" onSearch={setQ} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/5 p-3 text-sm text-danger" data-testid="add-error">
          {error}
        </p>
      )}

      <div className="mt-4" aria-live="polite">
        {(terms.loading || results.loading) && <LoadingList count={2} label="Searching classes" />}
        {results.error != null && <ErrorState onRetry={results.reload} />}
        {results.data && results.data.length === 0 && (
          <EmptyState
            title={q ? "No classes match that search" : `No class list for ${currentCampus.shortName} yet`}
            hint={q ? "Try a course code like MTH 1 or a word from the title." : "Course data for this campus hasn't been added. Check back later."}
          />
        )}
        {results.data && results.data.length > 0 && (
          <ul className="space-y-3" data-testid="section-results">
            {results.data.map(({ course, sections }) => (
              <li key={course.id} className="rounded-2xl border border-line bg-surface p-4" data-course={course.id}>
                <p className="font-bold">
                  {course.code} <span className="font-normal text-ink-soft">· {course.title}</span>
                </p>
                {sections.length === 0 ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-ink-soft">No section list for this term yet.</p>
                    {addButton(course.id, !!added[course.id] || myCourseIds.has(course.id), () => add(course.id, { courseId: course.id, termId }))}
                  </div>
                ) : (
                  <ul className="mt-2 divide-y divide-line">
                    {sections.map((s: CourseSection) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-section={s.id}>
                        <div className="min-w-0 text-sm">
                          <p className="font-semibold">
                            {sectionLabel} {s.sectionCode}
                            {!s.sectionCodeOfficial && <span className="ml-1.5 rounded bg-warn/15 px-1.5 py-0.5 text-xs font-semibold">Demo</span>}
                          </p>
                          {s.meetingInfo && (
                            <p className="mt-0.5 flex items-center gap-1 text-ink-soft">
                              <Clock aria-hidden className="size-3.5" /> {s.meetingInfo}
                            </p>
                          )}
                          {s.modality && (
                            <p className="flex items-center gap-1 text-ink-soft">
                              <MonitorSmartphone aria-hidden className="size-3.5" /> {MODALITY_LABELS[s.modality]}
                            </p>
                          )}
                          {s.instructorName && <p className="text-ink-soft">{s.instructorName}</p>}
                        </div>
                        {addButton(s.id, !!added[s.id] || mySectionIds.has(s.id), () => add(s.id, { sectionId: s.id }))}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-xs text-ink-soft">Demo schedule: section codes and meeting times are samples, not the official class schedule.</p>
    </>
  );
}
