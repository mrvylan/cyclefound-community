"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronUp } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import { AnswerComposer } from "@/components/forms/AnswerComposer";
import { SessionPicker } from "@/components/forms/SessionPicker";
import {
  Avatar,
  ExpertiseBadge,
  PlaceholderPhoto,
  TagChip,
} from "@/components/ui";
import {
  acceptAnswer,
  getAllAnswers,
  getItemLocal,
  getMergedPerson,
  getQuestionLocal,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";
import { getExperts } from "@/lib/data/seed";

export default function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("ben_carver");
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    setReady(true);
    setSessionHandle(getSessionHandle());
    return subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((t) => t + 1);
    });
  }, []);

  // tick forces re-read after local store writes
  void tick;

  const q = getQuestionLocal(id);

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading question…
      </div>
    );
  }

  if (!q) notFound();

  const thread = getAllAnswers(id);
  const sidebarExperts = getExperts().slice(0, 3);
  const linkedItem = q.linkedItemId ? getItemLocal(q.linkedItemId) : undefined;
  const linkedOwner = linkedItem ? getMergedPerson(linkedItem.ownerHandle) : undefined;
  const isAsker = sessionHandle === q.askerHandle;
  const votes = voted ? q.votes + 1 : q.votes;
  const photosRaw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`cf_q_photos_${id}`)
      : null;
  const questionPhotos: string[] = photosRaw ? JSON.parse(photosRaw) : [];

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-7 pb-16">
      <Feature name="categoryBreadcrumbs">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap gap-2 text-[13px] text-muted"
        >
          <Link href="/">Community</Link>
          <span aria-hidden>/</span>
          <Link href="/">Repair & maintenance</Link>
          <span aria-hidden>/</span>
          <span>Seatposts & frames</span>
        </nav>
      </Feature>

      <div className="mb-4">
        <SessionPicker />
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
          <article className="flex flex-col gap-[18px] rounded-2xl border border-line bg-surface p-7">
            <div className="flex flex-wrap items-center gap-2">
              {q.solved ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-accepted-soft px-2.5 py-1 text-[13px] font-semibold text-status-accepted">
                  <Check className="size-3.5 stroke-[2.6]" aria-hidden />
                  Solved
                </span>
              ) : null}
              <Feature name="spokesCurrency">
                {q.bounty ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-soft-border bg-accent-soft px-2.5 py-1 text-[13px] font-semibold text-accent-hover">
                    +{q.bounty} Spokes bounty · awarded
                  </span>
                ) : null}
              </Feature>
              {q.tags.map((t) => (
                <TagChip key={t}>{t}</TagChip>
              ))}
            </div>

            <h1 className="font-display m-0 text-[clamp(28px,4vw,40px)] leading-[1.05]">
              {q.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 text-[14px] text-muted">
              <Link
                href={q.askerHandle ? `/u/${q.askerHandle}` : "/"}
                className="inline-flex items-center gap-2 font-semibold text-ink no-underline hover:text-accent-hover"
              >
                <Avatar init={q.init} bg={q.bg} size={30} />
                {q.asker}
              </Link>
              <span>Asked {q.time.replace(" ago", "")} ago</span>
              <Feature name="viewCounts">
                {q.views ? <span>{q.views.toLocaleString()} views</span> : null}
              </Feature>
            </div>

            <div className="flex flex-col gap-3 text-base leading-[1.65] text-[#2A2E33]">
              {(q.body ?? [q.excerpt]).map((p) => (
                <p key={p.slice(0, 24)} className="m-0">
                  {p}
                </p>
              ))}
            </div>

            {questionPhotos.length ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {questionPhotos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src.slice(0, 40)}
                    src={src}
                    alt=""
                    className="h-[150px] w-full rounded-[10px] object-cover"
                  />
                ))}
              </div>
            ) : id === "seized-seatpost" ? (
              <div className="grid grid-cols-3 gap-2.5">
                {["seat cluster", "corrosion at collar", "frame overall"].map((label) => (
                  <PlaceholderPhoto
                    key={label}
                    label={`Photo: ${label}`}
                    className="h-[150px] rounded-[10px]"
                  />
                ))}
              </div>
            ) : null}

            {linkedItem && linkedOwner ? (
              <Link
                href={`/i/${linkedItem.id}`}
                className="flex items-center gap-3.5 rounded-xl border border-line bg-ground p-3 text-ink no-underline hover:text-ink"
              >
                <PlaceholderPhoto className="size-14 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[12px] text-muted">
                    FROM {linkedOwner.name.split(" ")[0].toUpperCase()}&apos;S GARAGE
                  </span>
                  <span className="block font-semibold">{linkedItem.name}</span>
                </span>
                <span className="text-[13px] text-muted">{linkedItem.status}</span>
              </Link>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
              <button
                type="button"
                onClick={() => setVoted((v) => !v)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#D4D3CD] px-3.5 text-[14px] font-semibold ${
                  voted ? "bg-ink text-white" : "bg-white text-ink"
                }`}
              >
                <ChevronUp className="size-[15px] stroke-[2.2]" aria-hidden />
                Useful · {votes}
              </button>
              <Feature name="followGarage">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold"
                >
                  Follow
                </button>
              </Feature>
              <Feature name="saveToResources">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold"
                >
                  Save to resources
                </button>
              </Feature>
              <button
                type="button"
                className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold"
              >
                Share
              </button>
            </div>
          </article>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display m-0 text-[28px]">
              {thread.length} answer{thread.length === 1 ? "" : "s"}
            </h2>
            <Feature name="answerSort">
              <label className="inline-flex items-center gap-2 text-[14px] text-muted">
                Sort by
                <select className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-2.5 text-ink">
                  <option>Expert rating</option>
                  <option>Most useful</option>
                  <option>Newest</option>
                </select>
              </label>
            </Feature>
          </div>

          {thread.length === 0 ? (
            <EmptyState
              title="No answers yet"
              description="Know how to help? Be the first to answer this question."
              actionLabel="Write an answer"
              actionHref="#answer"
            />
          ) : (
            thread.map((a) => {
              const author = getMergedPerson(a.handle);
              const aPhotosRaw =
                typeof window !== "undefined"
                  ? sessionStorage.getItem(`cf_a_photos_${a.id}`)
                  : null;
              const aPhotos: string[] = aPhotosRaw ? JSON.parse(aPhotosRaw) : [];
              return (
                <article
                  key={a.id}
                  className={`overflow-hidden rounded-2xl ${
                    a.accepted
                      ? "border-2 border-status-accepted-border bg-white"
                      : "border border-line bg-white"
                  }`}
                >
                  {a.accepted ? (
                    <div className="flex items-center gap-2 bg-status-accepted-soft px-6 py-2.5 text-[14px] font-semibold text-status-accepted">
                      <Check className="size-4 stroke-[2.6]" aria-hidden />
                      Accepted by {q.asker.split(" ")[0]}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-4 p-6">
                    <div className="flex flex-wrap items-center gap-3.5">
                      <Avatar
                        init={a.init}
                        bg={a.bg}
                        size={52}
                        href={`/u/${a.handle}`}
                        label={a.name}
                      />
                      <div className="min-w-[200px] flex-1">
                        <Link
                          href={`/u/${a.handle}`}
                          className="text-[17px] font-bold text-ink no-underline hover:text-accent-hover"
                        >
                          {a.name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
                          <span>★ {a.rating}</span>
                          <Feature name="spokesCurrency">
                            <span className="font-mono">{a.spokes} Spokes</span>
                          </Feature>
                          <Feature
                            name="verifiedBadges"
                            fallback={
                              author?.roleBadge ? (
                                <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-accent-hover">
                                  {author.roleBadge}
                                </span>
                              ) : null
                            }
                          >
                            <ExpertiseBadge
                              area={a.badge.replace("Verified · ", "")}
                            />
                          </Feature>
                          <span>{a.time}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          aria-label="Upvote answer"
                          className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-line"
                        >
                          <ChevronUp className="size-4" aria-hidden />
                        </button>
                        <span className="font-mono font-medium">{a.votes}</span>
                      </div>
                    </div>
                    {a.body.map((p) => (
                      <p
                        key={p.slice(0, 32)}
                        className="m-0 text-base leading-[1.65] text-[#2A2E33]"
                      >
                        {p}
                      </p>
                    ))}
                    {aPhotos.length ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {aPhotos.map((src) => (
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
                    <div className="flex flex-wrap gap-2 border-t border-line-soft pt-3">
                      {isAsker && !a.accepted ? (
                        <button
                          type="button"
                          onClick={() => acceptAnswer(id, a.id)}
                          className="h-10 rounded-lg border-0 bg-accent px-3.5 text-[14px] font-semibold text-white hover:bg-accent-hover"
                        >
                          Accept answer
                        </button>
                      ) : null}
                      <Feature name="threadedReplies">
                        <button
                          type="button"
                          className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold"
                        >
                          Reply
                        </button>
                      </Feature>
                      <Feature name="spokesCurrency">
                        <button
                          type="button"
                          className="h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold"
                        >
                          Tip Spokes
                        </button>
                      </Feature>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <AnswerComposer questionId={id} onPosted={() => setTick((t) => t + 1)} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display mb-3 mt-0 text-[22px]">Members on this topic</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {sidebarExperts.map((e) => (
                <li key={e.handle}>
                  <Link
                    href={`/u/${e.handle}`}
                    className="flex items-center gap-3 text-ink no-underline hover:text-accent-hover"
                  >
                    <Avatar init={e.init} bg={e.bg} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{e.name}</span>
                      <span className="block text-[13px] text-muted">
                        {e.roleBadge ?? e.skills[0]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Feature name="partsInGarages">
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-display mb-3 mt-0 text-[22px]">Parts in garages</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
                {[
                  ["Campagnolo Record seatpost 27.0", "3 garages · open to offers", "from $85"],
                  ["Seatpost reamer set", "Marco's garage · lends locally", "Loan"],
                ].map(([n, w, p]) => (
                  <li
                    key={n}
                    className="flex justify-between gap-2 border-b border-line-soft pb-2.5"
                  >
                    <span>
                      <span className="block font-semibold">{n}</span>
                      <span className="text-[12px] text-muted">{w}</span>
                    </span>
                    <span className="font-mono font-medium">{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Feature>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display mb-3 mt-0 text-[22px]">Related</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
              <li>
                <Link
                  href="/q/mavic-spoke-length"
                  className="font-semibold text-ink no-underline hover:text-accent-hover"
                >
                  Rebuilding Mavic Open Pro rims to modern hubs
                </Link>
              </li>
              <li>
                <Link
                  href="/q/super-record-cage"
                  className="font-semibold text-ink no-underline hover:text-accent-hover"
                >
                  1st-gen Super Record rear derailleur cage
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
