"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { areasForCampus, HOUSING_AMENITIES, HOUSING_LIMITS, HOUSING_PREFERENCES } from "@/config/housing";
import { useCampus } from "@/context/CampusContext";
import { toDateKey, startOfToday } from "@/lib/dates";
import { createHousingPost, HousingValidationError } from "@/services/housing";
import type { HousingPostType, RoomType } from "@/types/models";

const inputCls = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-brand";

/** Collects only what's needed. No address, no deposit, no payment fields (D28). */
export function NewHousingForm() {
  const router = useRouter();
  const { currentCampus } = useCampus();
  const initialType = useSearchParams().get("type") === "looking-for-roommate" ? "looking-for-roommate" : "room-available";

  const [type, setType] = useState<HousingPostType>(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState("");
  const [price, setPrice] = useState("");
  const [availableFrom, setAvailableFrom] = useState(toDateKey(startOfToday()));
  const [lease, setLease] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("private");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [showOnProfile, setShowOnProfile] = useState(false);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const areas = areasForCampus(currentCampus.id);
  const isRoom = type === "room-available";
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const post = await createHousingPost({
        campusId: currentCampus.id,
        type,
        title,
        description,
        areaId,
        priceCents: Math.round(Number(price) * 100),
        availableFrom,
        leaseLengthMonths: lease ? Number(lease) : undefined,
        roomType,
        amenities: isRoom ? amenities : [],
        preferences,
        profileVisibility: showOnProfile ? "public" : "hidden",
      });
      router.push(`/housing/${post.id}?posted=1`);
    } catch (err) {
      setError(err instanceof HousingValidationError ? { field: err.field, message: err.message } : { field: "form", message: "Couldn't post. Try again." });
      setSubmitting(false);
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
      <Link href="/housing" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft aria-hidden className="size-4" /> Housing
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">Post housing</h1>
      <p className="mb-4 text-sm text-ink-soft">
        Visible to students near {currentCampus.shortName}. Don&apos;t include an address, phone number, or payment requests.
      </p>

      <form onSubmit={submit} className="space-y-5" data-testid="housing-form">
        <fieldset>
          <legend className="mb-2 font-semibold">What are you posting?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["room-available", "I have a room", "Find a roommate"],
                ["looking-for-roommate", "I need a room", "Let hosts find you"],
              ] as const
            ).map(([t, label, sub]) => (
              <label
                key={t}
                className={`flex cursor-pointer flex-col rounded-xl border p-3 ${type === t ? "border-brand bg-brand/5" : "border-line bg-surface"}`}
              >
                <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-ink-soft">{sub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="h-title" className="mb-1 block font-semibold">Title</label>
          <input id="h-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={HOUSING_LIMITS.titleMax} className={inputCls} placeholder={isRoom ? "Private room near campus" : "Looking for a quiet room"} />
          {fieldError("title")}
        </div>

        <div>
          <label htmlFor="h-desc" className="mb-1 block font-semibold">Description</label>
          <textarea id="h-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={HOUSING_LIMITS.descriptionMax} className={inputCls} />
          {fieldError("description")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="h-area" className="mb-1 block font-semibold">Approximate area</label>
            <select id="h-area" value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputCls}>
              <option value="">Choose…</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (~{a.miles} mi)</option>
              ))}
            </select>
            {fieldError("areaId")}
          </div>
          <div>
            <label htmlFor="h-price" className="mb-1 block font-semibold">{isRoom ? "Monthly rent ($)" : "Max budget ($/mo)"}</label>
            <input id="h-price" type="number" inputMode="numeric" min={100} max={5000} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
            {fieldError("price")}
          </div>
          <div>
            <label htmlFor="h-date" className="mb-1 block font-semibold">{isRoom ? "Available from" : "Move-in by"}</label>
            <input id="h-date" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputCls} />
            {fieldError("availableFrom")}
          </div>
          <div>
            <label htmlFor="h-lease" className="mb-1 block font-semibold">Lease length</label>
            <select id="h-lease" value={lease} onChange={(e) => setLease(e.target.value)} className={inputCls}>
              <option value="">Flexible</option>
              {[3, 6, 9, 12].map((m) => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">Room type</legend>
          <div className="flex gap-4">
            {(["private", "shared"] as const).map((r) => (
              <label key={r} className="flex min-h-10 items-center gap-2">
                <input type="radio" name="room" value={r} checked={roomType === r} onChange={() => setRoomType(r)} className="size-4 accent-brand" />
                {r === "private" ? "Private room" : "Shared room"}
              </label>
            ))}
          </div>
        </fieldset>

        {isRoom && (
          <fieldset data-testid="amenities-field">
            <legend className="mb-2 font-semibold">Amenities <span className="font-normal text-ink-soft">(optional)</span></legend>
            <div className="grid grid-cols-2 gap-1">
              {HOUSING_AMENITIES.map((a) => (
                <label key={a.id} className="flex min-h-10 items-center gap-2 text-sm">
                  <input type="checkbox" checked={amenities.includes(a.id)} onChange={() => toggle(amenities, setAmenities, a.id)} className="size-4 accent-brand" />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-1 font-semibold">Living preferences <span className="font-normal text-ink-soft">(optional)</span></legend>
          <p className="mb-2 text-xs text-ink-soft">Lifestyle only. Fair housing rules don&apos;t allow preferences about race, religion, gender, disability, family status, or similar.</p>
          <div className="grid grid-cols-2 gap-1">
            {HOUSING_PREFERENCES.map((x) => (
              <label key={x.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={preferences.includes(x.id)} onChange={() => toggle(preferences, setPreferences, x.id)} className="size-4 accent-brand" />
                {x.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <input type="checkbox" checked={showOnProfile} onChange={(e) => setShowOnProfile(e.target.checked)} className="mt-1 size-4 accent-brand" data-testid="profile-visibility" />
          <span>
            <span className="block font-semibold">Show &quot;{isRoom ? "Housing available" : "Looking for roommate"}&quot; on my public profile</span>
            <span className="block text-sm text-ink-soft">Off by default. Only the status shows. Details stay on this post.</span>
          </span>
        </label>

        {fieldError("form")}
        <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-50">
          {submitting ? "Posting…" : "Post"}
        </button>
        <p className="text-xs text-ink-soft">East Bay Link never handles deposits or rent. Never pay before you see the place and sign a lease.</p>
      </form>
    </>
  );
}
