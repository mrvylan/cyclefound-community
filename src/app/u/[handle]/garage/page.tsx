"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import { GarageItemActions } from "@/components/garage/GarageItemActions";
import { AddToGarageCta } from "@/components/forms/garage-item/AddToGarageCta";
import { ItemCard } from "@/components/ItemCard";
import { MessageMember } from "@/components/messaging/MessageMember";
import {
  Avatar,
  FilterChip,
  SegmentedControl,
  StatusChip,
} from "@/components/ui";
import {
  hydrateCommunityDirectory,
  isCommunityDirectoryReady,
} from "@/lib/community/directory-cache";
import {
  getGarageItemsFor,
  getSessionHandle,
  getWantedLines,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { formatAskPrice } from "@/lib/garage/itemFields";
import {
  categoriesForGarageTab,
  isBikeItem,
  isPartsOrGearItem,
} from "@/lib/garage/item-types";
import { garageActivityFor, getGarage } from "@/lib/data/seed";
import { Archive, Eye, ShieldCheck } from "lucide-react";

type GarageTab = "bikes" | "parts";

export default function GaragePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("");
  const [previewVisitor, setPreviewVisitor] = useState(false);
  const [garageTab, setGarageTab] = useState<GarageTab>("bikes");
  const [cat, setCat] = useState("All");
  const [view, setView] = useState("Grid");
  const [availability, setAvailability] = useState("Everything");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("availability");
    if (
      raw === "Available only" ||
      raw === "Not for sale" ||
      raw === "Everything" ||
      raw === "Archived"
    ) {
      setAvailability(raw);
    }
    const added = params.get("added");
    if (added) setJustAddedId(added);
    setReady(true);
    setSessionHandle(getSessionHandle());
    let cancelled = false;
    const unsub = subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((t) => t + 1);
    });
    void hydrateCommunityDirectory().then(() => {
      if (!cancelled) setTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  void tick;

  const person = ready ? resolvePerson(handle) : undefined;
  const directoryReady = isCommunityDirectoryReady();
  const isOwner = Boolean(sessionHandle && sessionHandle === handle);
  /** Owner chrome hidden while previewing as a visitor. */
  const isOwnGarage = isOwner && !previewVisitor;
  const garage = getGarage(handle);
  const ownerWanted = ready ? getWantedLines(handle) : [];
  const allItems = ready ? getGarageItemsFor(handle) : [];
  const activeItems = allItems.filter((i) => !i.archived);
  const bikeItems = activeItems.filter(isBikeItem);
  const partsGearItems = activeItems.filter(isPartsOrGearItem);
  const tabActiveItems = garageTab === "bikes" ? bikeItems : partsGearItems;
  const availableCount = tabActiveItems.filter((i) => i.status !== "Not for sale").length;
  const firstName = person?.name.split(" ")[0] || "Member";
  const categoryFilters = ["All", ...categoriesForGarageTab(garageTab)];

  const items = useMemo(() => {
    if (!ready) return [];
    return getGarageItemsFor(handle).filter((item) => {
      if (garageTab === "bikes" ? !isBikeItem(item) : !isPartsOrGearItem(item)) {
        return false;
      }
      if (cat !== "All" && item.catShort !== cat) return false;
      const archived = Boolean(item.archived);
      if (availability === "Archived") return archived;
      if (archived) return false;
      if (availability === "Available only") {
        return item.status !== "Not for sale";
      }
      if (availability === "Not for sale") {
        return item.status === "Not for sale";
      }
      return true;
    });
  }, [handle, garageTab, cat, availability, tick, ready]);

  function setTab(next: GarageTab) {
    setGarageTab(next);
    setCat("All");
  }

  function memberTrustLine() {
    if (!person) return "";
    const parts: string[] = [];
    if (person.reviews > 0 && person.rating !== "New") {
      parts.push(`${person.rating} · ${person.reviews} reviews`);
    } else {
      parts.push("No reviews yet");
    }
    if (person.memberSince) parts.push(`Member since ${person.memberSince}`);
    return parts.join(" · ");
  }

  if (!ready || (!person && !directoryReady)) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading garage…
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <h1 className="section-title m-0 text-[44px] text-ink">Garage not found</h1>
        <p className="mt-4 text-[16px] text-muted-2">
          No member matches <span className="font-mono">@{handle}</span>.
        </p>
        <Link href="/garages" className="mt-6 inline-flex font-semibold text-accent">
          Browse garages
        </Link>
      </div>
    );
  }

  const garageName = garage?.name ?? `${person.name.split(" ")[0]}'s garage`;
  const justAdded = justAddedId
    ? getGarageItemsFor(handle).find((i) => i.id === justAddedId)
    : undefined;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 pb-7 pt-9">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap gap-2 text-[13px] text-muted"
          >
            <Link href="/garages">Garages</Link>
            <span aria-hidden>/</span>
            <span>{garageName}</span>
          </nav>

          {justAdded && isOwnGarage ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-accent-soft-border bg-accent-soft px-4 py-3"
            >
              <p className="m-0 text-[14px] text-ink">
                <span className="font-semibold">{justAdded.name}</span> is in your garage.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/i/${justAdded.id}`}
                  className="inline-flex h-9 items-center rounded-[8px] bg-white px-3 text-[13px] font-semibold text-ink no-underline hover:bg-ground"
                >
                  View item
                </Link>
                <button
                  type="button"
                  onClick={() => setJustAddedId(null)}
                  className="inline-flex h-9 items-center px-2 text-[13px] font-semibold text-accent-hover"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          {isOwner && previewVisitor ? (
            <div
              role="status"
              className="rounded-[14px] border border-line bg-ground px-4 py-3 text-[14px] text-muted-2"
            >
              <strong className="text-ink">Previewing as a visitor.</strong> Owner
              controls are hidden; visitors see Message and related actions here.
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
              <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2.5">
                {isOwnGarage ? (
                  <p className="m-0 font-mono text-[12px] font-medium tracking-[0.08em] uppercase text-accent">
                    Your garage
                  </p>
                ) : null}
                <p className="m-0 text-[13px] text-muted">
                  {[
                    garage?.location ?? person.loc.split("·")[0]?.trim(),
                    `Updated ${garage?.updated ?? "recently"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h1 className="section-title m-0 text-[clamp(32px,5vw,52px)]">
                  {garageName}
                </h1>
                <p className="m-0 max-w-[640px] text-[17px] leading-[1.55] text-muted-2">
                  {garage?.description ?? person.bio}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {isOwner ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={previewVisitor}
                    onClick={() => setPreviewVisitor((v) => !v)}
                    className={`inline-flex h-[46px] items-center gap-2 rounded-[10px] border px-[18px] font-semibold ${
                      previewVisitor
                        ? "border-ink bg-ink text-white"
                        : "border-[#D4D3CD] bg-white text-ink hover:bg-ground"
                    }`}
                  >
                    <Eye className="size-4" aria-hidden />
                    Preview as visitor
                  </button>
                ) : null}
                {isOwnGarage ? (
                  <>
                    <Link
                      href="/settings/profile"
                      className="inline-flex h-[46px] items-center rounded-[10px] border border-[#D4D3CD] bg-white px-[18px] font-semibold text-ink no-underline hover:bg-ground hover:text-ink"
                    >
                      Edit profile
                    </Link>
                    <AddToGarageCta className="inline-flex h-[46px] items-center rounded-[10px] border-0 bg-accent px-[18px] font-semibold text-white hover:bg-accent-hover">
                      Add to garage
                    </AddToGarageCta>
                  </>
                ) : (
                  <>
                    <MessageMember
                      handle={person.handle}
                      name={person.name}
                      variant="light"
                      askLabel={`Ask ${firstName}`}
                      showWhenSelf={previewVisitor}
                    />
                    <Feature name="followGarage">
                      <button
                        type="button"
                        className="h-[46px] rounded-[10px] border border-[#D4D3CD] bg-white px-[18px] font-semibold text-ink"
                      >
                        Follow
                      </button>
                    </Feature>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft pt-4">
              <Link
                href={`/u/${handle}`}
                className="inline-flex items-center gap-2.5 text-ink no-underline hover:text-accent-hover"
              >
                <Avatar
                  init={person.init}
                  bg={person.bg}
                  size={40}
                  src={person.avatarUrl}
                />
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{person.name}</span>
                    {person.verified ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue">
                        <ShieldCheck className="size-3.5" aria-hidden />
                        Verified
                      </span>
                    ) : person.roleBadge ? (
                      <span className="font-mono text-[11px] tracking-[0.06em] text-accent">
                        {person.roleBadge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {memberTrustLine()}
                  </span>
                </span>
              </Link>

              <div
                className="ml-auto flex flex-wrap gap-1.5"
                role="group"
                aria-label="Item counts"
              >
                <button
                  type="button"
                  onClick={() => setAvailability("Everything")}
                  className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                    availability === "Everything"
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink hover:bg-ground"
                  }`}
                >
                  <span className="font-mono tabular-nums">{tabActiveItems.length}</span>
                  <span className="ml-1.5">
                    {garageTab === "bikes" ? "bikes" : "parts & gear"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability("Available only")}
                  className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                    availability === "Available only"
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink hover:bg-ground"
                  }`}
                >
                  <span className="font-mono tabular-nums text-accent">{availableCount}</span>
                  <span className="ml-1.5">available</span>
                </button>
                {isOwnGarage ? (
                  <button
                    type="button"
                    onClick={() => setAvailability("Archived")}
                    className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                      availability === "Archived"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-ink hover:bg-ground"
                    }`}
                  >
                    Archived
                  </button>
                ) : null}
              </div>
            </div>
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
                  ["#1E40AF", "Components 22%"],
                  ["#A8C487", "Wheels, tools & accessories 5%"],
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
          <SegmentedControl
            options={["Bikes", "Parts & gear"]}
            value={garageTab === "bikes" ? "Bikes" : "Parts & gear"}
            onChange={(v) => setTab(v === "Bikes" ? "bikes" : "parts")}
            ariaLabel="Garage section"
          />
          <div className="flex min-w-0 flex-[1_1_420px] flex-wrap gap-2">
            {categoryFilters.map((c) => (
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
              {isOwnGarage ? <option>Archived</option> : null}
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
            title={
              availability === "Archived"
                ? garageTab === "bikes"
                  ? "No archived bikes"
                  : "No archived parts or gear"
                : isOwnGarage
                  ? garageTab === "bikes"
                    ? "No bikes yet — add your first bike"
                    : "No parts or gear yet"
                  : garageTab === "bikes"
                    ? "No bikes in this garage"
                    : "No parts or gear in this garage"
            }
            description={
              availability === "Archived"
                ? "Archived items stay here until you restore or delete them."
                : isOwnGarage
                  ? garageTab === "bikes"
                    ? "Document complete bikes and framesets so others can ask about them."
                    : "Add components, wheels, accessories, and tools — install parts on a bike when they belong there."
                  : `${firstName} hasn’t added any ${
                      garageTab === "bikes" ? "bikes" : "parts or gear"
                    } that match these filters.`
            }
            actionLabel={
              isOwnGarage && availability !== "Archived" ? "Add to garage" : undefined
            }
            actionHref={
              isOwnGarage && availability !== "Archived"
                ? garageTab === "bikes"
                  ? "/garage/new?type=bike"
                  : "/garage/new"
                : undefined
            }
          />
        ) : view === "Grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                photoHeight={180}
                className={`${item.archived ? "opacity-90" : ""} ${
                  justAddedId === item.id ? "ring-2 ring-accent/40" : ""
                }`}
                overlay={
                  isOwnGarage ? (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <GarageItemActions item={item} />
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
            <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
              <thead className="border-b border-line bg-ground font-mono text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Ask</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isOwnGarage ? (
                    <th className="px-4 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-line-soft ${
                      justAddedId === item.id ? "bg-accent-soft/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/i/${item.id}`} className="font-semibold text-ink no-underline hover:text-accent-hover">
                        {item.name}
                      </Link>
                      <div className="font-mono text-[11px] text-muted">
                        {item.cat}
                        {item.year && item.year !== "—" ? ` · ${item.year}` : ""}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-[13px] text-muted-2">
                      {item.description ? (
                        <span className="line-clamp-2">{item.description}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{item.cond}</td>
                    <td className="px-4 py-3 font-mono">{item.mkt}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {item.status === "Not for sale" || item.archived
                        ? "—"
                        : (!item.ask || item.ask === "—") && item.status === "Open to offers"
                          ? "Make an offer"
                          : formatAskPrice(item.ask)}
                    </td>
                    <td className="px-4 py-3">
                      {item.archived ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-ground px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] text-muted-2">
                          <Archive className="size-3" aria-hidden />
                          Archived
                        </span>
                      ) : (
                        <StatusChip status={item.status} />
                      )}
                    </td>
                    {isOwnGarage ? (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex justify-end">
                          <GarageItemActions item={item} compact />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <section className="rounded-[14px] border border-accent-soft-border bg-accent-soft p-5">
            <h2 className="section-title mb-1 mt-0 text-[20px]">Wanted</h2>
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
            <h2 className="section-title mb-3 mt-0 text-[20px]">Recent activity</h2>
            {(() => {
              const activity = garageActivityFor(handle);
              if (!activity.length) {
                return (
                  <p className="m-0 text-[14px] text-muted-2">
                    No recent garage activity yet.
                  </p>
                );
              }
              return (
                <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[14px]">
                  {activity.map((line, idx) => (
                    <li
                      key={line.title}
                      className={
                        idx < activity.length - 1
                          ? "border-b border-line-soft pb-3"
                          : undefined
                      }
                    >
                      <span className="font-semibold">{line.title}</span>
                      <div className="text-[13px] text-meta">{line.time}</div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>
        </div>
      </div>
    </>
  );
}
