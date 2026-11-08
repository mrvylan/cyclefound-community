"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PhotoPicker } from "./PhotoPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  clearItemDraft,
  readItemDraft,
  saveItemDraft,
} from "@/lib/auth/drafts";
import { authHref } from "@/lib/auth/redirects";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/data/categories";
import { getSessionHandle, postItem } from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";
import {
  identifyGarageItemFromPhotos,
  type IdentifySuggestion,
} from "@/lib/garage/identifyClient";
import {
  clampItemDescription,
  ITEM_DESCRIPTION_MAX,
} from "@/lib/garage/itemFields";
import { CONDITIONS, type FormCondition } from "@/lib/garage/mapAiCategory";

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "Open to offers",
  "For sale",
  "Trade only",
];

function statusFromQuery(raw: string | null): ItemStatus | null {
  if (!raw) return null;
  return (STATUSES as readonly string[]).includes(raw) ? (raw as ItemStatus) : null;
}

/**
 * Garage documentation form — catalog what you own.
 * Not a marketplace listing wizard (cyclefound.com sell flow stays separate).
 */
export function ItemNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, configured, user } = useAuth();

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Complete bikes");
  const [year, setYear] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<FormCondition>("Good");
  const [status, setStatus] = useState<ItemStatus>(
    () => statusFromQuery(searchParams.get("status")) || "Not for sale",
  );
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [provenance, setProvenance] = useState("");
  const [error, setError] = useState("");

  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  /** Last description written by AI — re-identify replaces unless the owner edited it. */
  const lastAiDescriptionRef = useRef("");
  const descriptionTouchedRef = useRef(false);

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = category === "Complete bikes" || category === "Framesets";
  const sessionHandle = getSessionHandle();
  const sessionOk = Boolean(sessionHandle) || Boolean(user);
  const needsAuth = ready && configured && !sessionOk;

  function resetForm(nextStatus: ItemStatus = "Not for sale") {
    setPhotos([]);
    setTitle("");
    setManufacturer("");
    setModelName("");
    setCategory("Complete bikes");
    setYear("");
    setSize("");
    setCondition("Good");
    setStatus(nextStatus);
    setAskingPrice("");
    setDescription("");
    setNotes("");
    setProvenance("");
    setError("");
    setIdentifyError("");
    setAiApplied(false);
    lastAiDescriptionRef.current = "";
    descriptionTouchedRef.current = false;
  }

  useEffect(() => {
    const fromQuery = statusFromQuery(searchParams.get("status"));
    if (fromQuery) setStatus(fromQuery);
    const draft = readItemDraft();
    if (!draft) return;
    setTitle(draft.title || "");
    if (draft.category) {
      const match = ITEM_CATEGORIES.find(
        (c) => c.toLowerCase() === draft.category.toLowerCase(),
      );
      if (match) setCategory(match);
      else if (/groupset/i.test(draft.category)) setCategory("Components");
    }
    setYear(draft.year || "");
    if (draft.condition) setCondition(draft.condition as FormCondition);
    if (draft.status) setStatus(draft.status as ItemStatus);
    setAskingPrice(draft.askingPrice || "");
    setDescription(draft.description || "");
    setNotes(draft.notes || "");
    setProvenance(draft.provenance || "");
    descriptionTouchedRef.current = Boolean(draft.description);
    clearItemDraft();
  }, [searchParams]);

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
  const selectField =
    "cf-select h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-3.5 text-[16px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
  const label = "text-[14px] font-semibold";
  const textarea =
    "w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.5] outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

  function applySuggestion(s: IdentifySuggestion) {
    if (s.title) setTitle(s.title);
    if (s.manufacturer) setManufacturer(s.manufacturer);
    if (s.model) setModelName(s.model);
    if (ITEM_CATEGORIES.includes(s.category as ItemCategory)) {
      setCategory(s.category as ItemCategory);
    }
    if (s.year && s.year !== "Unknown") {
      setYear(s.year.replace(/[^\d]/g, "").slice(0, 4) || s.year);
    }
    if (s.condition && (CONDITIONS as readonly string[]).includes(s.condition)) {
      setCondition(s.condition as FormCondition);
    }
    const descBits = [s.description, s.components ? `Components: ${s.components}` : ""]
      .filter(Boolean)
      .join("\n\n");
    const nextDesc = clampItemDescription(descBits);
    if (nextDesc) {
      setDescription((cur) => {
        if (
          !cur ||
          !descriptionTouchedRef.current ||
          cur === lastAiDescriptionRef.current
        ) {
          lastAiDescriptionRef.current = nextDesc;
          descriptionTouchedRef.current = false;
          return nextDesc;
        }
        return cur;
      });
    }
    setAiApplied(true);
  }

  async function runIdentify() {
    setIdentifyError("");
    setAiApplied(false);
    if (!photos.length) {
      setIdentifyError("Add at least one photo first.");
      return;
    }
    setIdentifying(true);
    try {
      const result = await identifyGarageItemFromPhotos(photos);
      applySuggestion(result.suggestion);
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Identify failed.");
    } finally {
      setIdentifying(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsAuth) {
      saveItemDraft({
        title,
        category,
        year,
        condition,
        status,
        askingPrice,
        description,
        notes,
        provenance,
      });
      router.push(authHref("join", "/item/new"));
      return;
    }
    if (!photos.length) {
      setError("Add at least one photo so others can recognize the item.");
      return;
    }
    if (!title.trim() && !manufacturer.trim() && !modelName.trim()) {
      setError("Add a title, or brand + model — AI can fill these from photos.");
      return;
    }
    if (description.length > ITEM_DESCRIPTION_MAX) {
      setError(`Description must be ${ITEM_DESCRIPTION_MAX} characters or fewer.`);
      return;
    }
    if (showPrice && status === "For sale" && !askingPrice.trim()) {
      setError("Add an asking price, or switch to Open to offers.");
      return;
    }
    setError("");
    const composedTitle =
      title.trim() ||
      [year, manufacturer, modelName].filter(Boolean).join(" ").trim() ||
      "Untitled garage item";
    const item = postItem({
      title: composedTitle,
      category,
      year: year.trim() || "—",
      size: showSize ? size.trim() : "",
      condition,
      status,
      askingPrice: showPrice ? askingPrice : "",
      ownerEstValue: "",
      description: clampItemDescription(description),
      notes: notes.trim(),
      provenance: provenance.trim(),
      photoDataUrls: photos,
    });
    const handle = getSessionHandle() || sessionHandle;
    resetForm(statusFromQuery(searchParams.get("status")) || "Not for sale");
    // Garage home — not a marketplace listing review page.
    router.push(handle ? `/u/${handle}/garage?added=${item.id}` : `/i/${item.id}`);
  }

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow m-0">Your garage</p>
          <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">
            Document an item
          </h1>
          <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
            Add what you own to your garage — photos, identity, and history. Availability
            is optional; this is not a marketplace listing.
          </p>
        </div>
        {needsAuth ? (
          <p className="m-0 max-w-[18rem] rounded-[10px] border border-line bg-ground px-3 py-2 text-[13px] text-muted-2 sm:text-right">
            Join to save to your garage — draft is kept.{" "}
            <Link href={authHref("join", "/item/new")} className="font-semibold text-accent">
              Join
            </Link>
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        {/* 1 — Photos + AI assist (fills fields below; no separate “review” screen) */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="section-title m-0 text-[20px]">Photos</h2>
            <p className="mt-1 m-0 text-[14px] text-muted-2">
              Drive side, non-drive, and a close-up of markings work best.
            </p>
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <PhotoPicker photos={photos} onChange={setPhotos} max={8} reorder />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={identifying || !photos.length}
              onClick={() => void runIdentify()}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-accent-soft-border bg-accent-soft px-4 text-[14px] font-semibold text-accent-hover hover:bg-[#e4edd9] disabled:opacity-50"
            >
              <Sparkles className="size-4" aria-hidden />
              {identifying ? "Reading photos…" : "Fill details from photos"}
            </button>
            {aiApplied ? (
              <p className="m-0 text-[13px] text-muted-2">
                Suggested fields filled — edit anything below before saving.
              </p>
            ) : null}
          </div>
          {identifyError ? (
            <p className="m-0 text-[13px] font-medium text-[#9B2C2C]" role="alert">
              {identifyError}
            </p>
          ) : null}
          <p className="m-0 text-[12px] leading-snug text-meta">
            AI may be wrong. You stay in control of every field.
          </p>
        </section>

        {/* 2 — What it is */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="section-title m-0 text-[20px]">What it is</h2>
            <p className="mt-1 m-0 text-[14px] text-muted-2">
              How it should appear in your garage.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="item-title" className={label}>
                Title
              </label>
              <input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 1984 Colnago Super, Saronni red, 56 cm"
                className={`${field} placeholder:text-meta`}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="item-brand" className={label}>
                Brand <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="item-brand"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Colnago"
                className={`${field} placeholder:text-meta`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="item-model" className={label}>
                Model <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="item-model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Super"
                className={`${field} placeholder:text-meta`}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <fieldset className="m-0 border-0 p-0">
                <legend className={label}>Category</legend>
                <div
                  role="radiogroup"
                  aria-label="Category"
                  className="mt-2 flex flex-wrap gap-2"
                >
                  {ITEM_CATEGORIES.map((c) => {
                    const on = category === c;
                    return (
                      <label
                        key={c}
                        className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-medium ${
                          on
                            ? "border-ink bg-ink text-white"
                            : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={c}
                          checked={on}
                          onChange={() => setCategory(c)}
                          className="sr-only"
                        />
                        {c}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="item-year" className={label}>
                Year <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="item-year"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 1984"
                className={`${field} placeholder:text-meta`}
              />
            </div>
            {showSize ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="item-size" className={label}>
                  Size <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="item-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 56 cm"
                  className={`${field} placeholder:text-meta`}
                  autoComplete="off"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <label htmlFor="item-cond" className={label}>
                Condition
              </label>
              <select
                id="item-cond"
                value={condition}
                onChange={(e) => setCondition(e.target.value as FormCondition)}
                className={selectField}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 3 — Public description + private notes */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="section-title m-0 text-[20px]">Description</h2>
            <p className="mt-1 m-0 text-[14px] text-muted-2">
              Shown on your garage listing. AI can draft this from photos — edit before
              saving.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="item-description" className={label}>
              Public description
            </label>
            <textarea
              id="item-description"
              rows={4}
              value={description}
              maxLength={ITEM_DESCRIPTION_MAX}
              onChange={(e) => {
                descriptionTouchedRef.current = true;
                setDescription(e.target.value.slice(0, ITEM_DESCRIPTION_MAX));
              }}
              placeholder="Condition, notable features, what’s original…"
              className={textarea}
            />
            <p className="m-0 text-right font-mono text-[12px] tabular-nums text-meta">
              {description.length}/{ITEM_DESCRIPTION_MAX}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="item-notes" className={label}>
                Private notes{" "}
                <span className="font-normal text-muted">(only you)</span>
              </label>
              <textarea
                id="item-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reminders, serials, repair plans — not shown publicly."
                className={textarea}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="item-prov" className={label}>
                Where it came from{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="item-prov"
                rows={4}
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                placeholder="Owned since…, previous owners, paperwork…"
                className={textarea}
              />
              <p className="m-0 text-[12px] text-meta">
                Shown on the item page as history when you add it.
              </p>
            </div>
          </div>
        </section>

        {/* 4 — Availability (always visible; default Not for sale) */}
        <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
          <div>
            <h2 className="m-0 text-[15px] font-bold">Availability</h2>
            <p className="mt-1 m-0 text-[13px] text-muted-2">
              Defaults to in your garage only. Change this if someone could ask about buying or
              trading it.
            </p>
          </div>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="sr-only">Status</legend>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              {STATUSES.map((s) => (
                <label
                  key={s}
                  className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border px-3 text-center text-[13px] font-medium sm:text-[14px] ${
                    status === s
                      ? "border-ink bg-ink text-white"
                      : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          {showPrice ? (
            <div className="flex max-w-xs flex-col gap-2">
              <label htmlFor="item-ask" className={label}>
                Asking price
                {status === "Open to offers" ? (
                  <span className="font-normal text-muted"> (optional)</span>
                ) : null}
              </label>
              <input
                id="item-ask"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="$3,000"
                className={field}
              />
            </div>
          ) : null}
        </section>

        {error ? (
          <p className="m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <button
            type="submit"
            className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-[10px] bg-accent px-6 text-[16px] font-semibold text-white hover:bg-accent-hover"
          >
            {needsAuth ? "Join & add to garage" : "Add to garage"}
          </button>
          <Link
            href={sessionHandle ? `/u/${sessionHandle}/garage` : "/"}
            className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
