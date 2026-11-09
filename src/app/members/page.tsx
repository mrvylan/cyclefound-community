"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Search } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ContributionBadge } from "@/components/ContributionBadge";
import { Avatar, FilterChip } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import { getDirectoryUserId } from "@/lib/community/directory-cache";
import { accountIdentityKey } from "@/lib/community/handles";
import {
  getGarageItemsFor,
  getMemberContribution,
  getSessionHandle,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import type { Person } from "@/lib/data/seed";
import type { MemberContribution } from "@/lib/community/contribution-tier";
import {
  SKILL_GROUPS,
  groupForLabel,
  normalizeSkillLabels,
  type SkillGroup,
} from "@/lib/skills/taxonomy";

type Group = SkillGroup;
const GROUPS: Group[] = SKILL_GROUPS;
const TOP_N = 8;

type SortKey = "helpful" | "recent";

/** Roles like "Member" are noise; only surface staff/founder-style badges. */
function badgeOf(p: Person) {
  const b = p.roleBadge?.trim();
  return b && b.toLowerCase() !== "member" ? b : "";
}

function garageItemCountFor(person: Person, sessionHandle: string, authUserId: string) {
  const ids = new Set(getGarageItemsFor(person.handle).map((i) => i.id));
  const key = accountIdentityKey(
    person.handle,
    getDirectoryUserId(person.handle) || authUserId || undefined,
  );
  if (sessionHandle && accountIdentityKey(sessionHandle, authUserId || undefined) === key) {
    for (const item of getGarageItemsFor(sessionHandle)) ids.add(item.id);
  }
  return ids.size;
}

export default function MembersPage() {
  const { profile } = useAuth();
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("helpful");
  const [expanded, setExpanded] = useState<Partial<Record<Group, boolean>>>({});
  const [members, setMembers] = useState<Person[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [contributions, setContributions] = useState<
    Record<string, MemberContribution>
  >({});
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    function sync() {
      const sessionHandle = getSessionHandle();
      const authUserId = profile?.id || "";
      const list = listMembers({ authUserId: authUserId || undefined });
      setMembers([...list]);
      setItemCounts(
        Object.fromEntries(
          list.map((p) => [p.handle, garageItemCountFor(p, sessionHandle, authUserId)]),
        ),
      );
      setContributions(
        Object.fromEntries(list.map((p) => [p.handle, getMemberContribution(p.handle)])),
      );
      setSignedIn(Boolean(sessionHandle));
    }
    sync();
    return subscribeStore(sync);
  }, [profile]);

  useEffect(() => {
    const skill = new URLSearchParams(window.location.search).get("skill");
    if (skill) setTag(skill);
  }, []);

  const tagGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of members) {
      for (const s of normalizeSkillLabels(p.skills)) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    const out: Record<Group, { tag: string; n: number }[]> = {
      Expertise: [],
      Systems: [],
      Brands: [],
    };
    for (const [t, n] of counts) {
      const g = groupForLabel(t);
      if (g) out[g].push({ tag: t, n });
    }
    for (const g of GROUPS) out[g].sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
    return out;
  }, [members]);

  const hasTags = GROUPS.some((g) => tagGroups[g].length > 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = members.filter((p) => {
      if (tag && !normalizeSkillLabels(p.skills).includes(tag)) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.handle,
        p.bio,
        ...normalizeSkillLabels(p.skills),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    return list.sort((a, b) => {
      if (sort === "recent") {
        return (
          Number(b.memberSince) - Number(a.memberSince) || a.name.localeCompare(b.name)
        );
      }
      // Most helpful: contribution score, then accepted answers, then garage size.
      const scoreA = contributions[a.handle]?.score ?? a.accepted;
      const scoreB = contributions[b.handle]?.score ?? b.accepted;
      return (
        scoreB - scoreA ||
        b.accepted - a.accepted ||
        (itemCounts[b.handle] ?? 0) - (itemCounts[a.handle] ?? 0) ||
        a.name.localeCompare(b.name)
      );
    });
  }, [members, tag, query, sort, itemCounts, contributions]);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-[18px] px-8 pb-8 pt-12">
          <h1 className="section-title m-0 text-[clamp(36px,6vw,64px)]">Members</h1>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.55] text-muted-2">
            {signedIn
              ? "Find riders by what they know — open a profile to see their garage and answers."
              : "Browse members as they join. Log in to appear here with your garage."}
          </p>

          {members.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-end gap-3">
              <div className="flex min-w-[220px] flex-[1_1_280px] flex-col gap-1.5 sm:max-w-[360px]">
                <label htmlFor="member-search" className="text-[13px] font-semibold text-ink">
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-meta"
                    aria-hidden
                  />
                  <input
                    id="member-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, @handle, or expertise"
                    className="h-11 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-9 pr-3 text-[15px] text-ink placeholder:text-meta"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="member-sort" className="text-[13px] font-semibold text-ink">
                  Sort by
                </label>
                <select
                  id="member-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="cf-select h-11 rounded-[10px] border border-[#D4D3CD] bg-white pl-3 text-[15px] text-ink"
                >
                  <option value="helpful">Most helpful</option>
                  <option value="recent">Recently joined</option>
                </select>
              </div>
            </div>
          ) : null}

          {hasTags ? (
            <div className="mt-1 flex flex-col gap-3" role="group" aria-label="Filter by tag">
              {GROUPS.filter((g) => tagGroups[g].length > 0).map((g) => {
                const all = tagGroups[g];
                const open = Boolean(expanded[g]);
                // Keep an active tag visible even if it sits beyond the top N.
                const base = all.slice(0, TOP_N);
                const activeExtra = all.find((x) => x.tag === tag && !base.includes(x));
                const visibleTags = open ? all : activeExtra ? [...base, activeExtra] : base;
                const hidden = all.length - visibleTags.length;
                return (
                  <div key={g} className="flex flex-wrap items-center gap-2">
                    <span className="w-[104px] shrink-0 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-meta">
                      {g}
                    </span>
                    {visibleTags.map(({ tag: t, n }) => (
                      <FilterChip key={t} active={tag === t} onClick={() => setTag(tag === t ? "" : t)}>
                        {t}
                        <span className="font-mono text-[11px] opacity-80">{n}</span>
                      </FilterChip>
                    ))}
                    {hidden > 0 || (open && all.length > TOP_N) ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setExpanded({ ...expanded, [g]: !open })}
                        className="inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[13px] font-semibold text-accent-hover underline-offset-2 hover:underline"
                      >
                        {open ? "Show less" : `More (${hidden})`}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {tag ? (
                <button
                  type="button"
                  onClick={() => setTag("")}
                  className="inline-flex min-h-8 w-fit items-center rounded-full px-1 text-[13px] font-semibold text-accent-hover underline underline-offset-2"
                >
                  Clear tag filter
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-8 py-8 pb-16">
        <p className="mb-5 mt-0 text-[15px] text-muted-2" aria-live="polite">
          <strong className="text-ink">{filtered.length}</strong> member
          {filtered.length === 1 ? "" : "s"}
          {tag ? ` · ${tag}` : ""}
          {query.trim() ? ` · “${query.trim()}”` : ""}
        </p>

        {filtered.length === 0 ? (
          members.length > 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line bg-surface px-6 py-10">
              <h3 className="m-0 text-[17px] font-semibold text-ink">No members match</h3>
              <p className="m-0 max-w-[420px] text-[15px] leading-normal text-muted-2">
                Try a different name or clear the tag filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTag("");
                  setQuery("");
                }}
                className="inline-flex h-11 items-center rounded-[10px] border-0 bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <EmptyState
              title="No members to show"
              description={
                signedIn
                  ? "Finish editing your profile, or check back as more riders join."
                  : "Members from Cycle Found accounts will show here. Log in to create your profile."
              }
              actionLabel={signedIn ? "Edit profile" : "Log in"}
              actionHref={signedIn ? "/settings/profile" : "/auth?mode=login&next=/members"}
            />
          )
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filtered.map((m) => {
              const badge = badgeOf(m);
              const garageItems = itemCounts[m.handle] ?? 0;
              const contribution = contributions[m.handle];
              const asked = contribution?.activity.asked ?? 0;
              const answered = contribution?.activity.answered ?? 0;
              return (
                <Link
                  key={m.handle}
                  href={`/u/${m.handle}`}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-ink no-underline hover:border-ink hover:text-ink"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar init={m.init} bg={m.bg} size={52} src={m.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[17px] font-bold">{m.name}</div>
                      <div className="text-[13px] text-meta">
                        {[
                          m.publicHandle ? `@${m.publicHandle}` : null,
                          m.loc ? m.loc.split("·")[0]?.trim() : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Member"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {badge ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-soft-border bg-accent-soft px-2.5 py-1 font-mono text-[12px] font-medium tracking-[0.04em] text-accent-hover">
                        <BadgeCheck className="size-3.5" aria-hidden />
                        {badge}
                      </span>
                    ) : null}
                    {contribution && contribution.activity.answered > 0 ? (
                      <ContributionBadge
                        tier={contribution.tier}
                        preview={contribution.isPreview}
                      />
                    ) : null}
                  </div>
                  {m.bio ? (
                    <p className="m-0 line-clamp-2 text-[14px] leading-normal text-muted-2">
                      {m.bio}
                    </p>
                  ) : null}
                  {m.skills.length ? (
                    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Expertise tags">
                      {m.skills.map((s) => (
                        <li
                          key={s}
                          className="inline-flex min-h-7 items-center rounded-full border border-line bg-ground px-2.5 py-1 text-[12px] leading-none"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="m-0 mt-auto border-t border-line-soft pt-3 text-[13px] text-meta">
                    <span className="font-mono tabular-nums text-ink">{asked}</span> asked
                    {" · "}
                    <span className="font-mono tabular-nums text-ink">{answered}</span> answered
                    {" · "}
                    <span className="font-mono tabular-nums text-ink">{garageItems}</span> garage
                    item{garageItems === 1 ? "" : "s"}
                  </p>
                  <Feature name="paidConsults">
                    {m.consult ? (
                      <span className="text-[13px] text-meta">{m.consult}</span>
                    ) : null}
                  </Feature>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
