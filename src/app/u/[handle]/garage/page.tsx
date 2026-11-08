"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { Feature } from "@/components/Feature";
import { GarageItemActions } from "@/components/garage/GarageItemActions";
import { MessageMember } from "@/components/messaging/MessageMember";
import {
  Avatar,
  FilterChip,
  PlaceholderPhoto,
  SegmentedControl,
  StatusChip,
} from "@/components/ui";
import {
  getGarageItemsFor,
  getItemPhotoUrls,
  getSessionHandle,
  getWantedLines,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { ITEM_CATEGORIES } from "@/lib/data/categories";
import { formatAskPrice, itemYearLabel } from "@/lib/garage/itemFields";
import { garageActivityFor, getGarage } from "@/lib/data/seed";
import { Archive, Eye, ShieldCheck } from "lucide-react";

const categories = ["All", ...ITEM_CATEGORIES];

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
    return subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((t) => t + 1);
    });
  }, []);
  void tick;

  const person = ready ? resolvePerson(handle) : undefined;
  const isOwner = Boolean(sessionHandle && sessionHandle === handle);
  /** Owner chrome hidden while previewing as a visitor. */
  const isOwnGarage = isOwner && !previewVisitor;
  const garage = getGarage(handle);
  const ownerWanted = ready ? getWantedLines(handle) : [];
  const allItems = ready ? getGarageItemsFor(handle) : [];
  const activeItems = allItems.filter((i) => !i.archived);
  const availableCount = activeItems.filter((i) => i.status !== "Not for sale").length;
  const firstName = person?.name.split(" ")[0] || "Member";

  const items = useMemo(() => {
    if (!ready) return [];
    return getGarageItemsFor(handle).filter((item) => {
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
  }, [handle, cat, availability, tick, ready]);

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

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading garage…
      </div>
    );
  }

  if (!person) notFound();
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
                    <Link
                      href="/item/new"
                      className="inline-flex h-[46px] items-center rounded-[10px] border-0 bg-accent px-[18px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                    >
                      Add an item
                    </Link>
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
                  <span className="font-mono tabular-nums">{activeItems.length}</span>
                  <span className="ml-1.5">items</span>
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
                ? "No archived items"
                : isOwnGarage
                  ? "No items yet — add your first bike"
                  : "Nothing in this garage yet"
            }
            description={
              availability === "Archived"
                ? "Archived items stay here until you restore or delete them."
                : isOwnGarage
                  ? "Document what you own so others can ask about it and you can link questions to real parts."
                  : `${firstName} hasn’t added any items that match these filters.`
            }
            actionLabel={
              isOwnGarage && availability !== "Archived" ? "Add an item" : undefined
            }
            actionHref={
              isOwnGarage && availability !== "Archived" ? "/item/new" : undefined
            }
          />
        ) : view === "Grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {items.map((item) => {
              const photos = getItemPhotoUrls(item);
              const showAsk = item.status !== "Not for sale" && !item.archived;
              const askLabel =
                (!item.ask || item.ask === "—") && item.status === "Open to offers"
                  ? "Make an offer"
                  : formatAskPrice(item.ask);
              return (
              <div
                key={item.id}
                className={`relative flex flex-col overflow-hidden rounded-[14px] border bg-surface ${
                  item.archived ? "border-line-soft opacity-90" : "border-line"
                } ${justAddedId === item.id ? "ring-2 ring-accent/40" : ""}`}
              >
                {isOwnGarage ? (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <GarageItemActions item={item} />
                  </div>
                ) : null}
                <Link
                  href={`/i/${item.id}`}
                  className="flex flex-col text-ink no-underline hover:text-ink"
                >
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[0]}
                      alt=""
                      className="h-[180px] w-full object-cover"
                    />
                  ) : (
                    <PlaceholderPhoto
                      label={[itemYearLabel(item.year), item.cond].filter(Boolean).join(" · ")}
                      className="h-[180px]"
                      silhouette
                    />
                  )}
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2 pr-10">
                      <span className="font-mono text-[11px] text-muted">{item.cat}</span>
                      {item.archived ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-ground px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] text-muted-2">
                          <Archive className="size-3" aria-hidden />
                          Archived
                        </span>
                      ) : (
                        <StatusChip status={item.status} />
                      )}
                    </div>
                    <span className="text-[16px] font-semibold leading-snug">{item.name}</span>
                    {item.description ? (
                      <p className="m-0 line-clamp-2 text-[13px] leading-snug text-muted-2">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="flex justify-between gap-2 text-[13px]">
                      <Feature name="marketValues">
                        <span>
                          <span className="block text-[11px] text-muted">MARKET</span>
                          <span className="font-mono tabular-nums">{item.mkt}</span>
                        </span>
                      </Feature>
                      {showAsk ? (
                        <span className="text-right">
                          <span className="block text-[11px] text-muted">ASKING</span>
                          <span className="font-mono tabular-nums">{askLabel}</span>
                        </span>
                      ) : null}
                    </div>
                    <Feature name="marketValues">
                      <div className="flex justify-between text-[12px] text-muted">
                        <span>{item.links}</span>
                        <span>{item.trend}</span>
                      </div>
                    </Feature>
                  </div>
                </Link>
              </div>
            );
            })}
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
