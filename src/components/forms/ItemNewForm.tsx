"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoPicker } from "./PhotoPicker";
import { SessionPicker } from "./SessionPicker";
import { postItem } from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";

const CATEGORIES = [
  "Complete bike",
  "Frameset",
  "Groupset",
  "Component",
  "Wheels",
  "Tools",
] as const;

const CONDITIONS = ["New", "Excellent", "Very good", "Good", "Fair", "Project"] as const;

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "For sale",
  "Open to offers",
  "Trade only",
];

export function ItemNewForm() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Complete bike");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("Good");
  const [status, setStatus] = useState<ItemStatus>("Not for sale");
  const [askingPrice, setAskingPrice] = useState("");
  const [ownerEst, setOwnerEst] = useState("");
  const [notes, setNotes] = useState("");
  const [provenance, setProvenance] = useState("");
  const [error, setError] = useState("");

  const showPrice = status === "For sale" || status === "Open to offers";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the item a title.");
      return;
    }
    if (!year.trim()) {
      setError("Add a year (approx is fine).");
      return;
    }
    setError("");
    const item = postItem({
      title,
      category,
      year: year.trim(),
      condition,
      status,
      askingPrice: showPrice ? askingPrice : "",
      ownerEstValue: ownerEst,
      notes,
      provenance,
      photoDataUrls: photos,
    });
    router.push(`/i/${item.id}`);
  }

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent";
  const label = "text-[14px] font-semibold";

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-5 px-5 py-8 pb-20 sm:px-8">
      <div className="flex flex-col gap-2">
        <p className="eyebrow m-0">Your garage</p>
        <h1 className="font-display m-0 text-[clamp(32px,8vw,48px)]">Add an item</h1>
        <p className="m-0 text-[15px] leading-[1.5] text-muted-2">
          Photos, basics, status — aim for under two minutes on your phone.
        </p>
        <SessionPicker />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className={label}>Photos</span>
          <PhotoPicker photos={photos} onChange={setPhotos} max={8} reorder />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="item-title" className={label}>
            Title
          </label>
          <input
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Colnago Super, Saronni red, 56 cm"
            className={field}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="item-cat" className={label}>
              Category
            </label>
            <select
              id="item-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="item-year" className={label}>
              Year
            </label>
            <input
              id="item-year"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1984"
              className={field}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="item-cond" className={label}>
            Condition
          </label>
          <select
            id="item-cond"
            value={condition}
            onChange={(e) => setCondition(e.target.value as (typeof CONDITIONS)[number])}
            className={field}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className={label}>Status</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STATUSES.map((s) => (
              <label
                key={s}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 text-[14px] font-medium ${
                  status === s
                    ? "border-ink bg-ink text-white"
                    : "border-[#D4D3CD] bg-white text-ink"
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
          <div className="flex flex-col gap-2">
            <label htmlFor="item-ask" className={label}>
              Asking price <span className="font-normal text-muted">(optional)</span>
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

        <div className="flex flex-col gap-2">
          <label htmlFor="item-est" className={label}>
            Owner&apos;s estimated value{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="item-est"
            value={ownerEst}
            onChange={(e) => setOwnerEst(e.target.value)}
            placeholder="$2,400 – $3,200"
            className={field}
          />
          <p className="m-0 text-[12px] text-muted">
            Labelled as your estimate — not a market appraisal.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="item-notes" className={label}>
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="item-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Condition quirks, what’s original, what you’d tell a buyer."
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.5] outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="item-prov" className={label}>
            Provenance <span className="font-normal text-muted">(optional free text)</span>
          </label>
          <textarea
            id="item-prov"
            rows={3}
            value={provenance}
            onChange={(e) => setProvenance(e.target.value)}
            placeholder="Where it came from, ownership timeline, docs you have."
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.5] outline-none focus:border-accent"
          />
        </div>

        {error ? <p className="m-0 text-[14px] font-medium text-[#9B2C2C]">{error}</p> : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-accent text-[16px] font-semibold text-white hover:bg-accent-hover"
        >
          Add to garage
        </button>
      </form>
    </div>
  );
}
