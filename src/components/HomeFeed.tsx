"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getAllQuestions,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";
import type { Question } from "@/lib/data/seed";
import {
  FEED_INTENT_OPTIONS,
  questionMatchesIntent,
} from "@/lib/skills/feedTopics";
import { ChipRadioGroup } from "./ChipRadioGroup";
import { EmptyState } from "./EmptyState";
import { QuestionCard } from "./QuestionCard";

const SORTS = [
  { value: "Unanswered", label: "Unanswered" },
  { value: "Newest", label: "Newest" },
  { value: "Trending", label: "Trending" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const PAGE_SIZE = 5;

/** "6h ago" / "2d ago" / "just now" → hours. Unknown strings count as a day old. */
function ageHours(time: string): number {
  const t = time.trim().toLowerCase();
  if (!t || t.includes("just now")) return 0;
  const m = t.match(/(\d+)\s*(m|min|h|hr|d|w|mo|y)/);
  if (!m) return 24;
  const n = Number(m[1]);
  switch (m[2]) {
    case "m":
    case "min":
      return n / 60;
    case "h":
    case "hr":
      return n;
    case "d":
      return n * 24;
    case "w":
      return n * 24 * 7;
    case "mo":
      return n * 24 * 30;
    default:
      return n * 24 * 365;
  }
}

/** votes + 2 × answers, halved every 72h. */
export function trendingScore(q: Question): number {
  return (Math.max(q.votes, 0) + q.answers * 2 + 1) / (1 + ageHours(q.time) / 72);
}

export function HomeFeed() {
  const [sort, setSort] = useState<Sort>("Unanswered");
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    function sync() {
      setQuestions(getAllQuestions());
      setSignedIn(Boolean(getSessionHandle()));
      setReady(true);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("sort");
    if (s === "Unanswered" || s === "Newest" || s === "Trending") {
      setSort(s);
    }
  }, []);

  const filtered = useMemo(() => {
    const list = questions.filter((q) => {
      if (sort === "Unanswered" && q.solved) return false;
      return questionMatchesIntent(q.tags, category);
    });
    if (sort === "Trending") {
      // Score = (votes + 2×answers + 1) / (1 + ageHours/72) — fresher + more engagement rises.
      return list.sort((a, b) => trendingScore(b) - trendingScore(a));
    }
    if (sort === "Unanswered") {
      return list.sort((a, b) => ageHours(a.time) - ageHours(b.time));
    }
    // Newest
    return list.sort((a, b) => ageHours(a.time) - ageHours(b.time));
  }, [questions, sort, category]);

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;

  const empty =
    filtered.length === 0
      ? questions.length > 0
        ? {
            title: "No questions in this view",
            description:
              "Try another filter, or ask the community — Fix, Find, Value, Build, or Other.",
            actionLabel: "Ask the community",
            actionHref: "/ask",
          }
        : signedIn
          ? {
              title: "Your workbench is empty",
              description: "Ask a question to get help from the community.",
              actionLabel: "Ask the community",
              actionHref: "/ask",
            }
          : {
              title: "No questions yet",
              description: "Log in to ask the community and follow threads.",
              actionLabel: "Log in",
              actionHref: "/auth?mode=login&next=/",
            }
      : null;

  return (
    <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
      <h2 className="section-title m-0 text-[28px]">From the workbench</h2>

      <div className="flex flex-wrap items-center gap-3">
        <ChipRadioGroup
          ariaLabel="Filter by intent"
          className="flex min-w-0 flex-[1_1_280px] flex-wrap gap-2"
          options={FEED_INTENT_OPTIONS}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setVisible(PAGE_SIZE);
          }}
        />
        <label className="ml-auto inline-flex items-center gap-2 text-[14px] text-muted">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort);
              setVisible(PAGE_SIZE);
            }}
            className="cf-select h-10 rounded-[10px] border border-[#D4D3CD] bg-white pl-3 text-[14px] font-semibold text-ink"
            aria-label="Sort questions"
            title={
              sort === "Trending"
                ? "Trending ranks by votes + answers, favoring fresher threads"
                : undefined
            }
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!ready ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Loading questions"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[7.5rem] animate-pulse rounded-[14px] border border-line bg-surface"
            />
          ))}
        </div>
      ) : empty ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          actionLabel={empty.actionLabel}
          actionHref={empty.actionHref}
        />
      ) : (
        shown.map((q) => <QuestionCard key={q.id} q={q} />)
      )}

      {ready && remaining > 0 ? (
        <div className="flex flex-col items-center pt-2">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex h-11 items-center rounded-[10px] border border-[#D4D3CD] bg-white px-6 text-[15px] font-semibold text-ink hover:border-ink"
          >
            Load more
            <span className="ml-2 font-mono text-[12px] text-meta">{remaining} left</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
