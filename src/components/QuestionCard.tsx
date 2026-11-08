"use client";

import Link from "next/link";
import { ChevronUp, MessageCircle, Check } from "lucide-react";
import type { Question } from "@/lib/data/seed";
import {
  getGarageItemsFor,
  getItemLocal,
  getItemPhotoUrls,
  resolvePerson,
} from "@/lib/data/local-store";
import { abbreviatedDisplayName } from "@/lib/auth/user";
import { Avatar, TagChip } from "./ui";

function relatedGarageCount(handle: string, tags: string[]): number {
  const items = getGarageItemsFor(handle);
  if (!items.length) return 0;
  const needles = tags.map((t) => t.toLowerCase().replace(/-/g, " "));
  const hits = items.filter((i) => {
    const hay = `${i.name} ${i.cat} ${i.description ?? ""}`.toLowerCase();
    return needles.some((n) => n.length > 2 && hay.includes(n));
  });
  return hits.length || items.length;
}

export function QuestionCard({ q }: { q: Question }) {
  const linkedItem = q.linkedItemId ? getItemLocal(q.linkedItemId) : undefined;
  const linkedPhotos = linkedItem ? getItemPhotoUrls(linkedItem) : [];
  const linkedLabel = q.linked || linkedItem?.name || "";
  const askerName = abbreviatedDisplayName(q.asker);
  const solver = q.expertHandle ? resolvePerson(q.expertHandle) : undefined;
  const related =
    q.solved && q.expertHandle ? relatedGarageCount(q.expertHandle, q.tags) : 0;

  return (
    <article className="flex gap-[18px] rounded-[14px] border border-line bg-surface p-5">
      <div className="flex w-[52px] shrink-0 flex-col items-center gap-0.5">
        <button
          type="button"
          aria-label="Upvote"
          className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-white hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <span className="font-mono text-base font-medium">
          {q.votes}
          <span className="sr-only"> votes</span>
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Link
          href={`/q/${q.id}`}
          className="text-[19px] font-semibold leading-[1.35] text-ink no-underline hover:text-accent-hover visited:text-ink"
        >
          {q.title}
        </Link>
        <p className="m-0 text-[15px] leading-normal text-meta">{q.excerpt}</p>

        {q.tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {q.tags.map((tg) => (
              <TagChip key={tg}>{tg}</TagChip>
            ))}
          </div>
        ) : null}

        {linkedLabel && (q.linkedItemId || q.linked) ? (
          <Link
            href={q.linkedItemId ? `/i/${q.linkedItemId}` : `/q/${q.id}`}
            className="inline-flex max-w-full items-center gap-2.5 self-start rounded-[10px] border border-line bg-ground py-1.5 pr-3 pl-1.5 text-ink no-underline hover:border-accent hover:text-accent-hover"
          >
            {linkedPhotos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={linkedPhotos[0]}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft font-mono text-[11px] text-accent-hover">
                Bike
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[11px] font-medium tracking-wide text-meta uppercase">
                In garage
              </span>
              <span className="block truncate text-[13px] font-semibold">{linkedLabel}</span>
            </span>
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 text-[13px] text-meta">
          <Link
            href={q.askerHandle ? `/u/${q.askerHandle}` : "/"}
            className="inline-flex items-center gap-2 font-medium text-ink no-underline hover:text-accent-hover"
          >
            <Avatar init={q.init} bg={q.bg} size={26} />
            {askerName}
          </Link>
          <span>{q.time}</span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" aria-hidden />
            {q.answers === 1 ? "1 answer" : `${q.answers} answers`}
          </span>
          {q.solved && q.expert ? (
            <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-status-accepted-soft px-2.5 py-0.5 font-semibold text-status-accepted">
              <Check className="size-3.5 stroke-[2.6]" aria-hidden />
              Solved by {abbreviatedDisplayName(q.expert)}
              {solver && related > 0 ? (
                <span className="font-normal text-status-accepted/80">
                  · {related} related garage item{related === 1 ? "" : "s"}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
