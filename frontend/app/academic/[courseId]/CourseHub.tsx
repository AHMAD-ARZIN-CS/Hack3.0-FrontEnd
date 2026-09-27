"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, ExternalLink, PenLine } from "lucide-react";
import { IntegrityNote } from "@/components/academic/AcademicParts";
import { ResourceCard } from "@/components/academic/ResourceCard";
import { TipCard } from "@/components/academic/TipCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/States";
import { FEATURES } from "@/config/app";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getAcademicCourse, getAcademicResources, getTips } from "@/services/academic";
import { NotFoundError } from "@/services/mock";
import { getCurrentUser } from "@/services/user";
import type { AcademicResourceQuery, AcademicResourceType } from "@/types/models";

type Show = "all" | AcademicResourceType | "tips" | "free" | "paid";

const FILTERS: { id: Show; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "study-guide", label: "Study guides" },
  { id: "practice", label: "Practice" },
  { id: "study-strategy", label: "Strategies" },
  { id: "tips", label: "Tips" },
  { id: "free", label: "Free" },
  ...(FEATURES.paidAcademic ? [{ id: "paid" as const, label: "Paid" }] : []),
];

/** Course Hub: resources + tips from previous students. Filters: ?show=notes|…|tips|free, ?sort=newest */
export function CourseHub() {
  const { courseId } = useParams<{ courseId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { currentCampus, campuses, setCampus } = useCampus();

  const showParam = params.get("show") as Show | null;
  const show: Show = FILTERS.some((f) => f.id === showParam) ? (showParam as Show) : "all";
  const sort = params.get("sort") === "newest" ? "newest" : "helpful";

  const course = useAsync(() => getAcademicCourse(courseId), [courseId]);
  const me = useAsync(() => getCurrentUser(), []);

  const resourceQuery: AcademicResourceQuery = {
    campusId: course.data?.campusId ?? currentCampus.id,
    courseId,
    sort,
    pageSize: 50,
    ...(show === "free" ? { freeOnly: true } : {}),
    ...(show === "paid" ? { paidOnly: true } : {}),
    ...(show !== "all" && show !== "tips" && show !== "free" && show !== "paid" ? { resourceType: show } : {}),
  };
  const wantResources = show !== "tips";
  const wantTips = show === "all" || show === "tips";
  const resources = useAsync(
    () => (wantResources && course.data ? getAcademicResources(resourceQuery) : Promise.resolve(null)),
    [resourceQuery, wantResources, !!course.data],
  );
  const tips = useAsync(() => (wantTips ? getTips({ courseId, sort, pageSize: 50 }) : Promise.resolve(null)), [courseId, sort, wantTips]);

  function update(next: { show?: Show; sort?: string }) {
    const q = new URLSearchParams(params.toString());
    if (next.show === "all") q.delete("show");
    else if (next.show) q.set("show", next.show);
    if (next.sort === "helpful") q.delete("sort");
    else if (next.sort) q.set("sort", next.sort);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (course.loading) return <LoadingList count={3} label="Loading course" />;
  if (course.error instanceof NotFoundError)
    return (
      <EmptyState
        title="Course not found"
        action={
          <Link href="/academic" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
            Back to Study help
          </Link>
        }
      />
    );
  if (course.error != null || !course.data) return <ErrorState onRetry={course.reload} />;

  const c = course.data;
  const courseCampus = campuses.find((x) => x.id === c.campusId);
  const otherCampus = c.campusId !== currentCampus.id;
  const filterLabel = FILTERS.find((f) => f.id === show)?.label.toLowerCase();
  const nothing =
    resources.data !== undefined && tips.data !== undefined && (resources.data?.total ?? 0) === 0 && (tips.data?.total ?? 0) === 0;

  return (
    <>
      <Link href="/academic" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Study help
      </Link>

      {otherCampus && courseCampus && (
        <p role="status" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warn/15 p-3 text-sm">
          This course is at {courseCampus.name}. You&apos;re browsing {currentCampus.shortName}.
          <button onClick={() => setCampus(courseCampus.id)} className="min-h-10 rounded-lg bg-surface px-3 font-semibold">
            Switch to {courseCampus.shortName}
          </button>
        </p>
      )}

      <header className="rounded-2xl border border-line bg-surface p-4" data-testid="course-header">
        <p className="text-sm font-semibold text-brand">{courseCampus?.name}</p>
        <h1 className="text-2xl font-extrabold leading-tight">{c.code}</h1>
        <p className="text-lg">{c.title}</p>
        {c.catalogVerified && (
          <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs text-ink-soft">
            <BadgeCheck aria-hidden className="size-3.5 text-success" />
            Course code and title checked against the college catalog.
            {c.catalogUrl && (
              <a href={c.catalogUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-brand underline">
                Catalog <ExternalLink aria-hidden className="size-3" />
              </a>
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-ink-soft">
          {c.resourceCount ?? 0} resources · {c.tipCount ?? 0} tips from previous students
        </p>
        <Link
          href={`/academic/new?courseId=${c.id}`}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/50 text-sm font-semibold text-brand"
          data-testid="share-resource"
        >
          <PenLine aria-hidden className="size-4" /> Share a resource for {c.code}
        </Link>
      </header>

      <div className="mt-3">
        <IntegrityNote />
      </div>

      <div role="group" aria-label="Filter" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {FILTERS.map((f) => (
          <Chip key={f.id} selected={show === f.id} onClick={() => update({ show: f.id })}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div role="group" aria-label="Sort" className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-ink-soft">Sort:</span>
        {(["helpful", "newest"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sort === s}
            onClick={() => update({ sort: s })}
            className={`min-h-9 rounded-lg px-2.5 font-semibold ${sort === s ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-muted"}`}
          >
            {s === "helpful" ? "Most helpful" : "Newest"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6" aria-live="polite">
        {(resources.loading || tips.loading) && <LoadingList count={2} label="Loading resources" />}
        {(resources.error != null || tips.error != null) && (
          <ErrorState
            onRetry={() => {
              resources.reload();
              tips.reload();
            }}
          />
        )}

        {!resources.loading && !tips.loading && nothing && (
          <EmptyState
            title={show === "all" ? `No resources have been shared for ${c.code} yet` : `No ${filterLabel} for ${c.code} yet`}
            hint={show === "all" ? "Took this course? Your notes or study guide could help the next student. Everything is reviewed first." : "Try another filter."}
            action={
              show !== "all" ? (
                <button onClick={() => update({ show: "all" })} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">
                  Show all
                </button>
              ) : (
                <Link href={`/academic/new?courseId=${c.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
                  Share a resource
                </Link>
              )
            }
          />
        )}

        {resources.data && resources.data.items.length > 0 && (
          <section aria-labelledby="res-heading">
            <h2 id="res-heading" className="mb-2 font-bold">
              Resources from previous students
            </h2>
            <div className="space-y-3" data-testid="resource-list">
              {resources.data.items.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          </section>
        )}

        {tips.data && tips.data.items.length > 0 && (
          <section aria-labelledby="tips-heading">
            <h2 id="tips-heading" className="mb-2 font-bold">
              Tips for succeeding in {c.code}
            </h2>
            <div className="space-y-3" data-testid="tip-list">
              {tips.data.items.map((t) => (
                <TipCard key={t.id} tip={t} viewerId={me.data?.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
