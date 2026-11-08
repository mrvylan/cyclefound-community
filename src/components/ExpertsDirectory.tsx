"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, LevelBadge } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { getExpertsLocal, listMembers, subscribeStore } from "@/lib/data/local-store";
import type { Person } from "@/lib/data/seed";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";

export function ExpertsDirectory() {
  const [experts, setExperts] = useState<Person[]>([]);
  const [skillChips, setSkillChips] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setExperts(getExpertsLocal());
      const counts = new Map<string, number>();
      for (const p of listMembers()) {
        for (const s of normalizeSkillLabels(p.skills)) {
          counts.set(s, (counts.get(s) ?? 0) + 1);
        }
      }
      setSkillChips(
        [...counts.entries()]
          .filter(([, n]) => n > 0)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 6)
          .map(([label]) => label),
      );
    };
    sync();
    return subscribeStore(sync);
  }, []);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-[18px] px-8 pb-8 pt-12">
          <p className="eyebrow m-0">The people behind the answers</p>
          <h1 className="section-title m-0 text-[clamp(36px,6vw,64px)]">
            Find someone who&apos;s done it before
          </h1>
          <p className="m-0 max-w-[680px] text-[18px] leading-[1.55] text-muted-2">
            Every expert is ranked by what they&apos;ve actually contributed — accepted answers,
            reviews from members they&apos;ve helped, and the garages they&apos;ve documented.
          </p>
          {skillChips.length ? (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {["All", ...skillChips].map((label, i) => (
                <Link
                  key={label}
                  href={
                    label === "All"
                      ? "/members"
                      : `/members?skill=${encodeURIComponent(label)}`
                  }
                  className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium no-underline ${
                    i === 0
                      ? "border-ink bg-ink text-white hover:text-white"
                      : "border-[#D4D3CD] bg-white text-ink hover:border-ink hover:text-ink"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-8 px-8 py-8 pb-16">
        <aside
          aria-label="Filters"
          className="flex max-w-[320px] min-w-0 flex-[1_1_260px] flex-col gap-[22px] rounded-2xl border border-line bg-surface p-[22px]"
        >
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2 text-[15px] font-bold">Location</legend>
            <label htmlFor="loc" className="sr-only">
              Near
            </label>
            <input
              id="loc"
              type="text"
              defaultValue="San Jose, CA"
              className="h-11 rounded-lg border border-[#D4D3CD] px-3 text-[14px]"
            />
            <label htmlFor="rad" className="sr-only">
              Radius
            </label>
            <select
              id="rad"
              className="cf-select h-11 rounded-lg border border-[#D4D3CD] bg-white pl-2.5 text-[14px]"
            >
              <option>Within 25 miles</option>
              <option>Within 50 miles</option>
              <option>Anywhere (remote help)</option>
            </select>
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2 text-[15px] font-bold">Minimum rating</legend>
            {["4.5 ★ and up", "4.0 ★ and up", "Any"].map((label, i) => (
              <label key={label} className="flex items-center gap-2.5 text-[14px]">
                <input
                  type="radio"
                  name="r"
                  defaultChecked={i === 0}
                  className="size-[18px] accent-accent"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2 text-[15px] font-bold">Available for</legend>
            {[
              ["Open to questions", true],
              ["Paid video consults", false],
              ["In-person work / shop", false],
              ["Lends tools", false],
              ["Has items for sale or trade", false],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center gap-2.5 text-[14px]">
                <input
                  type="checkbox"
                  defaultChecked={Boolean(checked)}
                  className="size-[18px] accent-accent"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2 text-[15px] font-bold">Spokes level</legend>
            {[
              ["Master · 10k+", true],
              ["Pro · 2.5k–10k", true],
              ["Rider · under 2.5k", false],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center gap-2.5 text-[14px]">
                <input
                  type="checkbox"
                  defaultChecked={Boolean(checked)}
                  className="size-[18px] accent-accent"
                />
                {label}
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-[15px] text-muted-2">
              <strong className="text-ink">{experts.length} experts</strong> near San Jose
            </p>
            <label className="inline-flex items-center gap-2 text-[14px] text-muted">
              Sort
              <select className="cf-select h-10 rounded-lg border border-[#D4D3CD] bg-white pl-2.5 text-ink">
                <option>Most helpful</option>
                <option>Highest rated</option>
                <option>Most Spokes</option>
                <option>Nearest</option>
              </select>
            </label>
          </div>

          {experts.length === 0 ? (
            <EmptyState
              title="No experts to show"
              description="Verified experts will appear here as members earn badges. Browse members in the meantime."
              actionLabel="Browse members"
              actionHref="/members"
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
              {experts.map((e) => (
                <article
                  key={e.handle}
                  className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-[22px]"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      init={e.init}
                      bg={e.bg}
                      size={60}
                      href={`/u/${e.handle}`}
                      src={e.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/u/${e.handle}`}
                        className="text-[17px] font-bold text-ink no-underline hover:text-accent-hover"
                      >
                        {e.name}
                      </Link>
                      <div className="mt-0.5 text-[13px] text-muted">{e.loc}</div>
                      <div className="mt-1.5">
                        <LevelBadge level={e.level} bright={e.level === "MASTER"} />
                      </div>
                    </div>
                  </div>
                  <p className="m-0 text-[14px] leading-normal text-muted-2">{e.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {e.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line bg-ground px-2.5 py-1 text-[12px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-center">
                    <div>
                      <div className="font-mono text-[16px] font-medium">{e.rating}</div>
                      <div className="text-[11px] text-muted">{e.reviews} reviews</div>
                    </div>
                    <div>
                      <div className="font-mono text-[16px] font-medium">{e.spokes}</div>
                      <div className="text-[11px] text-muted">Spokes</div>
                    </div>
                    <div>
                      <div className="font-mono text-[16px] font-medium">{e.accepted}</div>
                      <div className="text-[11px] text-muted">accepted</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/u/${e.handle}`}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                    >
                      Ask {e.name.split(" ")[0]}
                    </Link>
                    {e.consult ? (
                      <span className="inline-flex h-11 items-center rounded-[10px] border border-line px-3 text-[13px] text-muted">
                        {e.consult}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
