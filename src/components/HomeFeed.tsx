"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllQuestions, subscribeStore } from "@/lib/data/local-store";
import { EmptyState } from "./EmptyState";
import { QuestionCard } from "./QuestionCard";
import { SegmentedControl } from "./ui";

const tabs = ["Trending", "Unanswered", "Rare parts", "Repairs", "Builds"];

export function HomeFeed() {
  const [tab, setTab] = useState("Trending");
  const [questions, setQuestions] = useState(() => getAllQuestions());

  useEffect(() => {
    setQuestions(getAllQuestions());
    return subscribeStore(() => setQuestions(getAllQuestions()));
  }, []);

  const filtered = questions.filter((q) => {
    if (tab === "Unanswered") return !q.solved;
    if (tab === "Rare parts")
      return q.tags.some((t) => t.includes("rare") || t.includes("campagnolo"));
    if (tab === "Repairs") return q.tags.includes("repair");
    if (tab === "Builds") return q.tags.includes("build");
    return true;
  });

  return (
    <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display m-0 text-[34px]">From the workbench</h2>
        <SegmentedControl
          options={tabs}
          value={tab}
          onChange={setTab}
          ariaLabel="Filter questions"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="No questions in this view"
          description="Be the first to ask — repairs, rare parts, and builds all belong here."
          actionLabel="Ask the community"
          actionHref="/ask"
        />
      ) : (
        filtered.map((q) => <QuestionCard key={q.id} q={q} />)
      )}
      {filtered.length > 0 ? (
        <Link href="/ask" className="self-center px-5 py-3 text-[15px] font-semibold">
          Ask a question
        </Link>
      ) : null}
    </div>
  );
}
