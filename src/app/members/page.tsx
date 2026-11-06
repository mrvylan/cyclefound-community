"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import {
  getSessionHandle,
  isMockDataEnabled,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import type { Person } from "@/lib/data/seed";

export default function MembersPage() {
  const [tag, setTag] = useState("All");
  const [members, setMembers] = useState<Person[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [mock, setMock] = useState(false);

  useEffect(() => {
    function sync() {
      setMembers(listMembers());
      setSignedIn(Boolean(getSessionHandle()));
      setMock(isMockDataEnabled());
    }
    sync();
    return subscribeStore(sync);
  }, []);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of members) {
      for (const s of p.skills) set.add(s);
    }
    return ["All", ...Array.from(set).sort()];
  }, [members]);

  const filtered = members.filter((p) => tag === "All" || p.skills.includes(tag));

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-[18px] px-8 pb-8 pt-12">
          <p className="eyebrow m-0">Who&apos;s in the community</p>
          <h1 className="font-display m-0 text-[clamp(36px,6vw,64px)]">Members</h1>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.55] text-muted-2">
            {mock
              ? "Browse people by expertise tag. Open a profile to see their garage and what they’ve answered."
              : signedIn
                ? "You and one mock member are listed so you can test messaging. Insert mock data from the header for the full sample roster."
                : "Log in to see your profile here, or insert mock data from the header to explore the UI."}
          </p>
          {tags.length > 1 ? (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {tags.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTag(label)}
                  className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${
                    tag === label
                      ? "border-ink bg-ink text-white"
                      : "border-[#D4D3CD] bg-white text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-8 py-8 pb-16">
        <p className="mb-5 mt-0 text-[15px] text-muted-2">
          <strong className="text-ink">{filtered.length}</strong> member
          {filtered.length === 1 ? "" : "s"}
          {tag !== "All" ? ` · ${tag}` : ""}
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            title={signedIn ? "No members to show" : "No profiles yet"}
            description={
              signedIn
                ? "Insert mock data from the header to browse sample members, or finish editing your profile."
                : "Log in to create your profile, or insert mock data from the header to explore the UI."
            }
            actionLabel={signedIn ? "Edit profile" : "Log in"}
            actionHref={signedIn ? "/settings/profile" : "/auth?mode=login&next=/members"}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filtered.map((m) => (
              <Link
                key={m.handle}
                href={`/u/${m.handle}`}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-ink no-underline hover:text-ink"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar init={m.init} bg={m.bg} size={52} src={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-bold">{m.name}</div>
                    <div className="text-[13px] text-muted">
                      {m.loc ? m.loc.split("·")[0]?.trim() : `@${m.handle}`}
                    </div>
                    {m.roleBadge ? (
                      <div className="mt-1.5 font-mono text-[12px] font-medium tracking-[0.04em] text-accent-hover">
                        {m.roleBadge}
                      </div>
                    ) : null}
                  </div>
                </div>
                {m.bio ? (
                  <p className="m-0 line-clamp-2 text-[14px] leading-normal text-muted-2">
                    {m.bio}
                  </p>
                ) : null}
                {m.skills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line bg-ground px-2.5 py-1 text-[12px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Feature name="paidConsults">
                  {m.consult ? (
                    <span className="text-[13px] text-muted">{m.consult}</span>
                  ) : null}
                </Feature>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
