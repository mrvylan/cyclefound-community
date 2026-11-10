"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Feature } from "@/components/Feature";
import { GarageItemActions } from "@/components/garage/GarageItemActions";
import { BuildOriginBadge } from "@/components/garage/BuildOriginBadge";
import { ItemDescription } from "@/components/garage/ItemDescription";
import { ItemSpecsCard } from "@/components/garage/ItemSpecsCard";
import { MessageOwner } from "@/components/messaging/MessageOwner";
import {
  Avatar,
  LevelBadge,
  PlaceholderPhoto,
  StatusChip,
} from "@/components/ui";
import {
  hydrateCommunityDirectory,
  isCommunityDirectoryReady,
} from "@/lib/community/directory-cache";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { FEATURES } from "@/lib/features";
import {
  canManageGarageItem,
  displayHandleFor,
  getItemLocal,
  getItemPhotoUrls,
  getItemPrivateMeta,
  getSessionHandle,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  formatAskPrice,
  itemDisplayTitle,
  itemYearLabel,
} from "@/lib/garage/itemFields";
import {
  getGarage,
  itemDetail,
  resolveCompatibleParts,
  resolveSameModelCards,
} from "@/lib/data/seed";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [range, setRange] = useState<"1Y" | "5Y" | "All">("5Y");
  const [watching, setWatching] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("");

  useEffect(() => {
    let cancelled = false;
    setReady(true);
    setSessionHandle(getSessionHandle());
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

  const item = getItemLocal(id);
  const owner = item ? resolvePerson(item.ownerHandle) : undefined;
  const garage = item ? getGarage(item.ownerHandle) : undefined;
  const directoryReady = isCommunityDirectoryReady();
  const authHandle = profile ? handleFromAuthProfile(profile) : "";
  const isOwner = Boolean(
    item &&
      (canManageGarageItem(item, sessionHandle) ||
        canManageGarageItem(item, authHandle)),
  );

  if (!ready || ((!item || !owner) && !directoryReady)) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading item…
      </div>
    );
  }

  if (!item || !owner) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <h1 className="section-title m-0 text-[44px] text-ink">Item not found</h1>
        <p className="mt-4 text-[16px] text-muted-2">
          This garage item is unavailable or still loading.
        </p>
        <Link href="/garages" className="mt-6 inline-flex font-semibold text-accent">
          Browse garages
        </Link>
      </div>
    );
  }

  const itemPhotos = getItemPhotoUrls(item);
  const itemMeta = getItemPrivateMeta(id);
  const yearLabel = itemYearLabel(item.year);
  const displayTitle = itemDisplayTitle(item.name, item.year);
  const titleShort =
    displayTitle.length > 42 ? `${displayTitle.slice(0, 40).trim()}…` : displayTitle;
  const longTitle = displayTitle.length > 40;
  const garageName =
    garage?.name ?? `${owner.name.split(" ")[0] || "Member"}'s garage`;
  const publicHandle = displayHandleFor(owner);

  const trend = itemDetail.trendBars[range];
  const labels = itemDetail.photoLabels;
  const sameModels = resolveSameModelCards();
  const compatibleParts = resolveCompatibleParts();
  // Seed-only rich detail (e.g. Colnago demo item) is retired with mock data.
  const showRichDetail = false;
  const basicSpecs = [
    { k: "Category", v: item.catShort },
    ...(yearLabel ? [{ k: "Year", v: yearLabel }] : []),
    ...(item.size?.trim() ? [{ k: "Size", v: item.size.trim() }] : []),
    { k: "Condition", v: item.cond },
    { k: "Status", v: item.status },
    ...(FEATURES.marketValues ? [{ k: "Market", v: item.mkt }] : []),
    { k: "Asking", v: formatAskPrice(item.ask) },
  ];
  const rawSpecs = basicSpecs;
  const specs = FEATURES.verifiedBadges
    ? rawSpecs
    : rawSpecs.filter((s) => !/originality/i.test(s.k));

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-8 py-6 pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-meta">
        <Link href="/garages">Garages</Link>
        <span aria-hidden>/</span>
        <Link href={`/u/${owner.handle}/garage`}>{garageName}</Link>
        <span aria-hidden>/</span>
        <span>{titleShort}</span>
      </nav>

      {/* Mobile: photos → title/actions → specs. Desktop: photos+specs | sidebar. */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="flex min-w-0 flex-col gap-2.5">
          {itemPhotos.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={itemPhotos[photo] ?? itemPhotos[0]}
              alt=""
              className="aspect-[4/3] max-h-[520px] min-h-[280px] w-full rounded-[18px] object-cover"
            />
          ) : (
            <PlaceholderPhoto
              label={`Photo ${photo + 1} of ${labels.length} · ${labels[photo] ?? "Item"}`}
              className="aspect-[4/3] max-h-[520px] min-h-[280px] rounded-[18px]"
            />
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5">
            {(itemPhotos.length ? itemPhotos : labels).map((labelOrSrc, i) => (
              <button
                key={typeof labelOrSrc === "string" ? labelOrSrc.slice(0, 24) + i : i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                onClick={() => setPhoto(i)}
                className={`h-14 overflow-hidden rounded-[10px] p-0 sm:h-[72px] ${
                  photo === i ? "border-[3px] border-accent" : "border border-line"
                } ${itemPhotos.length ? "" : "ph"}`}
              >
                {itemPhotos.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={itemPhotos[i]} alt="" className="size-full object-cover" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-[18px] lg:row-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            {item.archived ? (
              <span className="inline-flex items-center rounded-full border border-line bg-ground px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] text-muted-2">
                Archived
              </span>
            ) : null}
            {isOwner ? (
              <div className="ml-auto">
                <GarageItemActions item={item} compact />
              </div>
            ) : null}
          </div>
          <h1
            className={`section-title m-0 ${
              longTitle
                ? "text-[clamp(24px,3.6vw,36px)] leading-[1.15]"
                : "text-[clamp(36px,5vw,56px)]"
            }`}
          >
            {displayTitle}
          </h1>
          <p className="m-0 text-[17px] text-muted-2">
            {showRichDetail
              ? "Saronni red · 56 cm c-t-c · Campagnolo Super Record · Excellent original condition"
              : [item.cond, item.size?.trim()].filter(Boolean).join(" · ")}
          </p>
          {item.bikeComponents?.length ? (
            <BuildOriginBadge components={item.bikeComponents} />
          ) : null}
          {!showRichDetail && item.description ? (
            <ItemDescription text={item.description} />
          ) : null}

          <section
            aria-label={isOwner ? "Your garage" : "Owner"}
            className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-3.5"
          >
            <div className="flex items-center gap-3">
              <Avatar init={owner.init} bg={owner.bg} size={46} src={owner.avatarUrl} />
              <span className="min-w-0 flex-1">
                <Link
                  href={`/u/${owner.handle}`}
                  className="block font-bold text-ink no-underline hover:text-accent-hover"
                >
                  {owner.name}
                </Link>
                <span className="block text-[13px] text-meta">
                  {[
                    publicHandle ? `@${publicHandle}` : null,
                    owner.rating && owner.rating !== "New" ? `★ ${owner.rating}` : null,
                    FEATURES.spokesCurrency
                      ? `${owner.spokesNum.toLocaleString()} Spokes`
                      : null,
                    `Member since ${owner.memberSince}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {owner.roleBadge && owner.roleBadge.toLowerCase() !== "member" ? (
                  <span className="mt-1 block font-mono text-[12px] font-medium tracking-[0.04em] text-accent-hover">
                    {owner.roleBadge}
                  </span>
                ) : null}
              </span>
              <Feature name="spokesLevels">
                <LevelBadge level={owner.level} bright />
              </Feature>
            </div>
            {!isOwner ? (
              <>
                <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 border-t border-line-soft pt-3 text-[13px] text-meta">
                  <span>
                    <span className="font-mono tabular-nums text-ink">{owner.accepted}</span>{" "}
                    solved
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/u/${owner.handle}`}
                    className="inline-flex h-11 items-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[14px] font-semibold text-ink no-underline hover:border-ink hover:text-ink"
                  >
                    View profile
                  </Link>
                  <Link
                    href={`/u/${owner.handle}/garage`}
                    className="inline-flex h-11 items-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[14px] font-semibold text-ink no-underline hover:border-ink hover:text-ink"
                  >
                    See their garage
                  </Link>
                </div>
              </>
            ) : null}
          </section>

          <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5">
            {isOwner ? (
              <>
                <p className="m-0 text-[14px] leading-normal text-muted-2">
                  This is in your garage
                  {item.status === "Not for sale" ? " — not listed for sale" : ""}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/item/${item.id}/edit`}
                    className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-[15px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit item
                  </Link>
                  <Link
                    href={`/u/${owner.handle}/garage`}
                    className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[15px] font-semibold text-ink no-underline hover:border-ink hover:text-ink"
                  >
                    Back to garage
                  </Link>
                </div>
              </>
            ) : item.status === "Not for sale" ? (
              <>
                <p className="m-0 text-[14px] leading-normal text-muted-2">
                  Documented in {owner.name.split(" ")[0]}&apos;s garage — not listed for sale.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/u/${owner.handle}/garage`}
                    className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] bg-ink px-4 text-[15px] font-semibold text-white no-underline hover:text-white"
                  >
                    Back to garage
                  </Link>
                  <Link
                    href="/ask"
                    className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[15px] font-semibold text-ink no-underline hover:border-ink hover:text-ink"
                  >
                    Ask about this
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Feature name="marketValues">
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="m-0 text-[15px] font-bold normal-case tracking-normal">
                        Market value
                      </h2>
                      {showRichDetail ? (
                        <div
                          role="group"
                          aria-label="Range"
                          className="flex gap-0.5 rounded-lg bg-line-soft p-0.5"
                        >
                          {(["1Y", "5Y", "All"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRange(r)}
                              className={`h-[30px] rounded-md border-0 px-2.5 text-[12px] font-semibold ${
                                range === r
                                  ? "bg-white text-ink"
                                  : "bg-transparent text-muted-2"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-display text-[44px]">{item.mkt}</span>
                      {showRichDetail ? (
                        <span className="text-[14px] font-semibold text-value-up">{trend.t}</span>
                      ) : item.trend !== "Flat" ? (
                        <span
                          className={`text-[14px] font-semibold ${
                            item.trend.startsWith("−") || item.trend.startsWith("-")
                              ? "text-value-down"
                              : "text-value-up"
                          }`}
                        >
                          {item.trend}
                        </span>
                      ) : null}
                    </div>
                    {showRichDetail ? (
                      <>
                        <div
                          className="flex h-[110px] items-end gap-1.5"
                          role="img"
                          aria-label="Median value trend chart"
                        >
                          {trend.v.map((v, i) => (
                            <div
                              key={i}
                              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                            >
                              <span
                                className="w-full rounded-t"
                                style={{
                                  height: `${v}%`,
                                  background:
                                    i === trend.v.length - 1 ? "var(--accent)" : "var(--ink)",
                                }}
                              />
                              <span className="font-mono text-[10px] text-muted">
                                {trend.l[i]}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="m-0 text-[12px] leading-normal text-muted">
                          Median $2,780. Based on 23 comparable sales and 6 member appraisals.
                          Values are estimates — verify condition and originality.
                        </p>
                      </>
                    ) : (
                      <p className="m-0 text-[12px] leading-normal text-muted">
                        Values are estimates — verify condition and originality.
                      </p>
                    )}
                  </>
                </Feature>
                <div
                  className={`flex flex-wrap items-center justify-between gap-2.5 ${
                    FEATURES.marketValues ? "border-t border-line-soft pt-3.5" : ""
                  }`}
                >
                  <span>
                    <span className="block text-[12px] text-muted">
                      {owner.name.split(" ")[0].toUpperCase()} WOULD LET IT GO FOR
                    </span>
                    <span className="font-mono text-2xl font-medium tabular-nums">
                      {formatAskPrice(item.ask)}
                    </span>
                  </span>
                  <span className="text-right text-[13px] text-muted-2">
                    Local pickup, {garage?.location ?? owner.loc.split("·")[0]?.trim()}
                    <br />
                    {item.status}
                  </span>
                </div>
                <MessageOwner
                  itemId={item.id}
                  itemName={item.name}
                  priceLabel={formatAskPrice(item.ask)}
                  ownerHandle={owner.handle}
                  ownerName={owner.name}
                >
                  <Feature name="makeOffer">
                    <button
                      type="button"
                      className="h-12 min-w-[140px] flex-1 rounded-[10px] border-0 bg-accent text-[15px] font-semibold text-white"
                    >
                      Make an offer
                    </button>
                  </Feature>
                  <Link
                    href="/ask"
                    className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] bg-ink px-4 text-[15px] font-semibold text-white no-underline hover:text-white"
                  >
                    Ask about this
                  </Link>
                  <Feature name="watchItem">
                    <button
                      type="button"
                      onClick={() => setWatching((w) => !w)}
                      className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-4 font-semibold"
                    >
                      {watching ? "Watching" : "Watch"}
                    </button>
                  </Feature>
                </MessageOwner>
              </>
            )}
          </section>

          {showRichDetail ? (
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="section-title mb-4 mt-0 text-[20px]">Provenance</h2>
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {itemDetail.history.map((h) => (
                  <li key={h.y} className="flex gap-3 border-b border-line-soft pb-3">
                    <span className="w-20 shrink-0 font-mono text-[13px] text-muted">{h.y}</span>
                    <span className="text-[14px]">{h.t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[14px] leading-normal text-muted-2">
                Owner notes: Full overhaul in 2024. Original paint with two careful touch-ups on the
                chainstay. Tubulars are period-correct but not original to the bike.
              </p>
            </section>
          ) : (
            <>
              {itemMeta.provenance ? (
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="section-title mb-4 mt-0 text-[20px]">Where it came from</h2>
                  <p className="mb-0 mt-0 whitespace-pre-wrap text-[14px] leading-normal text-ink">
                    {itemMeta.provenance}
                  </p>
                </section>
              ) : null}
              {isOwner && itemMeta.notes ? (
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="section-title mb-2 mt-0 text-[20px]">Private notes</h2>
                  <p className="m-0 mb-3 text-[12px] text-meta">Only visible to you</p>
                  <p className="mb-0 mt-0 whitespace-pre-wrap text-[14px] leading-normal text-ink">
                    {itemMeta.notes}
                  </p>
                </section>
              ) : null}
            </>
          )}
        </aside>

        <ItemSpecsCard
          specs={specs}
          bikeComponents={item.bikeComponents}
          showComponentsTab={
            item.catShort === "Complete bikes" || item.catShort === "Framesets"
          }
        />
      </div>

      {showRichDetail ? (
        <>
          <Feature name="sameModelElsewhere">
            <section>
              <h2 className="section-title mb-4 mt-0 text-[28px]">Same model in other garages</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                {sameModels.map((o) =>
                  o ? (
                    <Link
                      key={o.id}
                      href={`/i/${o.id}`}
                      className="rounded-[14px] border border-line bg-surface p-4 text-ink no-underline hover:text-ink"
                    >
                      <PlaceholderPhoto className="mb-3 h-28 rounded-lg" />
                      <div className="font-semibold">{o.name}</div>
                      <div className="mt-1 text-[13px] text-muted">{o.owner}</div>
                      <div
                        className="mt-2 text-[13px] font-semibold"
                        style={{ color: o.color }}
                      >
                        {o.status}
                      </div>
                    </Link>
                  ) : null,
                )}
              </div>
            </section>
          </Feature>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            <Feature name="resourceHub">
              <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="section-title mb-3 mt-0 text-[20px]">Resource hub</h2>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {itemDetail.guides.map((g) => (
                    <li key={g.t} className="border-b border-line-soft pb-2.5">
                      <span className="mr-2 font-mono text-[11px] text-muted">{g.kind}</span>
                      <span className="text-[14px] font-semibold">{g.t}</span>
                      <div className="text-[12px] text-muted">{g.by}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </Feature>
            <Feature name="compatibleParts">
              <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="section-title mb-3 mt-0 text-[20px]">Compatible parts nearby</h2>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {compatibleParts.map((p) => (
                    <li
                      key={p.n}
                      className="flex justify-between gap-2 border-b border-line-soft pb-2.5 text-[14px]"
                    >
                      <span>
                        <span className="block font-semibold">{p.n}</span>
                        <span className="text-[12px] text-muted">{p.w}</span>
                      </span>
                      <span className="font-mono font-medium">{p.p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Feature>
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="section-title mb-3 mt-0 text-[20px]">People who know this</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {itemDetail.experts.map((e) => (
                  <li key={e.handle}>
                    <Link
                      href={`/u/${e.handle}`}
                      className="flex items-center gap-3 text-ink no-underline hover:text-accent-hover"
                    >
                      <Avatar init={e.i} bg={e.bg} size={40} />
                      <span>
                        <span className="block font-semibold">{e.n}</span>
                        <span className="block text-[13px] text-muted">{e.why}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
