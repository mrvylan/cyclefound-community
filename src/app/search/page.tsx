"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, StatusChip } from "@/components/ui";
import {
  getAllItems,
  getMergedPerson,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  groupSearchHits,
  searchLocal,
  type SearchHit,
} from "@/lib/search/localSearch";

function sectionTitle(kind: SearchHit["kind"], count: number) {
  if (kind === "member") return `${count} member${count === 1 ? "" : "s"}`;
  if (kind === "question") return `${count} question${count === 1 ? "" : "s"}`;
  return `${count} garage item${count === 1 ? "" : "s"}`;
}

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(initial);
  const [tick, setTick] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  useEffect(() => {
    setSignedIn(Boolean(getSessionHandle()));
    return subscribeStore(() => {
      setSignedIn(Boolean(getSessionHandle()));
      setTick((t) => t + 1);
    });
  }, []);

  void tick;

  const hits = useMemo(() => searchLocal(query), [query, tick]);
  const grouped = useMemo(() => groupSearchHits(hits), [hits]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-8 pb-8 pt-12">
          <p className="eyebrow m-0">Search</p>
          <h1 className="section-title m-0 text-[clamp(36px,6vw,64px)]">
            Find people, questions, and garage items
          </h1>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.55] text-muted-2">
            Pre-Alpha search runs against the community data you can see right now. Full-text
            search in Postgres lands when questions and garages move to Supabase.
          </p>
          <form
            role="search"
            onSubmit={onSubmit}
            className="mt-2 flex h-12 max-w-[560px] items-center gap-2 rounded-[10px] border border-line bg-white px-3"
          >
            <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
            <label htmlFor="site-search" className="sr-only">
              Search Cycle Found
            </label>
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members, questions, items…"
              autoFocus
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#929792]"
            />
            <button
              type="submit"
              className="h-9 shrink-0 rounded-[8px] border-0 bg-accent px-3.5 text-[13px] font-semibold text-white hover:bg-accent-hover"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-8 py-8 pb-16">
        {!query.trim() ? (
          <EmptyState
            title="Start a search"
            description="Try a member name, a part, a tag like “campagnolo”, or words from a question."
            actionLabel="Browse members"
            actionHref="/members"
          />
        ) : hits.length === 0 ? (
          <EmptyState
            title={`No results for “${query.trim()}”`}
            description={
              signedIn
                ? "Nothing matched in the profiles, questions, and garage items you can see. Insert mock data from the header to search the sample community."
                : "Log in to search your community data, or insert mock data from the header to explore sample results."
            }
            actionLabel={signedIn ? "Ask the community" : "Log in"}
            actionHref={signedIn ? "/ask" : "/auth?mode=login&next=/search"}
          />
        ) : (
          <div className="flex flex-col gap-10">
            <p className="m-0 text-[15px] text-muted-2">
              <strong className="text-ink">{hits.length}</strong> result
              {hits.length === 1 ? "" : "s"} for “{query.trim()}”
            </p>

            {grouped.members.length ? (
              <section>
                <h2 className="section-title mb-4 mt-0 text-[20px]">
                  {sectionTitle("member", grouped.members.length)}
                </h2>
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-0">
                  {grouped.members.map((hit) => {
                    const person = getMergedPerson(hit.id);
                    return (
                      <li key={hit.id}>
                        <Link
                          href={hit.href}
                          className="flex items-center gap-3 rounded-[14px] border border-line bg-surface p-4 text-ink no-underline hover:text-ink"
                        >
                          <Avatar
                            init={person?.init ?? "??"}
                            bg={person?.bg ?? "#527D31"}
                            size={44}
                            src={person?.avatarUrl}
                          />
                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold">{hit.title}</span>
                            <span className="block text-[13px] text-muted">{hit.subtitle}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {grouped.questions.length ? (
              <section>
                <h2 className="section-title mb-4 mt-0 text-[20px]">
                  {sectionTitle("question", grouped.questions.length)}
                </h2>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {grouped.questions.map((hit) => (
                    <li key={hit.id}>
                      <Link
                        href={hit.href}
                        className="block rounded-[14px] border border-line bg-surface px-5 py-4 text-ink no-underline hover:text-ink"
                      >
                        <span className="block text-[16px] font-semibold leading-snug">
                          {hit.title}
                        </span>
                        <span className="mt-1 block text-[13px] text-muted">{hit.subtitle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {grouped.items.length ? (
              <section>
                <h2 className="section-title mb-4 mt-0 text-[20px]">
                  {sectionTitle("item", grouped.items.length)}
                </h2>
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-0">
                  {grouped.items.map((hit) => {
                    const item = getAllItems().find((i) => i.id === hit.id);
                    return (
                      <li key={hit.id}>
                        <Link
                          href={hit.href}
                          className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4 text-ink no-underline hover:text-ink"
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-[15px] font-semibold leading-snug">
                              {hit.title}
                            </span>
                            {item ? <StatusChip status={item.status} /> : null}
                          </span>
                          <span className="text-[13px] text-muted">{hit.subtitle}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
          Loading search…
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
