"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import {
  Avatar,
  FilterChip,
  PlaceholderPhoto,
  SegmentedControl,
  StatusChip,
} from "@/components/ui";
import { FEATURES } from "@/lib/features";
import {
  getGarageItemsFor,
  getSessionHandle,
  getWantedLines,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { getGarage } from "@/lib/data/seed";

const categories = [
  "All",
  "Complete bikes",
  "Framesets",
  "Groupsets",
  "Components",
  "Wheels",
  "Tools",
];

export default function GaragePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("");
  const [cat, setCat] = useState("All");
  const [view, setView] = useState("Grid");
  const [availability, setAvailability] = useState("Everything");

  useEffect(() => {
    setReady(true);
    setSessionHandle(getSessionHandle());
    return subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((t) => t + 1);
    });
  }, []);
  void tick;

  const person = ready ? resolvePerson(handle) : undefined;
  const isOwnGarage = Boolean(sessionHandle && sessionHandle === handle);
  const garage = getGarage(handle);
  const ownerWanted = ready ? getWantedLines(handle) : [];

  const items = useMemo(() => {
    if (!ready) return [];
    return getGarageItemsFor(handle).filter((item) => {
      if (cat !== "All" && item.catShort !== cat) return false;
      if (availability === "Available only") {
        return item.status !== "Not for sale";
      }
      if (availability === "Not for sale") {
        return item.status === "Not for sale";
      }
      return true;
    });
  }, [handle, cat, availability, tick, ready]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading garage…
      </div>
    );
  }

  if (!person) notFound();
  const garageName = garage?.name ?? `${person.name.split(" ")[0]}'s garage`;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 pb-7 pt-9">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap gap-2 text-[13px] text-muted"
          >
            <Link href={`/u/${handle}/garage`}>Garages</Link>
            <span aria-hidden>/</span>
            <Link href={`/u/${handle}`}>{person.name}</Link>
            <span aria-hidden>/</span>
            <span>{garageName}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3">
              <p className="eyebrow m-0">
                Garage · {garage?.location ?? person.loc.split("·")[0]?.trim()} · Updated{" "}
                {garage?.updated ?? "recently"}
              </p>
              <h1 className="font-display m-0 text-[clamp(40px,7vw,72px)]">
                {garageName}
              </h1>
              <p className="m-0 max-w-[640px] text-[17px] leading-[1.55] text-muted-2">
                {garage?.description ?? person.bio}
              </p>
              <Link
                href={`/u/${handle}`}
                className="inline-flex items-center gap-2.5 self-start text-ink no-underline hover:text-accent-hover"
              >
                <Avatar init={person.init} bg={person.bg} size={40} />
                <span>
                  <span className="block font-semibold">{person.name}</span>
                  <span className="block text-[13px] text-muted">
                    ★ {person.rating}
                    <Feature name="spokesCurrency">
                      <> · {person.spokesNum.toLocaleString()} Spokes</>
                    </Feature>
                    <Feature name="spokesLevels">
                      <> · {person.level}</>
                    </Feature>
                  </span>
                </span>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Feature name="followGarage">
                <button
                  type="button"
                  className="h-[46px] rounded-[10px] border-0 bg-ink px-[18px] font-semibold text-white"
                >
                  Follow garage
                </button>
              </Feature>
              <Link
                href="/ask"
                className="inline-flex h-[46px] items-center rounded-[10px] border border-[#D4D3CD] bg-white px-[18px] font-semibold text-ink no-underline hover:text-ink"
              >
                Ask about an item
              </Link>
            </div>
          </div>

          <div className="grid overflow-hidden rounded-[14px] border border-line grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
            {[
              [String(getGarageItemsFor(handle).length), "Documented items"],
              ...(FEATURES.marketValues
                ? ([
                    ["$41.2k", "Est. market value"],
                    [
                      String(
                        getGarageItemsFor(handle).filter((i) => i.status !== "Not for sale")
                          .length,
                      ),
                      "Available now",
                      true,
                    ],
                    ["+7.4%", "Value, last 12 mo"],
                  ] as [string, string, boolean?][])
                : ([
                    [
                      String(
                        getGarageItemsFor(handle).filter((i) => i.status !== "Not for sale")
                          .length,
                      ),
                      "Available now",
                      true,
                    ],
                  ] as [string, string, boolean?][])),
              ...(FEATURES.followerCounts
                ? ([["1,912", "Followers"]] as [string, string, boolean?][])
                : []),
            ].map(([n, label, accent]) => (
              <div key={String(label)} className="border-r border-line px-5 py-4 last:border-r-0">
                <div
                  className={`font-display text-[32px] ${accent ? "text-accent" : ""}`}
                >
                  {n}
                </div>
                <div className="text-[13px] text-muted">{label}</div>
              </div>
            ))}
          </div>

          <Feature name="marketValues">
            <div className="flex flex-col gap-2">
              <div
                className="flex h-3.5 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label="Value by category"
              >
                <span className="w-[52%] bg-ink" />
                <span className="w-[21%] bg-accent" />
                <span className="w-[15%] bg-accent-bright" />
                <span className="w-[7%] bg-blue" />
                <span className="w-[5%] bg-[#A8C487]" />
              </div>
              <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted-2">
                {[
                  ["#10171B", "Complete bikes 52%"],
                  ["#527D31", "Framesets 21%"],
                  ["#6F963B", "Groupsets 15%"],
                  ["#1E40AF", "Components 7%"],
                  ["#A8C487", "Wheels & tools 5%"],
                ].map(([c, label]) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px]" style={{ background: c }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </Feature>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7 pb-16">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-[1_1_500px] flex-wrap gap-2">
            {categories.map((c) => (
              <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-[14px] text-muted">
            Show
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="cf-select h-10 rounded-lg border border-[#D4D3CD] bg-white pl-2.5 text-ink"
            >
              <option>Everything</option>
              <option>Available only</option>
              <option>Not for sale</option>
            </select>
          </label>
          <SegmentedControl
            options={["Grid", "Inventory table"]}
            value={view}
            onChange={setView}
            ariaLabel="View"
          />
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No items yet — add your first bike"
            description="Document what you own so others can ask about it and you can link questions to real parts."
            actionLabel="Add an item"
            actionHref="/item/new"
          />
        ) : view === "Grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/i/${item.id}`}
                className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-ink no-underline hover:text-ink"
              >
                <PlaceholderPhoto label={`${item.year} · ${item.cond}`} className="h-[180px]" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-muted">{item.cat}</span>
                    <StatusChip status={item.status} />
                  </div>
                  <span className="text-[16px] font-semibold leading-snug">{item.name}</span>
                  <div className="flex justify-between gap-2 text-[13px]">
                    <Feature name="marketValues">
                      <span>
                        <span className="block text-[11px] text-muted">MARKET</span>
                        <span className="font-mono">{item.mkt}</span>
                      </span>
                    </Feature>
                    <span className="text-right">
                      <span className="block text-[11px] text-muted">ASKING</span>
                      <span className="font-mono">{item.ask}</span>
                    </span>
                  </div>
                  <Feature name="marketValues">
                    <div className="flex justify-between text-[12px] text-muted">
                      <span>{item.links}</span>
                      <span>{item.trend}</span>
                    </div>
                  </Feature>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
            <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
              <thead className="border-b border-line bg-ground font-mono text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Ask</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-line-soft">
                    <td className="px-4 py-3">
                      <Link href={`/i/${item.id}`} className="font-semibold text-ink no-underline hover:text-accent-hover">
                        {item.name}
                      </Link>
                      <div className="font-mono text-[11px] text-muted">
                        {item.cat} · {item.year}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.cond}</td>
                    <td className="px-4 py-3 font-mono">{item.mkt}</td>
                    <td className="px-4 py-3 font-mono">{item.ask}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <section className="rounded-[14px] border border-accent-soft-border bg-accent-soft p-5">
            <h2 className="font-display mb-1 mt-0 text-[22px]">Wanted</h2>
            <p className="mb-3 mt-0 text-[13px] text-[#3d5f24]">
              Parts {person.name.split(" ")[0]} is hunting for.
            </p>
            {ownerWanted.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {ownerWanted.map((line) => (
                  <li
                    key={line}
                    className="rounded-[10px] border border-accent-soft-border bg-white px-3.5 py-3 text-[14px] leading-snug text-ink"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No wanted parts yet"
                description={
                  isOwnGarage
                    ? "Add plain-text lines for parts you’re looking for."
                    : `${person.name.split(" ")[0]} hasn’t listed wanted parts yet.`
                }
                actionLabel={isOwnGarage ? "Edit profile" : undefined}
                actionHref={isOwnGarage ? "/settings/profile" : undefined}
              />
            )}
          </section>
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="font-display mb-3 mt-0 text-[22px]">Recent activity</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[14px]">
              <li className="border-b border-line-soft pb-3">
                <span className="font-semibold">Listed Masi Gran Criterium for sale</span>
                <div className="text-[13px] text-muted">2 days ago</div>
              </li>
              <li className="border-b border-line-soft pb-3">
                <span className="font-semibold">Updated market value on Colnago Super</span>
                <div className="text-[13px] text-muted">5 days ago</div>
              </li>
              <li>
                <span className="font-semibold">Added provenance note to Super Record group</span>
                <div className="text-[13px] text-muted">1 week ago</div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
