"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PenLine, Plus } from "lucide-react";
import { CourseCard, IntegrityNote } from "@/components/academic/AcademicParts";
import { ResourceCard } from "@/components/academic/ResourceCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getAcademicCourses, getAcademicResources } from "@/services/academic";
import { getMyCourses } from "@/services/courses";

/** Academic home: search, campus courses, recently shared resources. Search lives in ?q= */
export function AcademicHome() {
  const { currentCampus, campuses, setCampus } = useCampus();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const myCourses = useAsync(() => getMyCourses(), []);
  const currentCourses = (myCourses.data ?? []).filter((c) => c.status === "current");
  const q = params.get("q") ?? "";

  const courses = useAsync(() => getAcademicCourses({ campusId: currentCampus.id, q: q || undefined, pageSize: 50 }), [currentCampus.id, q]);
  const resources = useAsync(
    () => getAcademicResources({ campusId: currentCampus.id, q: q || undefined, sort: q ? "helpful" : "newest", pageSize: q ? 20 : 3 }),
    [currentCampus.id, q],
  );
  const courseMap = new Map((courses.data?.items ?? []).map((c) => [c.id, c.code]));
  const loading = courses.loading || resources.loading;
  const failed = courses.error != null || resources.error != null;
  const noCoursesOnCampus = !q && courses.data && courses.data.total === 0;
  const noMatches = q && courses.data && resources.data && courses.data.total === 0 && resources.data.total === 0;
  const fallbackCampus = campuses.find((c) => c.id !== currentCampus.id && c.id === "chabot");

  function search(value: string) {
    router.replace(value ? `${pathname}?q=${encodeURIComponent(value)}` : pathname, { scroll: false });
  }

  return (
    <>
      <p className="text-sm font-semibold text-sage-ink">{currentCampus.name}</p>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Study help</h1>
        <Link href="/academic/mine" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-brand" data-testid="my-submissions-link">
          <PenLine aria-hidden className="size-4" /> My submissions
        </Link>
      </div>
      <p className="mb-4 text-ink-soft">Notes, study guides, and tips from students who already took your course.</p>

      <section aria-labelledby="my-courses-heading" className="mb-4 rounded-2xl border border-line bg-surface p-4" data-testid="my-courses-strip">
        <div className="flex items-center justify-between gap-2">
          <h2 id="my-courses-heading" className="font-bold">My courses</h2>
          <Link href="/academic/courses" className="inline-flex min-h-10 items-center text-sm font-semibold text-brand">
            Manage
          </Link>
        </div>
        {currentCourses.length === 0 ? (
          <p className="mt-1 text-sm text-ink-soft">Add what you&apos;re taking to see resources for it first.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {currentCourses.map((c) => (
              <li key={c.id}>
                <Link href={`/academic/${c.courseId}`} className="inline-flex min-h-10 items-center rounded-lg border border-brand/40 bg-brand/5 px-3 text-sm font-semibold text-brand">
                  {c.course.code}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/academic/courses/add" className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl border border-dashed border-brand/50 px-3 text-sm font-semibold text-brand" data-testid="academic-add-course">
          <Plus aria-hidden className="size-4" /> Add course
        </Link>
      </section>

      <SearchBar key={q} initialValue={q} label="Search courses and resources" placeholder="Course (MTH 1) or topic (derivatives)" onSearch={search} />

      <div className="mt-4" aria-live="polite">
        {loading && <LoadingList label="Loading courses" />}
        {failed && (
          <ErrorState
            onRetry={() => {
              courses.reload();
              resources.reload();
            }}
          />
        )}

        {!loading && !failed && noCoursesOnCampus && (
          <EmptyState
            title={`No courses yet at ${currentCampus.shortName}`}
            hint="Academic Exchange starts with Chabot College in this demo."
            action={
              fallbackCampus && (
                <button onClick={() => setCampus(fallbackCampus.id)} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                  Browse {fallbackCampus.shortName} courses
                </button>
              )
            }
          />
        )}

        {!loading && !failed && noMatches && (
          <EmptyState
            title={`No matches for “${q}”`}
            hint="Try a course code like MTH 1 or a topic like citations."
            action={
              <button onClick={() => search("")} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                Clear search
              </button>
            }
          />
        )}

        {!loading && !failed && !noCoursesOnCampus && !noMatches && (
          <>
            {courses.data && courses.data.items.length > 0 && (
              <section aria-labelledby="courses-heading">
                <h2 id="courses-heading" className="mb-2 font-bold">
                  {q ? "Matching courses" : `Courses at ${currentCampus.shortName}`}
                </h2>
                <div className="space-y-2" data-testid="course-list">
                  {courses.data.items.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            )}
            {resources.data && resources.data.items.length > 0 && (
              <section aria-labelledby="recent-heading" className="mt-6">
                <h2 id="recent-heading" className="mb-2 font-bold">
                  {q ? "Matching resources" : "Recently shared"}
                </h2>
                <div className="space-y-3" data-testid="resource-list">
                  {resources.data.items.map((r) => (
                    <ResourceCard key={r.id} resource={r} showCourseCode={courseMap.get(r.courseId)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <IntegrityNote />
      </div>
    </>
  );
}
