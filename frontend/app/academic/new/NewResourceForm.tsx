"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FilePlus2, ShieldCheck, X } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { LoadingList } from "@/components/ui/States";
import { ACADEMIC_LIMITS, INTEGRITY_RULES, MODERATOR_ROLE_LABEL, RESOURCE_TYPE_LABELS } from "@/config/academic";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { AcademicValidationError, getAcademicCourses, submitAcademicResource } from "@/services/academic";
import type { AcademicResourceType, SubmissionDeclaration } from "@/types/models";

const inputCls = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-brand";
const TYPES = Object.keys(RESOURCE_TYPE_LABELS) as AcademicResourceType[];

/** Upload → Pending review (Q16). Nothing here is public until a moderator approves it. */
export function NewResourceForm() {
  const router = useRouter();
  const { currentCampus } = useCampus();
  const preset = useSearchParams().get("courseId") ?? "";
  const courses = useAsync(() => getAcademicCourses({ campusId: currentCampus.id, pageSize: 50 }), [currentCampus.id]);

  const [courseId, setCourseId] = useState(preset);
  const [type, setType] = useState<AcademicResourceType>("study-guide");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [decl, setDecl] = useState({ original: false, noExam: false, noCopyright: false });
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await submitAcademicResource(
        { courseId, resourceType: type, title, description, body, tags: tags.split(","), access: { model: "free" } },
        // Unchecked boxes pass false on purpose: the service rejects unless all three are true.
        { original: decl.original, noExamMaterial: decl.noExam, noCopyrightedOrInstructorMaterial: decl.noCopyright } as unknown as SubmissionDeclaration,
        files,
      );
      router.push(`/academic/mine?submitted=${r.id}`);
    } catch (err) {
      setError(err instanceof AcademicValidationError ? { field: err.field, message: err.message } : { field: "form", message: "Couldn't submit. Try again." });
      setBusy(false);
    }
  }

  const fieldError = (f: string) =>
    error?.field === f ? (
      <p role="alert" className="mt-1 text-sm text-danger" data-testid={`error-${f}`}>
        {error.message}
      </p>
    ) : null;

  return (
    <>
      <Link href="/academic" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Academic
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Share a resource</h1>
      <p className="mt-1 text-sm text-ink-soft">
        A {MODERATOR_ROLE_LABEL} reviews every upload before other students see it.
      </p>

      <aside className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm" data-testid="integrity-rules">
        <p className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck aria-hidden className="size-4 text-brand" /> {INTEGRITY_RULES.short}
        </p>
      </aside>

      {courses.loading ? (
        <LoadingList count={2} label="Loading courses" />
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-5" data-testid="resource-form">
          <div>
            <label htmlFor="r-course" className="mb-1 block font-semibold">Course</label>
            <select id="r-course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
              <option value="">Choose a course…</option>
              {(courses.data?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.title}</option>
              ))}
            </select>
            {courses.data?.items.length === 0 && <p className="mt-1 text-sm text-ink-soft">No courses for {currentCampus.shortName} yet.</p>}
            {fieldError("courseId")}
          </div>

          <fieldset>
            <legend className="mb-2 font-semibold">Type</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip key={t} selected={type === t} onClick={() => setType(t)}>
                  {RESOURCE_TYPE_LABELS[t].one}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="r-title" className="mb-1 block font-semibold">Title</label>
            <input id="r-title" value={title} maxLength={ACADEMIC_LIMITS.titleMax} onChange={(e) => setTitle(e.target.value)} placeholder="Derivative rules one-page study guide" className={inputCls} />
            {fieldError("title")}
          </div>

          <div>
            <label htmlFor="r-desc" className="mb-1 block font-semibold">What&apos;s inside?</label>
            <textarea id="r-desc" rows={3} value={description} maxLength={ACADEMIC_LIMITS.descriptionMax} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            {fieldError("description")}
          </div>

          <div>
            <label htmlFor="r-body" className="mb-1 block font-semibold">
              Content as text <span className="font-normal text-ink-soft">(or attach a file below)</span>
            </label>
            <textarea id="r-body" rows={5} value={body} maxLength={ACADEMIC_LIMITS.bodyMax} onChange={(e) => setBody(e.target.value)} className={inputCls} />
            {fieldError("body")}
          </div>

          <div>
            <p className="mb-1 font-semibold">
              Files <span className="font-normal text-ink-soft">(PDF, PNG, JPG · up to {ACADEMIC_LIMITS.filesMax})</span>
            </p>
            {files.length > 0 && (
              <ul className="mb-2 space-y-1" data-testid="file-list">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="flex size-9 items-center justify-center">
                      <X aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-semibold text-brand">
              <FilePlus2 aria-hidden className="size-4" /> Attach files
              <input
                type="file"
                multiple
                accept={ACADEMIC_LIMITS.fileTypes.join(",")}
                className="sr-only"
                data-testid="file-input"
                onChange={(e) => {
                  setFiles([...files, ...Array.from(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </label>
            {fieldError("files")}
          </div>

          <div>
            <label htmlFor="r-tags" className="mb-1 block font-semibold">
              Topics <span className="font-normal text-ink-soft">(optional, comma separated)</span>
            </label>
            <input id="r-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="derivatives, midterm 1" className={inputCls} />
          </div>

          <fieldset className="space-y-2 rounded-xl border border-line bg-surface p-3" data-testid="declaration">
            <legend className="px-1 font-semibold">Before you submit</legend>
            {(
              [
                ["original", "I made this myself."],
                ["noExam", "It has no exams, quizzes, answer keys, or graded work."],
                ["noCopyright", "It has no copyrighted textbook pages or instructor slides."],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex min-h-10 items-start gap-2 text-sm">
                <input type="checkbox" checked={decl[k]} onChange={(e) => setDecl({ ...decl, [k]: e.target.checked })} className="mt-0.5 size-4 accent-brand" data-testid={`decl-${k}`} />
                {label}
              </label>
            ))}
            {fieldError("declaration")}
          </fieldset>

          {fieldError("form")}
          {fieldError("access")}
          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60" data-testid="submit-resource">
            {busy ? "Submitting…" : "Submit for review"}
          </button>
          <p className="text-xs text-ink-soft">Free for everyone. {INTEGRITY_RULES.long[2]}</p>
        </form>
      )}
    </>
  );
}
