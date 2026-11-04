"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { topicRoutes } from "@/lib/data/seed";
import { FilterChip } from "./ui";

const topics = Object.keys(topicRoutes);

export function HomeAskBox() {
  const [topic, setTopic] = useState("Rare / vintage parts");

  return (
    <form
      className="flex flex-col gap-3.5 rounded-[14px] border border-[#D4D3CD] bg-white p-[18px] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="askq" className="text-[15px] font-semibold">
        What are you trying to figure out?
      </label>
      <textarea
        id="askq"
        rows={2}
        placeholder="e.g. Looking for a 1980s Campagnolo Super Record rear derailleur cage — who has one?"
        className="resize-none border-0 bg-transparent text-base leading-normal text-ink outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        {topics.map((t) => (
          <FilterChip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </FilterChip>
        ))}
        <span className="min-w-5 flex-1" />
        <Link
          href="/q/seized-seatpost"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-[22px] text-[15px] font-semibold text-white no-underline hover:bg-ink hover:text-white"
        >
          Ask <ArrowRight className="size-4 stroke-[2.2]" aria-hidden />
        </Link>
      </div>
      <p className="m-0 text-[13px] text-muted">
        Your question goes to the feed and is routed to{" "}
        <strong className="text-ink">{topicRoutes[topic]} members</strong> with verified{" "}
        <strong className="text-ink">{topic.toLowerCase()}</strong> expertise.
      </p>
    </form>
  );
}
