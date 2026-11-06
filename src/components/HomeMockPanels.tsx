"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Feature } from "@/components/Feature";
import { Avatar } from "@/components/ui";
import { getExpertsLocal, isMockDataEnabled, subscribeStore } from "@/lib/data/local-store";
import {
  areas,
  formatWantedMatches,
  formatWantedOwner,
  leaders,
  wanted,
} from "@/lib/data/seed";

/** Home side panels that use seed/mock people — empty until Insert Mock Data. */
export function HomeExpertsOnline() {
  const [online, setOnline] = useState<ReturnType<typeof getExpertsLocal>>([]);

  useEffect(() => {
    const sync = () => setOnline(getExpertsLocal().slice(0, 4));
    sync();
    return subscribeStore(sync);
  }, []);

  if (!online.length) return null;

  return (
    <aside
      aria-label="Experts online now"
      className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl bg-ink p-6 text-white"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display m-0 text-[22px] font-bold tracking-[0.02em]">
          In the shop now
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-on-dark-muted">
          <span className="size-2 rounded-full bg-[#4ADE80]" aria-hidden />
          Online
        </span>
      </div>
      {online.map((p) => (
        <Link
          key={p.handle}
          href={`/u/${p.handle}`}
          className="flex items-center gap-3 rounded-xl bg-ink-2 p-3 text-white no-underline hover:text-white"
        >
          <Avatar init={p.init} bg={p.bg} size={44} src={p.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{p.name}</span>
            <span className="text-[13px] text-on-dark-muted">{p.role}</span>
          </span>
          <span className="flex flex-col items-end gap-0.5 text-[13px]">
            <span className="inline-flex items-center gap-1">
              <Star
                className="size-3.5 fill-accent-bright text-accent-bright"
                aria-hidden
              />
              {p.rating}
            </span>
            <Feature name="spokesCurrency">
              <span className="font-mono text-on-dark-muted">{p.spokes} sp</span>
            </Feature>
          </span>
        </Link>
      ))}
      <Link
        href="/experts"
        className="text-[14px] font-semibold text-accent-bright no-underline hover:text-accent"
      >
        Browse all experts →
      </Link>
    </aside>
  );
}

export function HomeTopContributors() {
  const [mock, setMock] = useState(false);

  useEffect(() => {
    const sync = () => setMock(isMockDataEnabled());
    sync();
    return subscribeStore(sync);
  }, []);

  if (!mock) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h2 className="font-display m-0 text-[22px]">Top contributors</h2>
        <span className="text-[13px] text-muted">This month</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {leaders.map((l) => (
          <li key={l.handle}>
            <Link
              href={`/u/${l.handle}`}
              className="flex items-center gap-3 py-2 text-ink no-underline hover:text-accent-hover"
            >
              <span className="w-[18px] font-mono text-[13px] text-muted">{l.rank}</span>
              <Avatar init={l.init} bg={l.bg} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{l.name}</span>
                <span className="block text-[12px] text-muted">{l.role}</span>
              </span>
              <span className="font-mono text-[13px] font-medium text-accent-hover">
                +{l.gain}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeWantedBoard() {
  const [mock, setMock] = useState(false);

  useEffect(() => {
    const sync = () => setMock(isMockDataEnabled());
    sync();
    return subscribeStore(sync);
  }, []);

  if (!mock) return null;

  return (
    <section className="rounded-[14px] border border-accent-soft-border bg-accent-soft p-5">
      <h2 className="font-display mb-1 mt-0 text-[22px]">Wanted board</h2>
      <p className="mb-3.5 mt-0 text-[13px] text-[#3d5f24]">
        Members hunting for specific parts.
        <Feature name="wantedMatching">
          {" "}
          Matches in garages are flagged automatically.
        </Feature>
      </p>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {wanted.map((w) => (
          <li
            key={w.id}
            className="flex flex-col gap-1.5 rounded-[10px] border border-accent-soft-border bg-white px-3.5 py-3"
          >
            <Link
              href={`/u/${w.ownerHandle}`}
              className="text-[14px] font-semibold leading-snug text-ink no-underline hover:text-accent-hover"
            >
              {w.part}
            </Link>
            <span className="flex justify-between text-[12px] text-muted">
              <span>{formatWantedOwner(w)}</span>
              <Feature name="wantedMatching">
                <span className="font-semibold text-accent-hover">
                  {formatWantedMatches(w)}
                </span>
              </Feature>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeBrowseExpertise() {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="font-display mb-3.5 mt-0 text-[22px]">Browse by expertise</h2>
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <Link
            key={a.label}
            href="/members"
            className="rounded-full border border-[#D4D3CD] px-3 py-1.5 text-[13px] text-ink no-underline hover:border-ink hover:text-ink"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
