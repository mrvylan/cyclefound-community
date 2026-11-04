import Link from "next/link";
import { ChevronUp, Home, MessageCircle, Check } from "lucide-react";
import type { Question } from "@/lib/data/seed";
import { Avatar, TagChip } from "./ui";

export function QuestionCard({ q }: { q: Question }) {
  return (
    <article className="flex gap-[18px] rounded-[14px] border border-line bg-surface p-5">
      <div className="flex w-[52px] shrink-0 flex-col items-center gap-0.5">
        <button
          type="button"
          aria-label="Upvote"
          className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-line bg-white"
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <span className="font-mono text-base font-medium">{q.votes}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {q.tags.map((tg) => (
            <TagChip key={tg}>{tg}</TagChip>
          ))}
        </div>
        <Link
          href={`/q/${q.id}`}
          className="text-[19px] font-semibold leading-[1.35] text-ink no-underline hover:text-accent-hover"
        >
          {q.title}
        </Link>
        <p className="m-0 text-[15px] leading-normal text-muted">{q.excerpt}</p>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 text-[13px] text-muted">
          <Link
            href="/u/lugged_marco"
            className="inline-flex items-center gap-2 font-medium text-ink no-underline hover:text-accent-hover"
          >
            <Avatar init={q.init} bg={q.bg} size={26} />
            {q.asker}
          </Link>
          <span>{q.time}</span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" aria-hidden />
            {q.answers} answers
          </span>
          {q.solved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-2.5 py-0.5 font-semibold text-blue">
              <Check className="size-3.5 stroke-[2.6]" aria-hidden />
              Solved by {q.expert}
            </span>
          ) : null}
          {q.linked ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent-hover">
              <Home className="size-3.5" aria-hidden />
              {q.linked}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
