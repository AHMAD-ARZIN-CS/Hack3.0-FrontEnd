"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LinkedEntityCard } from "@/components/community/LinkedEntityCard";
import { Chip } from "@/components/ui/Chip";
import { COMMUNITY_LIMITS, POST_TYPES } from "@/config/community";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { createPost, getLinkableResources, ValidationError } from "@/services/community";
import { getCourses } from "@/services/courses";
import { getCurrentUser } from "@/services/user";
import type { PostType } from "@/types/models";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-brand";

export default function NewPostPage() {
  const router = useRouter();
  const { currentCampus } = useCampus();
  const me = useAsync(() => getCurrentUser(), []);
  const courses = useAsync(() => getCourses({ campusId: currentCampus.id, pageSize: 50 }), [currentCampus.id]);
  const linkable = useAsync(() => getLinkableResources(), []);

  const [postType, setPostType] = useState<PostType>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tags, setTags] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [recurring, setRecurring] = useState("");
  const [linkedId, setLinkedId] = useState("");
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const role = me.data?.role ?? "student";
  const types = POST_TYPES.filter((t) => t.allowedRoles.includes(role));
  const type = POST_TYPES.find((t) => t.id === postType)!;
  const selectedLink = linkable.data?.find((l) => l.id === linkedId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const post = await createPost({
        campusId: currentCampus.id,
        postType,
        title: title || undefined,
        body,
        courseId: courseId || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        meeting: type.needsMeeting && startsAt ? { startsAt: new Date(startsAt).toISOString(), locationName: location, recurring: recurring || undefined } : undefined,
        linkedEntity: type.needsLink && linkedId ? { type: "academic-resource", id: linkedId } : undefined,
      });
      router.push(`/community/${post.id}`);
    } catch (err) {
      if (err instanceof ValidationError) setError({ field: err.field, message: err.message });
      else setError({ field: "form", message: "Couldn't post. Try again." });
      setSubmitting(false);
    }
  }

  const fieldError = (field: string) =>
    error?.field === field ? (
      <p role="alert" className="mt-1 text-sm text-danger" data-testid={`error-${field}`}>
        {error.message}
      </p>
    ) : null;

  return (
    <>
      <Link href="/community" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Community
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">New post</h1>
      <p className="mb-4 text-sm text-ink-soft">
        Posting to the <span className="font-semibold text-ink">{currentCampus.shortName}</span> community as{" "}
        <span className="font-semibold text-ink">{me.data?.displayName ?? "…"}</span>.
      </p>

      <form onSubmit={submit} className="space-y-5" data-testid="new-post-form">
        <fieldset>
          <legend className="mb-2 font-semibold">What kind of post?</legend>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <Chip key={t.id} selected={postType === t.id} onClick={() => setPostType(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{type.prompt}</p>
          {fieldError("postType")}
        </fieldset>

        <div>
          <label htmlFor="title" className="mb-1 block font-semibold">
            Title <span className="font-normal text-ink-soft">(optional for questions)</span>
          </label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={COMMUNITY_LIMITS.titleMax} className={inputCls} />
          {fieldError("title")}
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block font-semibold">
            {postType === "question" ? "Your question" : "Details"}
          </label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={COMMUNITY_LIMITS.bodyMax} className={inputCls} />
          <p className="mt-1 text-xs text-ink-soft">
            {body.trim().length}/{COMMUNITY_LIMITS.bodyMax}. Don&apos;t share phone numbers, addresses, or exam answers.
          </p>
          {fieldError("body")}
        </div>

        {type.needsLink && (
          <fieldset data-testid="link-picker">
            <legend className="mb-2 font-semibold">What are you sharing?</legend>
            {linkable.data && linkable.data.length === 0 && (
              <p className="text-sm text-ink-soft">You haven&apos;t shared any study resources yet.</p>
            )}
            <div className="space-y-1">
              {linkable.data?.map((l) => (
                <label key={l.id} className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm">
                  <input type="radio" name="linked" value={l.id} checked={linkedId === l.id} onChange={() => setLinkedId(l.id)} className="size-4 accent-brand" />
                  <span>
                    <span className="font-semibold">{l.title}</span>
                    <span className="block text-xs text-ink-soft">{l.subtitle}</span>
                  </span>
                </label>
              ))}
            </div>
            {selectedLink && <LinkedEntityCard preview={selectedLink} />}
            {fieldError("linkedEntity")}
          </fieldset>
        )}

        {type.needsMeeting && (
          <fieldset className="space-y-3" data-testid="meeting-fields">
            <legend className="mb-1 font-semibold">When and where</legend>
            <div>
              <label htmlFor="startsAt" className="mb-1 block text-sm">
                Date and time
              </label>
              <input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-sm">
                Place (campus spot or &quot;Online&quot;)
              </label>
              <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="recurring" className="mb-1 block text-sm">
                Repeats <span className="text-ink-soft">(optional, e.g. &quot;Every Thursday&quot;)</span>
              </label>
              <input id="recurring" value={recurring} onChange={(e) => setRecurring(e.target.value)} className={inputCls} />
            </div>
            {fieldError("meeting")}
          </fieldset>
        )}

        <div>
          <label htmlFor="course" className="mb-1 block font-semibold">
            Course <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
            <option value="">No course</option>
            {courses.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="mb-1 block font-semibold">
            Topics <span className="font-normal text-ink-soft">(optional, up to 3, comma separated)</span>
          </label>
          <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="transfer, midterms" className={inputCls} />
          {fieldError("tags")}
        </div>

        {error?.field === "form" && fieldError("form")}

        <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-50">
          {submitting ? "Posting…" : `Post to ${currentCampus.shortName}`}
        </button>
        <p className="text-xs text-ink-soft">
          Be kind and useful. Posts can be reported and removed. File attachments are coming later.
        </p>
      </form>
    </>
  );
}
