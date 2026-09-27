"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { ITEM_CONDITIONS, LISTING_CATEGORIES, MARKETPLACE_COPY, MARKETPLACE_LIMITS } from "@/config/marketplace";
import { useCampus } from "@/context/CampusContext";
import { createListing, MarketplaceValidationError } from "@/services/marketplace";
import type { ItemCondition, ListingCategory } from "@/types/models";

const inputCls = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-brand";

/** Physical items only. No contact info, address, shipping, or payment fields (D31). */
export function NewListingForm() {
  const router = useRouter();
  const { currentCampus } = useCampus();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory | "">("");
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [description, setDescription] = useState("");
  const [free, setFree] = useState(false);
  const [price, setPrice] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [isbn, setIsbn] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showOnProfile, setShowOnProfile] = useState(false);
  const [error, setError] = useState<{ field: string; message: string; href?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!free && price.trim() === "") {
      setError({ field: "price", message: "Enter a price, or choose Free." });
      return;
    }
    setSubmitting(true);
    try {
      const listing = await createListing(
        {
          campusId: currentCampus.id,
          title,
          category: category as ListingCategory,
          condition: condition as ItemCondition,
          description,
          priceCents: free ? 0 : Math.round(Number(price) * 100),
          courseCode: category === "textbook" || category === "supplies" ? courseCode : undefined,
          isbn: category === "textbook" ? isbn : undefined,
          profileVisibility: showOnProfile ? "public" : "hidden",
        },
        files,
      );
      router.push(`/marketplace/${listing.id}?posted=1`);
    } catch (err) {
      setError(
        err instanceof MarketplaceValidationError
          ? { field: err.field, message: err.message, href: err.href }
          : { field: "form", message: "Couldn't list this. Try again." },
      );
      setSubmitting(false);
    }
  }

  const fieldError = (f: string) =>
    error?.field === f ? (
      <p role="alert" className="mt-1 text-sm text-danger" data-testid={`error-${f}`}>
        {error.message}{" "}
        {error.href && (
          <Link href={error.href} className="font-semibold underline" data-testid="error-redirect">
            Go there
          </Link>
        )}
      </p>
    ) : null;

  return (
    <>
      <Link href="/marketplace" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Marketplace
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">List an item</h1>
      <p className="mb-4 text-sm text-ink-soft">
        Visible to students near {currentCampus.shortName}. Physical items only. Notes go in Academic, rooms in Housing.
      </p>

      <form onSubmit={submit} className="space-y-5" data-testid="listing-form" noValidate>
        <div>
          <label htmlFor="l-title" className="mb-1 block font-semibold">Title</label>
          <input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MARKETPLACE_LIMITS.titleMax} className={inputCls} placeholder="Graphing calculator" />
          {fieldError("title")}
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">Category</legend>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_CATEGORIES.map((c) => (
              <label key={c.id} className={`flex cursor-pointer flex-col rounded-xl border p-3 ${category === c.id ? "border-brand bg-brand/5" : "border-line bg-surface"}`}>
                <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} className="sr-only" />
                <span className="font-semibold">{c.label}</span>
                <span className="text-xs text-ink-soft">{c.hint}</span>
              </label>
            ))}
          </div>
          {fieldError("category")}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="l-condition" className="mb-1 block font-semibold">Condition</label>
            <select id="l-condition" value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition | "")} className={inputCls}>
              <option value="">Choose…</option>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {fieldError("condition")}
          </div>
          <div>
            <label htmlFor="l-price" className="mb-1 block font-semibold">Price ($)</label>
            <input
              id="l-price"
              type="number"
              inputMode="decimal"
              min={0}
              max={MARKETPLACE_LIMITS.priceMaxCents / 100}
              step="0.01"
              value={free ? "" : price}
              disabled={free}
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputCls} disabled:opacity-50`}
            />
            <label className="mt-1 flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} className="size-4 accent-brand" data-testid="free-toggle" />
              Free
            </label>
            {fieldError("price")}
          </div>
        </div>

        {(category === "textbook" || category === "supplies") && (
          <div className="grid grid-cols-2 gap-3" data-testid="course-fields">
            <div>
              <label htmlFor="l-course" className="mb-1 block font-semibold">
                Course <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input id="l-course" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className={inputCls} placeholder="MTH 1" />
              {fieldError("courseCode")}
            </div>
            {category === "textbook" && (
              <div>
                <label htmlFor="l-isbn" className="mb-1 block font-semibold">
                  ISBN <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <input id="l-isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} inputMode="numeric" className={inputCls} />
                {fieldError("isbn")}
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="l-desc" className="mb-1 block font-semibold">Description</label>
          <textarea
            id="l-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={MARKETPLACE_LIMITS.descriptionMax}
            className={inputCls}
            placeholder="What it is, what shape it's in, anything missing."
          />
          {fieldError("description")}
        </div>

        <div>
          <p className="mb-1 font-semibold">
            Photos <span className="font-normal text-ink-soft">(optional, up to {MARKETPLACE_LIMITS.imagesMax})</span>
          </p>
          {files.length > 0 && (
            <ul className="mb-2 space-y-1" data-testid="photo-list">
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
          {files.length < MARKETPLACE_LIMITS.imagesMax && (
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-semibold text-brand">
              <ImagePlus aria-hidden className="size-4" /> Add photos
              <input
                type="file"
                accept={MARKETPLACE_LIMITS.imageTypes.join(",")}
                multiple
                className="sr-only"
                data-testid="photo-input"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setFiles([...files, ...picked].slice(0, MARKETPLACE_LIMITS.imagesMax + 1));
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <p className="mt-1 text-xs text-ink-soft">Photos of the item only. No faces, IDs, or anything showing where you live.</p>
          {fieldError("images")}
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="checkbox" checked={showOnProfile} onChange={(e) => setShowOnProfile(e.target.checked)} className="mt-1 size-4 accent-brand" data-testid="profile-visibility" />
          <span>
            <span className="block font-semibold">Show this on my public profile</span>
            <span className="block text-sm text-ink-soft">Off by default. Shows the title and a link to this listing.</span>
          </span>
        </label>

        {fieldError("form")}
        <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-50" data-testid="submit-listing">
          {submitting ? "Listing…" : "List item"}
        </button>
        <p className="text-xs text-ink-soft">{MARKETPLACE_COPY.noPayment} No shipping. Meet on campus.</p>
      </form>
    </>
  );
}
