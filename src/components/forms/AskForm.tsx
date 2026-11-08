"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhotoPicker } from "./PhotoPicker";
import { SessionPicker } from "./SessionPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChipRadioGroup } from "@/components/ChipRadioGroup";
import { TagChip } from "@/components/ui";
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
  listMembers,
  postQuestion,
  subscribeStore,
  tagSuggestions,
} from "@/lib/data/local-store";
import type { Question } from "@/lib/data/seed";
import {
  ASK_INTENT_OPTIONS,
  intentById,
  type AskIntent,
} from "@/lib/skills/feedTopics";

const MIN_TITLE = 12;
const MIN_DETAILS = 20;
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

function charsNeededHelp(have: number, min: number) {
  const left = Math.max(0, min - have);
  if (left === 0) return "Looks long enough.";
  return `${left} more character${left === 1 ? "" : "s"} needed`;
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
  const suggestions = tagSuggestions().filter((t) => !tags.includes(t));
  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const intentMeta = intentById(intent);

  const similar = useMemo(() => {
    const q = title.trim().toLowerCase();
    if (q.length < 8) return [] as Question[];
    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    return getAllQuestions()
      .filter((item) => item.solved)
      .map((item) => {
        const hay = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
        const score = tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
        return { item, score };
      })
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.item);
  }, [title]);

  const notifyHint = useMemo(() => {
    if (!tags.length) return null;
    const tag = tags[0]!;
    const n = listMembers().filter((p) =>
      p.skills.some((s) => s.toLowerCase().includes(tag.replace(/-/g, " "))),
    ).length;
    if (!n) return null;
    return `Notifies about ${n} member${n === 1 ? "" : "s"} with “${tag}” expertise`;
  }, [tags]);

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
    setError("");
    const finalTags = [...tags];
    if (intent && !finalTags.includes(intent) && finalTags.length < MAX_TAGS) {
      finalTags.unshift(intent);
    }
    const q = postQuestion({
      title,
      body,
      tags: finalTags.slice(0, MAX_TAGS),
      linkedItemId: linkedItemId || undefined,
      photoDataUrls: photos,
    });
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
          <ChipRadioGroup
            ariaLabel="Question intent"
            options={ASK_INTENT_OPTIONS}
            value={intent}
            onChange={(v) => setIntent(parseIntent(v))}
            allowEmpty
          />
          <p className="m-0 text-[13px] text-muted-2">
            {intentMeta
              ? intentMeta.blurb
              : "Pick Fix, Find, Value, or Build so the right people see it."}
          </p>
        </div>

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
            placeholder={intentMeta?.example || "e.g. What’s stuck — be specific"}
            aria-describedby="q-title-help"
            className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none placeholder:text-meta focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <p id="q-title-help" className="m-0 text-[13px] leading-[1.45] text-[#5B6166]">
            {charsNeededHelp(titleLen, MIN_TITLE)}
          </p>
        </div>

        {similar.length ? (
          <div className="rounded-[12px] border border-line bg-ground p-3.5">
            <p className="m-0 mb-2 text-[13px] font-semibold text-ink">Similar solved questions</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {similar.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/q/${q.id}`}
                    className="text-[14px] font-medium text-accent-hover no-underline hover:underline"
                  >
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.55] text-ink outline-none placeholder:text-meta focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <p id="q-body-help" className="m-0 text-[13px] leading-[1.45] text-[#5B6166]">
            {charsNeededHelp(bodyLen, MIN_DETAILS)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Photos</span>
          <PhotoPicker photos={photos} onChange={setPhotos} max={4} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="q-tags" className="text-[14px] font-semibold">
            Tags <span className="font-normal text-muted">(up to {MAX_TAGS})</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="min-h-8 rounded-md border border-line bg-ground px-2.5 py-1 font-mono text-[12px] text-[#3D4249] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[15px] outline-none placeholder:text-meta focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested tags">
            {suggestions.slice(0, 10).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="min-h-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <TagChip>{t}</TagChip>
              </button>
            ))}
          </div>
          {notifyHint ? (
            <p className="m-0 text-[13px] text-[#5B6166]">{notifyHint}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="q-item" className="text-[14px] font-semibold">
            Link an item from your garage <span className="font-normal text-muted">(optional)</span>
          </label>
          {garageItems.length ? (
            <div
              id="q-item"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              role="group"
              aria-label="Link a garage item"
            >
              <button
                type="button"
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
              {garageItems.slice(0, 6).map((item) => {
                const on = linkedItemId === item.id;
                const photo = getItemPhotoUrls(item)[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLinkedItemId(item.id)}
                    className={`rounded-[10px] border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      on ? "border-accent bg-accent-soft" : "border-line bg-white"
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
            <p className="m-0 text-[13px] text-meta">
              No garage items yet — you can still ask without linking one.
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
