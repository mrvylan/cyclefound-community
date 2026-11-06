"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Star } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import { MessageMember } from "@/components/messaging/MessageMember";
import { ProfileCover } from "@/components/profile/ProfileCover";
import {
  ProfileDisplayName,
  ProfileIdentity,
} from "@/components/profile/ProfileIdentity";
import { WantedList } from "@/components/WantedList";
import {
  LevelBadge,
  PlaceholderPhoto,
  StatusChip,
  TagChip,
} from "@/components/ui";
import {
  getGarageItemsFor,
  isMockDataEnabled,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { marcoProfile } from "@/lib/data/seed";

export function ProfilePageClient({
  handle,
  tab: tabParam,
}: {
  handle: string;
  tab?: string;
}) {
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    return subscribeStore(() => setTick((t) => t + 1));
  }, []);

  void tick;

  const person = ready ? resolvePerson(handle) : undefined;
  const tab = tabParam || "Garage";
  const ownedItems = ready ? getGarageItemsFor(handle) : [];
  const profile =
    ready && isMockDataEnabled() && handle === "lugged_marco" ? marcoProfile : null;
  const tabs = [
    ["Garage", ownedItems.length],
    ["Answers", profile?.answers.length ?? 0],
    ["Builds", profile?.builds.length ?? 0],
    ["Reviews", profile?.reviews.length ?? person?.reviews ?? 0],
  ] as const;

  const shades = ["#EEEDE8", "#D8E5C8", "#A8C487", "#527D31", "#3D5F24"];
  const weeks = Array.from({ length: 26 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = (w * 7 + d * 13 + w * d * 3) % 11;
      const lvl = v < 3 ? 0 : v < 5 ? 1 : v < 8 ? 2 : v < 10 ? 3 : 4;
      return shades[w > 20 && lvl < 2 ? lvl + 2 : lvl];
    }),
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading profile…
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <h1 className="font-display m-0 text-[44px] font-extrabold uppercase leading-[0.95] text-ink [font-stretch:75%]">
          Profile not found
        </h1>
        <p className="mt-4 text-[16px] text-muted-2">
          No member matches <span className="font-mono">@{handle}</span>.
        </p>
        <Link href="/members" className="mt-6 inline-flex font-semibold text-accent">
          Browse members
        </Link>
      </div>
    );
  }

  const firstName = person.name.split(" ")[0] || person.name;

  return (
    <>
      <section className="bg-ink text-white">
        <ProfileCover
          handle={handle}
          fallbackLabel={`Cover photo: ${firstName}'s workshop`}
        />
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-end gap-x-8 gap-y-6 px-8 pb-8 pt-2">
          <ProfileIdentity
            handle={handle}
            fallback={{
              name: person.name,
              init: person.init,
              bg: person.bg,
              avatarUrl: person.avatarUrl,
            }}
          />
          <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              <ProfileDisplayName
                handle={handle}
                fallback={person.name}
                className="font-display m-0 text-[clamp(36px,5vw,54px)] leading-none"
              />
              <Feature name="spokesLevels">
                <LevelBadge level={person.level} bright />
              </Feature>
              <Feature name="verifiedBadges">
                {person.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#93C5FD]">
                    <ShieldCheck className="size-[15px] stroke-[2.4]" aria-hidden />
                    Identity & expertise verified
                  </span>
                ) : null}
              </Feature>
              {person.roleBadge ? (
                <span className="font-mono text-[13px] font-medium tracking-[0.06em] text-accent-bright">
                  {person.roleBadge}
                </span>
              ) : null}
            </div>
            <p className="m-0 text-[15px] text-on-dark-muted">
              @{person.handle}
              {person.loc ? ` · ${person.loc.split(" · ")[0]}` : null}
              {" · "}Member since {person.memberSince}
              {person.reply !== "—" ? ` · Usually replies ${person.reply}` : null}
            </p>
            {person.bio ? (
              <p className="m-0 max-w-[720px] text-base leading-[1.55] text-[#E3E5E8]">
                {person.bio}
              </p>
            ) : null}
          </div>
          <div className="flex flex-[1_1_280px] flex-wrap justify-end gap-2.5">
            <Link
              href="/ask"
              className="inline-flex h-[46px] items-center rounded-[10px] bg-accent px-[22px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
            >
              Ask {firstName}
            </Link>
            <Link
              href="/settings/profile"
              className="inline-flex h-[46px] items-center rounded-[10px] border-0 bg-white px-[18px] font-semibold text-ink no-underline hover:text-ink"
            >
              Edit profile
            </Link>
            <MessageMember handle={person.handle} name={person.name} variant="dark" />
            <Feature name="followGarage">
              <button
                type="button"
                className="h-[46px] rounded-[10px] border border-[#4A4F57] bg-transparent px-[18px] font-semibold text-white"
              >
                Follow
              </button>
            </Feature>
          </div>
        </div>
        <div className="border-t border-ink-3">
          <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 px-8 py-5">
            <div>
              <div className="font-display flex items-center gap-1.5 text-[34px]">
                <Star className="size-[22px] fill-accent-bright text-accent-bright" aria-hidden />
                {person.rating}
              </div>
              <div className="text-[13px] text-on-dark-muted">
                {person.reviews} member reviews
              </div>
            </div>
            <Feature name="spokesCurrency">
              <div>
                <div className="font-display text-[34px]">
                  {person.spokesNum.toLocaleString()}
                </div>
                <div className="text-[13px] text-on-dark-muted">Spokes earned</div>
              </div>
            </Feature>
            <div>
              <div className="font-display text-[34px]">{person.accepted}</div>
              <div className="text-[13px] text-on-dark-muted">Accepted answers</div>
            </div>
            <div>
              <div className="font-display text-[34px]">{ownedItems.length}</div>
              <div className="text-[13px] text-on-dark-muted">Items in garage</div>
            </div>
            <Feature name="topContributors">
              <div>
                <div className="font-display text-[34px]">Top 1%</div>
                <div className="text-[13px] text-on-dark-muted">{person.skills[0]}</div>
              </div>
            </Feature>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-7 px-8 py-8 pb-16">
        <aside className="flex max-w-[380px] min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section className="rounded-2xl border border-line bg-surface p-[22px]">
            <h2 className="font-display mb-4 mt-0 text-[22px]">Expertise</h2>
            {person.skills.length === 0 && !profile ? (
              <p className="m-0 text-[14px] text-muted-2">
                No expertise tags yet.{" "}
                <Link href="/settings/profile" className="font-semibold text-accent">
                  Edit profile
                </Link>
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {(profile?.skills ??
                  person.skills.map((name) => ({
                    name,
                    endorse: 0,
                    pct: 40,
                  }))).map((s) => (
                  <li key={s.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[14px]">
                      <span className="font-semibold">{s.name}</span>
                      {s.endorse > 0 ? (
                        <span className="text-muted">{s.endorse} endorsements</span>
                      ) : null}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line-soft">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <WantedList handle={handle} />

          {profile ? (
            <>
              <Feature name="spokesCurrency">
                <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-[22px]">
                  <h2 className="font-display m-0 text-[22px]">Where the Spokes came from</h2>
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
                    {profile.spokesBreakdown.map((k) => (
                      <li
                        key={k.label}
                        className="flex justify-between gap-2.5 border-b border-line-soft pb-2.5 last:border-0"
                      >
                        <span>{k.label}</span>
                        <span className="font-mono font-medium">{k.n}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Feature>

              <Feature name="verifiedBadges">
                <section className="rounded-2xl border border-line bg-surface p-[22px]">
                  <h2 className="font-display mb-4 mt-0 text-[22px]">Badges</h2>
                  <div className="grid grid-cols-3 gap-2.5">
                    {profile.badges.map((b) => (
                      <div
                        key={b.name}
                        className="flex flex-col items-center gap-1 rounded-xl border border-line bg-ground p-3 text-center"
                      >
                        <span className="font-display text-[22px] normal-case tracking-normal">
                          {b.mark}
                        </span>
                        <span className="text-[11px] leading-tight text-muted">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </Feature>

              <Feature name="paidConsults">
                <section className="rounded-2xl border border-line bg-surface p-[22px]">
                  <h2 className="font-display mb-3 mt-0 text-[22px]">Services</h2>
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
                    {profile.services.map((s) => (
                      <li
                        key={s.kind}
                        className="flex justify-between gap-2 border-b border-line-soft pb-2.5"
                      >
                        <span className="font-semibold">{s.kind}</span>
                        <span className="text-muted">{s.detail}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Feature>
            </>
          ) : null}

          <Feature name="spokesCurrency">
            <section className="rounded-2xl border border-line bg-surface p-[22px]">
              <h2 className="font-display mb-3 mt-0 text-[22px]">Contribution</h2>
              <p className="mb-3 mt-0 text-[13px] text-muted">Last 26 weeks · Spokes earned</p>
              <div
                className="flex gap-1 overflow-x-auto"
                role="img"
                aria-label="Contribution calendar"
              >
                {weeks.map((days, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {days.map((c, di) => (
                      <span
                        key={di}
                        className="size-2.5 rounded-[2px]"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </Feature>
        </aside>

        <div className="min-w-0 flex-[999_1_560px]">
          <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b-2 border-line">
            {tabs.map(([label, n]) => {
              const on = tab === label;
              return (
                <Link
                  key={label}
                  href={`/u/${handle}?tab=${label}`}
                  role="tab"
                  aria-selected={on}
                  className={`mb-[-2px] inline-flex h-12 items-center gap-2 px-[18px] text-[15px] font-semibold no-underline ${
                    on
                      ? "border-b-[3px] border-accent text-ink"
                      : "border-b-[3px] border-transparent text-muted-2"
                  }`}
                >
                  {label}
                  <span className="font-mono text-[12px] text-muted">{n}</span>
                </Link>
              );
            })}
          </div>

          {tab === "Garage" &&
            (ownedItems.length === 0 ? (
              <EmptyState
                title="No items yet — add your first bike"
                description="Document what you own so others can ask about it."
                actionLabel="Add an item"
                actionHref="/item/new"
              />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {ownedItems.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    href={`/i/${item.id}`}
                    className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-ink no-underline hover:text-ink"
                  >
                    <PlaceholderPhoto label={item.year} className="h-[140px]" />
                    <div className="flex flex-col gap-2 p-4">
                      <span className="font-mono text-[11px] text-muted">{item.cat}</span>
                      <span className="text-[15px] font-semibold leading-snug">{item.name}</span>
                      <div className="flex items-center justify-between gap-2">
                        <Feature name="marketValues">
                          <span className="font-mono text-[13px]">{item.mkt}</span>
                        </Feature>
                        <StatusChip status={item.status} />
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href={`/u/${handle}/garage`}
                  className="col-span-full text-center text-[15px] font-semibold"
                >
                  Open full garage →
                </Link>
              </div>
            ))}

          {tab === "Answers" && (
            <div className="flex flex-col gap-3">
              {profile?.answers.length ? (
                profile.answers.map((a) => (
                  <Link
                    key={a.q}
                    href={`/q/${a.id}`}
                    className="flex gap-4 rounded-[14px] border border-line bg-surface p-4 text-ink no-underline hover:text-ink"
                  >
                    <span className="w-10 shrink-0 text-center font-mono text-lg font-medium">
                      {a.votes}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{a.q}</span>
                      <span className="mt-1 flex flex-wrap gap-2 text-[13px] text-muted">
                        {a.meta}
                        {a.acc ? <TagChip>Accepted</TagChip> : null}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="m-0 text-[15px] text-muted-2">No answers yet.</p>
              )}
            </div>
          )}

          {tab === "Builds" && (
            <div className="flex flex-col gap-3">
              {profile?.builds.length ? (
                profile.builds.map((b) => (
                  <div
                    key={b.name}
                    className="flex gap-4 rounded-[14px] border border-line bg-surface p-4"
                  >
                    <PlaceholderPhoto className="h-20 w-28 shrink-0 rounded-lg" />
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="mt-1 text-[13px] text-muted">
                        {b.steps} steps · {b.meta}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="m-0 text-[15px] text-muted-2">No builds yet.</p>
              )}
            </div>
          )}

          {tab === "Reviews" && (
            <div className="flex flex-col gap-3">
              {profile?.reviews.length ? (
                profile.reviews.map((r) => (
                  <article
                    key={r.who}
                    className="rounded-[14px] border border-line bg-surface p-5"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                      <span className="font-semibold text-ink">{r.who}</span>
                      <span>·</span>
                      <span>{r.ctx}</span>
                      <span className="inline-flex items-center gap-0.5 text-accent">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="size-3.5 fill-accent text-accent"
                            aria-hidden
                          />
                        ))}
                      </span>
                    </div>
                    <p className="m-0 text-[15px] leading-normal text-muted-2">{r.text}</p>
                  </article>
                ))
              ) : (
                <p className="m-0 text-[15px] text-muted-2">No reviews yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
