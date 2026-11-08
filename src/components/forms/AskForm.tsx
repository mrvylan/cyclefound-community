"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhotoPicker } from "./PhotoPicker";
import { SessionPicker } from "./SessionPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChipRadioGroup } from "@/components/ChipRadioGroup";
import { FilterChip, TagChip } from "@/components/ui";
import {
  clearAskDraft,
  readAskDraft,
  saveAskDraft,
} from "@/lib/auth/drafts";
import { authHref } from "@/lib/auth/redirects";
import {
  getAllQuestions,
  getGarageItemsFor,
  getItemPhotoUrls,
  getSessionHandle,
  postQuestion,
  subscribeStore,
  tagSuggestions,
} from "@/lib/data/local-store";
import type { Question } from "@/lib/data/seed";
import { membersReachedByTopics } from "@/lib/community/routing-reach";
import {
  ASK_INTENT_OPTIONS,
  intentById,
  suggestTopicsFromText,
  type AskIntent,
} from "@/lib/skills/feedTopics";

const MIN_TITLE = 12;
const MAX_TITLE = 160;
const MIN_DETAILS = 20;
const MAX_DETAILS = 4000;
const MAX_TAGS = 5;

function normalizeTag(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

function parseIntent(raw: string | undefined | null): AskIntent["id"] | "" {
  const id = String(raw || "").trim().toLowerCase();
  return intentById(id)?.id ?? "";
}

function initialAskState(searchParams: URLSearchParams) {
  const draft = readAskDraft();
  const intentFromUrl = parseIntent(searchParams.get("intent"));
  const topicsParam = searchParams.get("topics") || "";
  const expertiseTags = topicsParam
    .split(",")
    .map((t) => normalizeTag(t))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
  const prefill = (searchParams.get("title") || "").trim();
  if (draft) {
    clearAskDraft();
    return {
      title: draft.title || "",
      body: draft.body || "",
      tags: draft.tags || [],
      intent: parseIntent(draft.intent || draft.category) || intentFromUrl,
      linkedItemId: draft.linkedItemId || "",
      draftRestored: true,
    };
  }
  return {
    title: prefill.slice(0, 200),
    body: "",
    tags: expertiseTags,
    intent: intentFromUrl,
    linkedItemId: "",
    draftRestored: false,
  };
}

function liveCounter(have: number, min: number, max: number) {
  const left = Math.max(0, min - have);
  if (left > 0) {
    return `${have} / ${max} · ${left} more to meet the minimum`;
  }
  return `${have} / ${max}`;
}

export function AskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, configured, user } = useAuth();
  const [handle, setHandle] = useState("");
  const [storeTick, setStoreTick] = useState(0);
  const [initial] = useState(() => initialAskState(searchParams));
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(initial.tags);
  const [photos, setPhotos] = useState<string[]>([]);
  const [linkedItemId, setLinkedItemId] = useState(initial.linkedItemId);
  const [intent, setIntent] = useState<AskIntent["id"] | "">(initial.intent);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const draftRestored = initial.draftRestored;

  useEffect(() => {
    function sync() {
      setHandle(getSessionHandle());
      setStoreTick((n) => n + 1);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  const sessionOk = Boolean(handle) || Boolean(user);
  const needsAuth = ready && configured && !sessionOk;

  const garageItems = useMemo(() => {
    void storeTick;
    return getGarageItemsFor(handle);
  }, [handle, storeTick]);

  const catalogSuggestions = useMemo(() => {
    void storeTick;
    return tagSuggestions();
  }, [storeTick]);

  const fromText = useMemo(
    () => suggestTopicsFromText(`${title} ${body}`, 8),
    [title, body],
  );

  const suggestions = useMemo(() => {
    const merged: string[] = [];
    const seen = new Set(tags.map((t) => t.toLowerCase()));
    for (const t of [...fromText, ...catalogSuggestions]) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(t);
      if (merged.length >= 12) break;
    }
    return merged;
  }, [fromText, catalogSuggestions, tags]);

  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const intentMeta = intentById(intent);

  /** Duplicate / near-duplicate check against open + solved threads. */
  const similar = useMemo(() => {
    const q = title.trim().toLowerCase();
    if (q.length < 8) return [] as Question[];
    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    if (tokens.length < 2) return [] as Question[];
    return getAllQuestions()
      .map((item) => {
        const hay = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
        const score = tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
        return { item, score };
      })
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.item);
  }, [title]);

  const routing = useMemo(() => {
    void storeTick;
    if (!intentMeta && !tags.length) return null;
    const reach = membersReachedByTopics(tags);
    return {
      intentLabel: intentMeta?.label ?? null,
      expertiseCount: reach.count,
      topTag: reach.topTopic,
    };
  }, [intentMeta, tags, storeTick]);

  function addTag(raw: string) {
    const t = normalizeTag(raw);
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function persistDraftAndAuth() {
    saveAskDraft({
      title,
      body,
      tags,
      intent: intent || undefined,
      linkedItemId: linkedItemId || undefined,
    });
    router.push(authHref("join", "/ask"));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsAuth) {
      persistDraftAndAuth();
      return;
    }
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
    if (!intent) {
      setError("Pick what you’re trying to do — Fix, Find, Value, or Build.");
      return;
    }
    if (!tags.length) {
      setError("Add at least one expertise tag so the right people can find this.");
      return;
    }
    setError("");
    const finalTags = [...tags];
    if (!finalTags.includes(intent) && finalTags.length < MAX_TAGS) {
      finalTags.unshift(intent);
    }
    const q = postQuestion({
      title: title.trim().slice(0, MAX_TITLE),
      body: body.trim().slice(0, MAX_DETAILS),
      tags: finalTags.slice(0, MAX_TAGS),
      linkedItemId: linkedItemId || undefined,
      photoDataUrls: photos,
    });
    const reach = membersReachedByTopics(tags);
    try {
      sessionStorage.setItem(
        "cf_ask_sent",
        JSON.stringify({
          questionId: q.id,
          count: reach.count,
          topic: reach.topTopic,
          intent: intentMeta?.label ?? null,
        }),
      );
    } catch {
      /* ignore */
    }
    router.push(`/q/${q.id}`);
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-8 py-10 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="section-title m-0 text-[clamp(36px,5vw,56px)]">Ask a question</h1>
        <p className="m-0 text-[16px] leading-[1.55] text-muted-2">
          Title, details, optional photos and tags. Link a garage item if it helps.
        </p>
        <SessionPicker />
        {draftRestored ? (
          <p className="m-0 rounded-[10px] border border-accent-soft-border bg-accent-soft px-3 py-2 text-[13px] text-accent-hover">
            Draft restored after sign-in.
          </p>
        ) : null}
        {needsAuth ? (
          <p className="m-0 rounded-[10px] border border-line bg-ground px-3 py-2 text-[13px] text-muted-2">
            You’ll join before posting — we save your draft.{" "}
            <Link href={authHref("join", "/ask")} className="font-semibold text-accent">
              Join
            </Link>
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">What are you trying to do?</span>
          <p className="m-0 text-[13px] text-muted-2">
            Intent routes your question into Fix / Find / Value / Build. Expertise tags
            (next) match people who know the brand or discipline.
          </p>
          <ChipRadioGroup
            ariaLabel="Question intent"
            options={ASK_INTENT_OPTIONS}
            value={intent}
            onChange={(v) => {
              setIntent(parseIntent(v));
              if (error) setError("");
            }}
            allowEmpty
          />
          <p className="m-0 text-[13px] text-muted-2">
            {intentMeta
              ? intentMeta.blurb
              : "Required — pick one so the feed and helpers know the job."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="q-title" className="text-[14px] font-semibold">
              Title
            </label>
            <span
              id="q-title-help"
              className={`font-mono text-[12px] tabular-nums ${
                titleLen < MIN_TITLE ? "text-muted" : "text-accent-hover"
              }`}
            >
              {liveCounter(titleLen, MIN_TITLE, MAX_TITLE)}
            </span>
          </div>
          <input
            id="q-title"
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            placeholder={intentMeta?.example || "e.g. What’s stuck — be specific"}
            aria-describedby="q-title-help"
            className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none placeholder:text-meta focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>

        {similar.length ? (
          <div
            className="rounded-[12px] border border-[#E8D9A8] bg-[#FFFBF0] p-3.5"
            role="status"
          >
            <p className="m-0 mb-1 text-[13px] font-semibold text-ink">
              Possible duplicates — check before posting
            </p>
            <p className="m-0 mb-2 text-[12px] text-muted-2">
              Similar threads already exist. Open one if it answers you; otherwise keep writing.
            </p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {similar.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/q/${q.id}`}
                    className="text-[14px] font-medium text-accent-hover no-underline hover:underline"
                  >
                    {q.title}
                    {q.solved ? (
                      <span className="ml-1.5 font-mono text-[11px] text-blue">Solved</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="q-body" className="text-[14px] font-semibold">
              Details
            </label>
            <span
              id="q-body-help"
              className={`font-mono text-[12px] tabular-nums ${
                bodyLen < MIN_DETAILS ? "text-muted" : "text-accent-hover"
              }`}
            >
              {liveCounter(bodyLen, MIN_DETAILS, MAX_DETAILS)}
            </span>
          </div>
          <textarea
            id="q-body"
            rows={6}
            value={body}
            maxLength={MAX_DETAILS}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError("");
            }}
            placeholder="What you’ve tried, year/make if relevant, and what a good answer looks like."
            aria-describedby="q-body-help"
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.55] text-ink outline-none placeholder:text-meta focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Photos</span>
          <PhotoPicker photos={photos} onChange={setPhotos} max={4} />
        </div>

        <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4">
          <label htmlFor="q-tags" className="text-[14px] font-semibold">
            Expertise tags <span className="font-normal text-muted">(required · up to {MAX_TAGS})</span>
          </label>
          <p className="m-0 text-[13px] text-muted-2">
            Separate from intent — tag brands, parts, or skills (e.g. Campagnolo, seatpost) so
            experts get matched.
          </p>
          <div className="flex flex-wrap gap-1.5" aria-live="polite">
            {tags.length ? (
              tags.map((t) => (
                <FilterChip key={t} active onClick={() => setTags(tags.filter((x) => x !== t))}>
                  {t}
                  <span aria-hidden>×</span>
                </FilterChip>
              ))
            ) : (
              <span className="text-[13px] text-meta">No tags yet — pick a suggestion or type one.</span>
            )}
          </div>
          <input
            id="q-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput.replace(/,/g, ""));
                if (error) setError("");
              }
            }}
            placeholder="Type a tag and press Enter"
            className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[15px] outline-none placeholder:text-meta focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested tags">
            {suggestions.slice(0, 10).map((t) => {
              const selected = tags.some((x) => x.toLowerCase() === t.toLowerCase());
              return (
                <FilterChip
                  key={t}
                  active={selected}
                  onClick={() => {
                    if (selected) {
                      setTags(tags.filter((x) => x.toLowerCase() !== t.toLowerCase()));
                    } else {
                      addTag(t);
                    }
                    if (error) setError("");
                  }}
                >
                  {t}
                </FilterChip>
              );
            })}
          </div>
        </div>

        {routing ? (
          <div
            className="rounded-[12px] border border-accent-soft-border bg-accent-soft px-4 py-3"
            aria-live="polite"
          >
            <p className="eyebrow m-0 text-accent-hover">Routing</p>
            <p className="mt-1.5 mb-0 text-[14px] leading-[1.45] text-ink">
              {routing.expertiseCount > 0 && routing.topTag ? (
                <>
                  Will reach{" "}
                  <strong>
                    {routing.expertiseCount} member
                    {routing.expertiseCount === 1 ? "" : "s"}
                  </strong>{" "}
                  who know <strong>{routing.topTag}</strong>
                  {routing.intentLabel ? (
                    <>
                      {" "}
                      · lands in <strong>{routing.intentLabel}</strong>
                    </>
                  ) : null}
                  .
                </>
              ) : tags.length ? (
                <>
                  Keep refining expertise tags — we&apos;ll show who this will reach
                  {routing.intentLabel ? (
                    <>
                      {" "}
                      · lands in <strong>{routing.intentLabel}</strong>
                    </>
                  ) : null}
                  .
                </>
              ) : (
                <>Add expertise tags to match helpers.</>
              )}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="q-item" className="text-[14px] font-semibold">
            Link a garage item <span className="font-normal text-muted">(optional)</span>
          </label>
          <p className="m-0 text-[13px] text-muted-2">
            Attach a bike or part from your garage so answerers see the exact machine.
          </p>
          {garageItems.length ? (
            <div
              id="q-item"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              role="listbox"
              aria-label="Link a garage item"
            >
              <button
                type="button"
                role="option"
                aria-selected={!linkedItemId}
                onClick={() => setLinkedItemId("")}
                className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-[10px] border p-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  !linkedItemId
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-white hover:bg-ground"
                }`}
              >
                <span className="text-[12px] font-semibold text-ink">None</span>
                <span className="mt-0.5 text-[11px] text-meta">No linked item</span>
              </button>
              {garageItems.slice(0, 8).map((item) => {
                const on = linkedItemId === item.id;
                const photo = getItemPhotoUrls(item)[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => setLinkedItemId(item.id)}
                    className={`rounded-[10px] border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      on ? "border-accent bg-accent-soft ring-1 ring-accent/30" : "border-line bg-white"
                    }`}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="mb-2 h-16 w-full rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="ph mb-2 h-16 w-full rounded-[8px]" aria-hidden />
                    )}
                    <span className="block text-[12px] font-semibold leading-snug text-ink">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="m-0 rounded-[10px] border border-dashed border-line bg-ground px-3 py-3 text-[13px] text-meta">
              No garage items yet.{" "}
              <Link href="/i/new" className="font-semibold text-accent">
                Add one
              </Link>{" "}
              or post without linking.
            </p>
          )}
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
            className="inline-flex h-12 items-center rounded-[10px] border-0 bg-accent px-6 text-[15px] font-semibold text-white hover:bg-accent-hover"
          >
            {needsAuth ? "Join & post" : "Post question"}
          </button>
        </div>

        {preview ? (
          <div className="rounded-[14px] border border-line bg-ground p-5">
            <h2 className="section-title m-0 text-[28px] leading-[1.05]">
              {title.trim() || "Your title"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.55] text-muted-2">
              {body.trim() || "Your details will show here."}
            </p>
            {intentMeta || tags.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {intentMeta ? <TagChip>{intentMeta.label}</TagChip> : null}
                {tags.map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
