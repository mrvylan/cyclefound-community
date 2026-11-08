"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PhotoPicker } from "./PhotoPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { ITEM_CATEGORIES, type ItemCategory, normalizeItemCategory } from "@/lib/data/categories";
import {
  canManageGarageItem,
  getItemLocal,
  getItemPhotoUrls,
  getItemPrivateMeta,
  getSessionHandle,
  subscribeStore,
  updateGarageItem,
} from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";
import { identifyGarageItemFromPhotos } from "@/lib/garage/identifyClient";
import {
  clampItemDescription,
  composeItemTitle,
  descriptionPriceMismatch,
  ITEM_DESCRIPTION_MAX,
} from "@/lib/garage/itemFields";
import { CONDITIONS, type FormCondition } from "@/lib/garage/mapAiCategory";

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "Open to offers",
  "For sale",
  "Trade only",
];

export function ItemEditForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Complete bikes");
  const [year, setYear] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<FormCondition>("Good");
  const [status, setStatus] = useState<ItemStatus>("Not for sale");
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [provenance, setProvenance] = useState("");
  const [error, setError] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = category === "Complete bikes" || category === "Framesets";
  const sessionHandle = getSessionHandle();

  useEffect(() => {
    function load() {
      const item = getItemLocal(itemId);
      if (!item) {
        setMissing(true);
        setReady(true);
        return;
      }
      const me = getSessionHandle();
      if (!canManageGarageItem(item, me)) {
        setForbidden(true);
        setReady(true);
        return;
      }
      setTitle(item.name);
      setCategory(normalizeItemCategory(item.catShort));
      setYear(item.year === "—" ? "" : item.year);
      setSize(item.size || "");
      if ((CONDITIONS as readonly string[]).includes(item.cond)) {
        setCondition(item.cond as FormCondition);
      }
      setStatus(item.status);
      setAskingPrice(item.ask === "—" ? "" : item.ask);
      setDescription(item.description || "");
      setPhotos(getItemPhotoUrls(item));
      const meta = getItemPrivateMeta(itemId);
      setNotes(meta.notes);
      setProvenance(meta.provenance);
      setMissing(false);
      setForbidden(false);
      setReady(true);
    }
    load();
    return subscribeStore(load);
  }, [itemId]);

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
  const selectField =
    "cf-select h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-3.5 text-[16px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
  const label = "text-[14px] font-semibold";
  const textarea =
    "w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.5] outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

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
      const s = result.suggestion;
      if (s.title) setTitle(s.title);
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
      if (nextDesc) setDescription((cur) => cur || nextDesc);
      setAiApplied(true);
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Identify failed.");
    } finally {
      setIdentifying(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the item a title.");
      return;
    }
    if (showPrice && status === "For sale" && !askingPrice.trim()) {
      setError("Add an asking price, or switch to Open to offers.");
      return;
    }
    if (description.length > ITEM_DESCRIPTION_MAX) {
      setError(`Description must be ${ITEM_DESCRIPTION_MAX} characters or fewer.`);
      return;
    }
    const priceClash =
      showPrice && askingPrice.trim()
        ? descriptionPriceMismatch(description, askingPrice)
        : null;
    if (priceClash != null) {
      setError(
        `Description mentions $${priceClash.toLocaleString("en-US")} but Asking is different — keep the price only in Asking, or match the amounts.`,
      );
      return;
    }
    setError("");
    const updated = updateGarageItem(itemId, {
      title: composeItemTitle({ title, year }),
      category,
      year: year.trim() || "—",
      size: showSize ? size.trim() : "",
      condition,
      status,
      askingPrice: showPrice ? askingPrice : "",
      ownerEstValue: "",
      description: clampItemDescription(description),
      notes,
      provenance,
      photoDataUrls: photos,
    });
    const handle = updated?.ownerHandle || sessionHandle;
    router.push(handle ? `/u/${handle}/garage` : `/i/${itemId}`);
  }

  if (!ready || !authReady) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 text-[15px] text-muted sm:px-8">
        Loading item…
      </div>
    );
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 sm:px-8">
        <h1 className="section-title m-0 text-[36px]">Item not found</h1>
        <p className="mt-2 text-[15px] text-muted-2">It may have been deleted.</p>
        <Link href="/" className="mt-4 inline-flex font-semibold text-accent">
          Back home
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 sm:px-8">
        <h1 className="section-title m-0 text-[36px]">Can&apos;t edit this item</h1>
        <p className="mt-2 text-[15px] text-muted-2">
          Only the owner can edit garage items.
        </p>
        <Link href={`/i/${itemId}`} className="mt-4 inline-flex font-semibold text-accent">
          View item
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <div className="mb-8">
        <p className="eyebrow m-0">Your garage</p>
        <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">Edit item</h1>
        <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
          Update photos, details, or availability. Changes stay in your garage.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="section-title m-0 text-[20px]">Photos</h2>
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
              <p className="m-0 text-[13px] text-muted-2">Suggested fields updated.</p>
            ) : null}
          </div>
          {identifyError ? (
            <p className="m-0 text-[13px] font-medium text-[#9B2C2C]" role="alert">
              {identifyError}
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="edit-title" className={label}>
              Title
            </label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={field}
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
            <label htmlFor="edit-year" className={label}>
              Year <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="edit-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 1984"
              className={`${field} placeholder:text-meta`}
            />
          </div>
          {showSize ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-size" className={label}>
                Size <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="edit-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 56 cm"
                className={`${field} placeholder:text-meta`}
                autoComplete="off"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-cond" className={label}>
              Condition
            </label>
            <select
              id="edit-cond"
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
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-description" className={label}>
              Public description
            </label>
            <textarea
              id="edit-description"
              rows={6}
              value={description}
              maxLength={Math.max(ITEM_DESCRIPTION_MAX, description.length)}
              onChange={(e) => setDescription(e.target.value)}
              className={textarea}
            />
            <p className="m-0 text-right font-mono text-[12px] tabular-nums text-meta">
              {description.length}/{ITEM_DESCRIPTION_MAX}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-notes" className={label}>
                Private notes{" "}
                <span className="font-normal text-muted">(only you)</span>
              </label>
              <textarea
                id="edit-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={textarea}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-prov" className={label}>
                Where it came from{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="edit-prov"
                rows={4}
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                className={textarea}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
          <h2 className="m-0 text-[15px] font-bold">Availability</h2>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {STATUSES.map((s) => (
              <label
                key={s}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border px-3 text-center text-[13px] font-medium ${
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
          {showPrice ? (
            <div className="flex max-w-xs flex-col gap-2">
              <label htmlFor="edit-ask" className={label}>
                Asking price
              </label>
              <input
                id="edit-ask"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className={field}
              />
              {descriptionPriceMismatch(description, askingPrice) != null ? (
                <p className="m-0 text-[13px] text-[#9B2C2C]">
                  Description quotes a different dollar amount — keep price only in Asking.
                </p>
              ) : (
                <p className="m-0 text-[12px] text-meta">
                  Keep the price here, not in the description.
                </p>
              )}
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
            className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-[10px] bg-accent px-6 text-[16px] font-semibold text-white hover:bg-accent-hover"
          >
            Save changes
          </button>
          <Link
            href={sessionHandle ? `/u/${sessionHandle}/garage` : `/i/${itemId}`}
            className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
