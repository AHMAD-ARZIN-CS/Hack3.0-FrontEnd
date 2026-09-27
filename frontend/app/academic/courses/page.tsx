"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Plus, X } from "lucide-react";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { MODALITY_LABELS, SECTION_CODE_LABELS } from "@/config/academic";
import { useAsync } from "@/hooks/useAsync";
import { getMyCourses, removeUserCourse } from "@/services/courses";

/** My courses. Sections and meeting times are private: only you see them here. */
export default function MyCoursesPage() {
  const mine = useAsync(() => getMyCourses(), []);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const current = (mine.data ?? []).filter((c) => c.status === "current" && !removed.has(c.courseId));
  const past = (mine.data ?? []).filter((c) => c.status === "past");

  return (
    <>
      <Link href="/academic" className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Academic
      </Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">My courses</h1>
        <Link href="/academic/courses/add" className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-on-brand" data-testid="add-course-link">
          <Plus aria-hidden className="size-4" /> Add course
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Your courses shape what you see in Academic. Sections and times stay private.</p>

      <div className="mt-4">
        {mine.loading && <LoadingList count={2} label="Loading your courses" />}
        {mine.error != null && <ErrorState onRetry={mine.reload} />}
        {mine.data && current.length === 0 && (
          <EmptyState
            title="No courses yet"
            hint="Add what you're taking to see notes, tips, and study groups for it."
            action={
              <Link href="/academic/courses/add" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
                Add a course
              </Link>
            }
          />
        )}
        {current.length > 0 && (
          <ul className="space-y-2" data-testid="my-courses">
            {current.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3" data-my-course={c.courseId}>
                <BookOpen aria-hidden className="size-5 shrink-0 text-brand" />
                <Link href={`/academic/${c.courseId}`} className="min-w-0 flex-1">
                  <span className="block font-bold">
                    {c.course.code} <span className="font-normal text-ink-soft">· {c.course.title}</span>
                  </span>
                  {c.section ? (
                    <span className="block text-sm text-ink-soft">
                      {SECTION_CODE_LABELS[c.course.campusId] ?? "Section"} {c.section.sectionCode}
                      {c.section.modality ? ` · ${MODALITY_LABELS[c.section.modality]}` : ""}
                      {c.section.meetingInfo ? ` · ${c.section.meetingInfo}` : ""}
                    </span>
                  ) : (
                    <span className="block text-sm text-ink-soft">No section chosen</span>
                  )}
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${c.course.code}`}
                  onClick={async () => {
                    await removeUserCourse(c.courseId);
                    setRemoved((r) => new Set(r).add(c.courseId));
                  }}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-muted"
                  data-testid="remove-course"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {past.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-ink-soft">Previously taken</h2>
            <ul className="space-y-2">
              {past.map((c) => (
                <li key={c.id}>
                  <Link href={`/academic/${c.courseId}`} className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-surface px-3">
                    <span>
                      <span className="font-semibold">{c.course.code}</span> <span className="text-ink-soft">{c.course.title}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
