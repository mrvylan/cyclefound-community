"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, ShieldCheck, Star } from "lucide-react";
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
  hydrateCommunityDirectory,
  isCommunityDirectoryReady,
} from "@/lib/community/directory-cache";
import {
  getAllAnswers,
  getAllQuestions,
  getGarageItemsFor,
  getItemPhotoUrls,
  getSessionHandle,
  isMockDataEnabled,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { itemYearLabel } from "@/lib/garage/itemFields";
import { marcoProfile } from "@/lib/data/seed";

/** Words from a skill label that can be matched against question tags/titles. */
function skillTokens(skill: string) {
  return skill
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["and", "with", "pre"].includes(w));
}

export function ProfilePageClient({
  handle,
  tab: tabParam,
}: {
  handle: string;
  tab?: string;
}) {
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("");
  const [previewVisitor, setPreviewVisitor] = useState(false);

  useEffect(() => {
    setReady(true);
    setSessionHandle(getSessionHandle());
    if (!isCommunityDirectoryReady()) {
      void hydrateCommunityDirectory();
    }
    return subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((t) => t + 1);
    });
  }, []);

  void tick;

  const person = ready ? resolvePerson(handle) : undefined;
  const directoryReady = isCommunityDirectoryReady();
  const isOwner = Boolean(sessionHandle && sessionHandle === handle);
  /** Owner chrome (edit links) is hidden while previewing as a visitor. */
  const isOwnProfile = isOwner && !previewVisitor;
  const ownedItems = ready ? getGarageItemsFor(handle) : [];
  const profile =
    ready && isMockDataEnabled() && handle === "lugged_marco" ? marcoProfile : null;
  const tabs = [
    ["Garage", ownedItems.length],
    ["Answers", profile?.answers.length ?? 0],
    ["Reviews", profile?.reviews.length ?? person?.reviews ?? 0],
  ] as const;
  const tabLabels = tabs.map(([label]) => label);
  const tab =
    tabParam && (tabLabels as readonly string[]).includes(tabParam)
      ? tabParam
      : "Garage";
  const skillList: { name: string; endorse: number }[] = useMemo(
    () =>
      profile
        ? profile.skills.map(({ name, endorse }) => ({ name, endorse }))
        : (person?.skills ?? []).map((name) => ({ name, endorse: 0 })),
    [profile, person],
  );
  // Evidence: accepted answers by this member on questions that match each skill.
  const evidence = useMemo(() => {
    if (!ready) return new Map<string, number>();
    const mine = getAllQuestions().filter((q) =>
      getAllAnswers(q.id).some((a) => a.handle === handle && a.accepted),
    );
    const out = new Map<string, number>();
    for (const { name } of skillList) {
      const tokens = skillTokens(name);
      const n = mine.filter((q) => {
        const hay = `${q.tags.join(" ")} ${q.title}`.toLowerCase();
        return tokens.some((t) => hay.includes(t.slice(0, 6)));
      }).length;
      out.set(name, n);
    }
    return out;
    // tick re-runs this when the local store changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, handle, skillList, tick]);
  const shades = ["#EEEDE8", "#D8E5C8", "#A8C487", "#527D31", "#3D5F24"];
  const weeks = Array.from({ length: 26 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = (w * 7 + d * 13 + w * d * 3) % 11;
      const lvl = v < 3 ? 0 : v < 5 ? 1 : v < 8 ? 2 : v < 10 ? 3 : 4;
      return shades[w > 20 && lvl < 2 ? lvl + 2 : lvl];
    }),
  );

  if (!ready || (!person && !directoryReady)) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-meta">
        Loading profile…
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <h1 className="section-title m-0 text-[44px] text-ink">
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
            {person.roleBadge ? (
              <p className="m-0 font-mono text-[12px] font-medium tracking-[0.12em] uppercase text-accent-bright">
                {person.roleBadge}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              <ProfileDisplayName
                handle={handle}
                fallback={person.name}
                className="section-title m-0 text-[clamp(36px,5vw,54px)] leading-none !text-white"
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
            </div>
            <p className="m-0 text-[15px] text-on-dark-muted">
              @{person.handle}
              {person.loc ? ` · ${person.loc.split(" · ")[0]}` : null}
              {" · "}Member since {person.memberSince}
            </p>
            {person.bio ? (
              <p className="m-0 max-w-[720px] text-base leading-[1.55] text-[#E3E5E8]">
                {person.bio}
              </p>
            ) : null}
          </div>
          <div className="flex flex-[1_1_auto] flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {isOwnProfile ? (
              <Link
                href="/settings/profile"
                className="inline-flex h-[46px] items-center rounded-[10px] border-0 bg-white px-[18px] font-semibold text-ink no-underline hover:text-ink"
              >
                Edit profile
              </Link>
            ) : null}
            {isOwner ? (
              <button
                type="button"
                role="switch"
                aria-checked={previewVisitor}
                onClick={() => setPreviewVisitor((v) => !v)}
                className={`inline-flex h-[46px] items-center gap-1.5 text-[14px] font-semibold ${
                  previewVisitor
                    ? "rounded-[10px] bg-white/15 px-3 text-white"
                    : "bg-transparent px-1 text-on-dark-muted underline-offset-4 hover:text-white hover:underline"
                }`}
              >
                <Eye className="size-4" aria-hidden />
                {previewVisitor ? "Exit preview" : "Preview as visitor"}
              </button>
            ) : null}
            {!isOwnProfile ? (
              <>
                <MessageMember
                  handle={person.handle}
                  name={person.name}
                  variant="dark"
                  askLabel={`Ask ${firstName}`}
                  showWhenSelf={previewVisitor}
                />
                <Feature name="followGarage">
                  <button
                    type="button"
                    className="h-[46px] rounded-[10px] border border-[#4A4F57] bg-transparent px-[18px] font-semibold text-white"
                  >
                    Follow
                  </button>
                </Feature>
              </>
            ) : null}
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

      {isOwner && previewVisitor ? (
        <div
          role="status"
          className="border-b border-accent-soft-border bg-accent-soft"
        >
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-8 py-3 text-[14px] text-ink">
            <span>
              <strong>Previewing as a visitor.</strong> Owner controls like Edit profile are hidden;
              visitors also see Message and Ask buttons here.
            </span>
            <button
              type="button"
              onClick={() => setPreviewVisitor(false)}
              className="inline-flex h-11 items-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 font-semibold text-ink hover:border-ink"
            >
              Exit preview
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-7 px-8 py-8 pb-16">
        <aside className="flex max-w-[380px] min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section className="rounded-2xl border border-line bg-surface p-[22px]">
            <h2 className="section-title mb-4 mt-0 text-[20px]">Expertise</h2>
            {person.skills.length === 0 && !profile ? (
              <p className="m-0 text-[14px] text-muted-2">
                No expertise tags yet.
                {isOwnProfile ? (
                  <>
                    {" "}
                    <Link href="/settings/profile" className="font-semibold text-accent">
                      Edit profile
                    </Link>
                  </>
                ) : null}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {skillList.map((s) => {
                  const solved = evidence.get(s.name) ?? 0;
                  const bits = [
                    solved > 0 ? `${solved} solved` : "",
                    s.endorse > 0 ? `${s.endorse} endorsements` : "",
                  ].filter(Boolean);
                  return (
                    <li
                      key={s.name}
                      className="flex flex-col gap-0.5 border-b border-line-soft pb-3 last:border-b-0 last:pb-0"
                    >
                      <span className="text-[14px] font-semibold text-ink">{s.name}</span>
                      <span className="font-mono text-[12px] text-meta">
                        {bits.length ? bits.join(" · ") : "Listed by member — no answers yet"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <WantedList handle={handle} previewVisitor={previewVisitor} />

          {profile ? (
            <>
              <Feature name="spokesCurrency">
                <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-[22px]">
                  <h2 className="section-title m-0 text-[20px]">Where the Spokes came from</h2>
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
                  <h2 className="section-title mb-4 mt-0 text-[20px]">Badges</h2>
                  <div className="grid grid-cols-3 gap-2.5">
                    {profile.badges.map((b) => (
                      <div
                        key={b.name}
                        className="flex flex-col items-center gap-1 rounded-xl border border-line bg-ground p-3 text-center"
                      >
                        <span className="section-title text-[20px] normal-case tracking-normal">
                          {b.mark}
                        </span>
                        <span className="text-[11px] leading-tight text-meta">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </Feature>

              <Feature name="paidConsults">
                <section className="rounded-2xl border border-line bg-surface p-[22px]">
                  <h2 className="section-title mb-3 mt-0 text-[20px]">Services</h2>
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
                    {profile.services.map((s) => (
                      <li
                        key={s.kind}
                        className="flex justify-between gap-2 border-b border-line-soft pb-2.5"
                      >
                        <span className="font-semibold">{s.kind}</span>
                        <span className="text-meta">{s.detail}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Feature>
            </>
          ) : null}

          <Feature name="spokesCurrency">
            <section className="rounded-2xl border border-line bg-surface p-[22px]">
              <h2 className="section-title mb-3 mt-0 text-[20px]">Contribution</h2>
              <p className="mb-3 mt-0 text-[13px] text-meta">Last 26 weeks · Spokes earned</p>
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
                  <span className="font-mono text-[12px] text-meta">{n}</span>
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
                {ownedItems.slice(0, 6).map((item) => {
                  const photo = getItemPhotoUrls(item)[0];
                  const year = itemYearLabel(item.year);
                  return (
                  <Link
                    key={item.id}
                    href={`/i/${item.id}`}
                    className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-ink no-underline hover:text-ink"
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-[140px] w-full object-cover"
                      />
                    ) : (
                      <PlaceholderPhoto
                        label={year || item.cond}
                        className="h-[140px]"
                        silhouette
                      />
                    )}
                    <div className="flex flex-col gap-2 p-4">
                      <span className="font-mono text-[11px] text-meta">{item.cat}</span>
                      <span className="text-[15px] font-semibold leading-snug">{item.name}</span>
                      {item.description ? (
                        <p className="m-0 line-clamp-2 text-[13px] leading-snug text-muted-2">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-between gap-2">
                        <Feature name="marketValues">
                          <span className="font-mono text-[13px]">{item.mkt}</span>
                        </Feature>
                        <StatusChip status={item.status} />
                      </div>
                    </div>
                  </Link>
                  );
                })}
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
                      <span className="mt-1 flex flex-wrap gap-2 text-[13px] text-meta">
                        {a.meta}
                        {a.acc ? <TagChip>Accepted</TagChip> : null}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="m-0 text-[15px] text-muted-2">
                  No answers yet.{" "}
                  <Link
                    href="/?sort=Unanswered"
                    className="font-semibold text-accent no-underline hover:text-accent-hover"
                  >
                    Browse unanswered questions
                  </Link>{" "}
                  that match your expertise.
                </p>
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
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-meta">
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
