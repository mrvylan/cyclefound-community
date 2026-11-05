"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoPicker } from "./PhotoPicker";
import { SessionPicker } from "./SessionPicker";
import { TagChip } from "@/components/ui";
import {
  getGarageItemsFor,
  getSessionHandle,
  postQuestion,
  subscribeStore,
  tagSuggestions,
} from "@/lib/data/local-store";

const MIN_TITLE = 12;
const MIN_DETAILS = 20;

export function AskForm() {
  const router = useRouter();
  const [handle, setHandle] = useState(getSessionHandle());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [linkedItemId, setLinkedItemId] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeStore(() => setHandle(getSessionHandle())), []);

  const garageItems = useMemo(() => getGarageItemsFor(handle), [handle]);
  const suggestions = tagSuggestions().filter((t) => !tags.includes(t));
  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 8) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleLen < MIN_TITLE) {
      setError(
        `Title needs at least ${MIN_TITLE} characters (you have ${titleLen}). Make it a short, specific sentence.`,
      );
      return;
    }
    if (bodyLen < MIN_DETAILS) {
      setError(
        `Details need at least ${MIN_DETAILS} characters (you have ${bodyLen}). Add what you’ve tried, bike year/make if relevant, and what a good answer looks like.`,
      );
      return;
    }
    setError("");
    const q = postQuestion({
      title,
      body,
      tags,
      linkedItemId: linkedItemId || undefined,
      photoDataUrls: photos,
    });
    router.push(`/q/${q.id}`);
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-8 py-10 pb-16">
      <div className="flex flex-col gap-2">
        <p className="eyebrow m-0">Community</p>
        <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">Ask a question</h1>
        <p className="m-0 text-[16px] leading-[1.55] text-muted-2">
          Title, details, optional photos and tags. Link a garage item if it helps.
        </p>
        <SessionPicker />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="q-title" className="text-[14px] font-semibold">
            Title
          </label>
          <input
            id="q-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            placeholder="What’s stuck — be specific"
            aria-describedby="q-title-help"
            className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent"
          />
          <p id="q-title-help" className="m-0 text-[13px] leading-[1.45] text-muted">
            At least {MIN_TITLE} characters. One clear sentence beats a vague subject line.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="q-body" className="text-[14px] font-semibold">
            Details
          </label>
          <textarea
            id="q-body"
            rows={6}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError("");
            }}
            placeholder="What you’ve tried, year/make if relevant, and what a good answer looks like."
            aria-describedby="q-body-help"
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.55] text-ink outline-none focus:border-accent"
          />
          <p id="q-body-help" className="m-0 text-[13px] leading-[1.45] text-muted">
            At least {MIN_DETAILS} characters. Include what you’ve already tried, bike year/make if
            it matters, and what “solved” looks like for you.
            {bodyLen > 0 ? (
              <>
                {" "}
                <span className="font-mono text-[12px]">
                  {bodyLen}/{MIN_DETAILS}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Photos</span>
          <PhotoPicker photos={photos} onChange={setPhotos} max={4} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="q-tags" className="text-[14px] font-semibold">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="rounded-md border border-line bg-ground px-2 py-0.5 font-mono text-[12px] text-[#3D4249]"
              >
                {t} ×
              </button>
            ))}
          </div>
          <input
            id="q-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput.replace(/,/g, ""));
              }
            }}
            placeholder="Type a tag and press Enter"
            className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[15px] outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 10).map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)}>
                <TagChip>{t}</TagChip>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="q-item" className="text-[14px] font-semibold">
            Link an item from your garage <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="q-item"
            value={linkedItemId}
            onChange={(e) => setLinkedItemId(e.target.value)}
            className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-3 text-[15px] outline-none focus:border-accent"
          >
            <option value="">No linked item</option>
            {garageItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.year} · {item.name}
              </option>
            ))}
          </select>
          {garageItems.length === 0 ? (
            <p className="m-0 text-[13px] text-muted">
              No items in this garage yet — add one first, or switch who’s posting.
            </p>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="m-0 rounded-[10px] border border-[#E8C4C4] bg-[#FBF1F1] px-3.5 py-3 text-[14px] leading-[1.45] font-medium text-[#9B2C2C]"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2.5 border-t border-line-soft pt-4">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="inline-flex h-12 items-center rounded-[10px] border border-[#D4D3CD] bg-white px-5 text-[15px] font-semibold"
          >
            {preview ? "Hide preview" : "Preview"}
          </button>
          <button
            type="submit"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover sm:flex-none"
          >
            Post question
          </button>
        </div>
      </form>

      {preview ? (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="eyebrow mb-3 mt-0">Preview</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
          <h2 className="font-display m-0 text-[28px] leading-[1.05]">
            {title.trim() || "Your title"}
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-[16px] leading-[1.65] text-[#2A2E33]">
            {(body.trim() || "Your details appear here.")
              .split(/\n+/)
              .map((p) => (
                <p key={p.slice(0, 24)} className="m-0">
                  {p}
                </p>
              ))}
          </div>
          {photos.length ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src.slice(0, 40)}
                  src={src}
                  alt=""
                  className="h-28 w-full rounded-[10px] object-cover"
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
