"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Feature } from "@/components/Feature";
import { Avatar, PlaceholderPhoto, StatusChip } from "@/components/ui";
import {
  getAllItems,
  getAllQuestions,
  getExpertsLocal,
  getItemPhotoUrls,
  getSessionHandle,
  isMockDataEnabled,
  listMembers,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  formatWantedMatches,
  formatWantedOwner,
  leaders,
  type GarageItem,
  type Person,
  type Question,
  wanted,
} from "@/lib/data/seed";
import { abbreviatedDisplayName } from "@/lib/auth/user";
import {
  groupForLabel,
  normalizeSkillLabels,
  SKILL_GROUPS,
  type SkillGroup,
} from "@/lib/skills/taxonomy";

/** Home side panels for verified experts and market highlights (empty when none). */
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
        <h2 className="section-title m-0 text-[20px] text-white">In the shop now</h2>
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
        <h2 className="section-title m-0 text-[20px]">Top contributors</h2>
        <span className="text-[13px] text-meta">This month</span>
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

function useMockOn() {
  const [mock, setMock] = useState(false);
  useEffect(() => {
    const sync = () => setMock(isMockDataEnabled());
    sync();
    return subscribeStore(sync);
  }, []);
  return mock;
}

/** Local, Spokes-free helper ranking: members with the most accepted answers. */
export function HomeTopHelpers() {
  const mock = useMockOn();
  const [helpers, setHelpers] = useState<Person[]>([]);

  useEffect(() => {
    const sync = () =>
      setHelpers(
        listMembers()
          .filter((p) => p.accepted > 0)
          .sort((a, b) => b.accepted - a.accepted)
          .slice(0, 4),
      );
    sync();
    return subscribeStore(sync);
  }, []);

  if (!mock || helpers.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <h2 className="section-title m-0 text-[20px]">Top helpers</h2>
        <span className="text-[13px] text-meta">Accepted answers</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {helpers.map((p, i) => (
          <li key={p.handle}>
            <Link
              href={`/u/${p.handle}`}
              className="flex min-h-11 items-center gap-3 py-1.5 text-ink no-underline hover:text-accent-hover"
            >
              <span className="w-[18px] font-mono text-[13px] text-meta">{i + 1}</span>
              <Avatar init={p.init} bg={p.bg} size={34} src={p.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{p.name}</span>
                <span className="block truncate text-[12px] text-meta">{p.role}</span>
              </span>
              <span className="font-mono text-[13px] font-medium text-accent-hover">
                {p.accepted} solved
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Newest market listings, from member garages. */
export function HomeRecentlyListed() {
  const mock = useMockOn();
  const [listed, setListed] = useState<GarageItem[]>([]);

  useEffect(() => {
    const sync = () =>
      setListed(
        getAllItems()
          .filter((i) => i.status !== "Not for sale")
          .reverse()
          .slice(0, 4),
      );
    sync();
    return subscribeStore(sync);
  }, []);

  if (!mock || listed.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <h2 className="section-title m-0 text-[20px]">Recently listed</h2>
        <Link href="/market" className="text-[13px] font-semibold">
          Market →
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {listed.map((item) => {
          const photo = getItemPhotoUrls(item)[0];
          return (
            <li key={item.id}>
              <Link
                href={`/i/${item.id}`}
                className="flex min-h-11 items-center gap-3 rounded-[10px] py-1 text-ink no-underline hover:text-accent-hover"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <PlaceholderPhoto silhouette className="size-12 shrink-0 rounded-lg [&_svg]:size-6" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{item.name}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <StatusChip status={item.status} />
                    <span className="font-mono text-[12px] tabular-nums text-meta">
                      {item.ask !== "—" ? item.ask : item.status === "Open to offers" ? "Make an offer" : "—"}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
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
      <h2 className="section-title mb-1 mt-0 text-[20px]">Wanted board</h2>
      <p className="mb-3.5 mt-0 text-[13px] text-[#3d5f24]">
        Sample requests from members hunting for specific parts.
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
            <span className="flex justify-between text-[12px] text-meta">
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
  const [groups, setGroups] = useState<
    Partial<Record<SkillGroup, { label: string; n: number }[]>>
  >({});

  useEffect(() => {
    function sync() {
      const counts = new Map<string, number>();
      for (const p of listMembers()) {
        for (const s of normalizeSkillLabels(p.skills)) {
          counts.set(s, (counts.get(s) ?? 0) + 1);
        }
      }
      const next: Partial<Record<SkillGroup, { label: string; n: number }[]>> = {};
      for (const [label, n] of counts) {
        if (n <= 0) continue;
        const g = groupForLabel(label);
        if (!g) continue;
        (next[g] ??= []).push({ label, n });
      }
      for (const g of SKILL_GROUPS) {
        next[g]?.sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
        if (next[g]?.length) next[g] = next[g]!.slice(0, 8);
      }
      setGroups(next);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  const visibleGroups = SKILL_GROUPS.filter((g) => (groups[g]?.length ?? 0) > 0);
  if (!visibleGroups.length) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="section-title mb-1 mt-0 text-[20px]">Browse members by expertise</h2>
      <p className="mb-3.5 mt-0 text-[13px] text-meta">
        Skills and brands are grouped — only tags with members are shown.
      </p>
      <div className="flex flex-col gap-3.5">
        {visibleGroups.map((g) => (
          <div key={g}>
            <p className="mb-2 mt-0 font-mono text-[11px] font-medium tracking-[0.12em] text-meta uppercase">
              {g === "Brands" ? "Brands" : g === "Systems" ? "Systems" : "Expertise"}
            </p>
            <div className="flex flex-wrap gap-2">
              {groups[g]!.map((a) => (
                <Link
                  key={a.label}
                  href={`/members?skill=${encodeURIComponent(a.label)}`}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#D4D3CD] px-3 py-1 text-[13px] text-ink no-underline hover:border-ink hover:text-ink"
                >
                  {a.label}
                  <span className="font-mono text-[11px] text-meta">{a.n}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Signed-in member’s own open questions — pulled out of the main feed noise. */
export function HomeYourQuestions() {
  const [mine, setMine] = useState<Question[]>([]);
  const [handle, setHandle] = useState("");

  useEffect(() => {
    function sync() {
      const h = getSessionHandle();
      setHandle(h);
      if (!h) {
        setMine([]);
        return;
      }
      setMine(
        getAllQuestions().filter((q) => q.askerHandle === h && !q.solved).slice(0, 4),
      );
    }
    sync();
    return subscribeStore(sync);
  }, []);

  if (!handle || mine.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <h2 className="section-title m-0 text-[20px]">Your questions</h2>
        <span className="text-[13px] text-meta">Waiting on answers</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {mine.map((q) => (
          <li key={q.id}>
            <Link
              href={`/q/${q.id}`}
              className="block rounded-[10px] border border-line-soft bg-ground px-3 py-2.5 text-ink no-underline hover:border-line hover:text-accent-hover"
            >
              <span className="line-clamp-2 text-[14px] font-semibold leading-snug">
                {q.title}
              </span>
              <span className="mt-1 block font-mono text-[12px] text-meta">
                {q.answers === 0 ? "0 answers" : `${q.answers} answers`} · {q.time}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Unanswered threads that match the signed-in member’s expertise tags. */
export function HomeUnansweredForYou() {
  const [rows, setRows] = useState<Question[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      const h = getSessionHandle();
      const person = h ? resolvePerson(h) : undefined;
      const skills = person?.skills ?? [];
      if (!h || !skills.length) {
        setRows([]);
        setReady(true);
        return;
      }
      const open = getAllQuestions().filter((q) => !q.solved);
      const needles = skills.map((s) => s.toLowerCase());
      const matched = open.filter((q) => {
        const hay = `${q.title} ${q.tags.join(" ")}`.toLowerCase();
        return needles.some((n) => {
          const token = n.slice(0, 8);
          return token.length >= 4 && hay.includes(token);
        });
      });
      setRows(matched.slice(0, 4));
      setReady(true);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  if (!ready || rows.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <h2 className="section-title m-0 text-[20px]">Unanswered in your expertise</h2>
        <Link href="/?sort=Unanswered" className="text-[13px] font-semibold">
          See all →
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {rows.map((q) => (
          <li key={q.id}>
            <Link
              href={`/q/${q.id}`}
              className="block text-ink no-underline hover:text-accent-hover"
            >
              <span className="line-clamp-2 text-[14px] font-semibold leading-snug">
                {q.title}
              </span>
              <span className="mt-1 block text-[12px] text-meta">
                {abbreviatedDisplayName(q.asker)} · {q.time}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
