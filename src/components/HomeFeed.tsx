"use client";

import { useState } from "react";
import Link from "next/link";
import { questions } from "@/lib/data/seed";
import { QuestionCard } from "./QuestionCard";
import { SegmentedControl } from "./ui";

const tabs = ["Trending", "Unanswered", "Rare parts", "Repairs", "Builds"];

export function HomeFeed() {
  const [tab, setTab] = useState("Trending");

  const filtered = questions.filter((q) => {
    if (tab === "Unanswered") return !q.solved;
    if (tab === "Rare parts") return q.tags.some((t) => t.includes("rare") || t.includes("campagnolo"));
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
      {filtered.map((q) => (
        <QuestionCard key={q.id} q={q} />
      ))}
      <Link
        href="/q/seized-seatpost"
        className="self-center px-5 py-3 text-[15px] font-semibold"
      >
        Load more questions
      </Link>
    </div>
  );
}
