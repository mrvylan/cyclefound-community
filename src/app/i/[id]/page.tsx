"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Feature } from "@/components/Feature";
import { MessageOwner } from "@/components/messaging/MessageOwner";
import {
  Avatar,
  LevelBadge,
  PlaceholderPhoto,
  StatusChip,
} from "@/components/ui";
import { FEATURES } from "@/lib/features";
import {
  getItemLocal,
  getMergedPerson,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  getGarage,
  itemDetail,
  resolveCompatibleParts,
  resolveSameModelCards,
} from "@/lib/data/seed";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [range, setRange] = useState<"1Y" | "5Y" | "All">("5Y");
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    setReady(true);
    return subscribeStore(() => setTick((t) => t + 1));
  }, []);

  void tick;

  const item = getItemLocal(id);
  const owner = item ? getMergedPerson(item.ownerHandle) : undefined;
  const garage = item ? getGarage(item.ownerHandle) : undefined;

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading item…
      </div>
    );
  }

  if (!item || !owner) {
    notFound();
  }

  const itemPhotosRaw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`cf_i_photos_${id}`)
      : null;
  const itemPhotos: string[] = itemPhotosRaw ? JSON.parse(itemPhotosRaw) : [];
  const itemMetaRaw =
    typeof window !== "undefined" ? sessionStorage.getItem(`cf_i_meta_${id}`) : null;
  const itemMeta: { notes?: string; provenance?: string } = itemMetaRaw
    ? JSON.parse(itemMetaRaw)
    : {};

  const trend = itemDetail.trendBars[range];
  const labels = itemDetail.photoLabels;
  const sameModels = resolveSameModelCards();
  const compatibleParts = resolveCompatibleParts();
  const showRichDetail = item.id === "colnago-super-1984";
  const basicSpecs = [
    { k: "Category", v: item.catShort },
    { k: "Year", v: item.year },
    { k: "Condition", v: item.cond },
    { k: "Status", v: item.status },
    ...(FEATURES.marketValues ? [{ k: "Market", v: item.mkt }] : []),
    { k: "Asking", v: item.ask },
  ];
  const rawSpecs = showRichDetail ? itemDetail.specs : basicSpecs;
  const specs = FEATURES.verifiedBadges
    ? rawSpecs
    : rawSpecs.filter((s) => !/originality/i.test(s.k));

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-8 py-6 pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-muted">
        <Link href={`/u/${owner.handle}/garage`}>Garages</Link>
        <span aria-hidden>/</span>
        <Link href={`/u/${owner.handle}`}>{owner.name}</Link>
        <span aria-hidden>/</span>
        <Link href={`/u/${owner.handle}/garage`}>
          {garage?.name ?? "Garage"}
        </Link>
        <span aria-hidden>/</span>
        <span>{item.name.split(",")[0]}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <div className="flex flex-col gap-2.5">
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
            <div className="grid grid-cols-6 gap-2.5">
              {(itemPhotos.length ? itemPhotos : labels).map((labelOrSrc, i) => (
                <button
                  key={typeof labelOrSrc === "string" ? labelOrSrc.slice(0, 24) + i : i}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  onClick={() => setPhoto(i)}
                  className={`h-[72px] overflow-hidden rounded-[10px] p-0 ${
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

          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display mb-4 mt-0 text-[22px]">Specs</h2>
            <dl className="m-0 divide-y divide-line-soft">
              {specs.map((s) => (
                <div
                  key={s.k}
                  className="grid grid-cols-[minmax(7rem,9.5rem)_minmax(0,1fr)] gap-x-5 py-2.5 text-[14px]"
                >
                  <dt className="text-muted">{s.k}</dt>
                  <dd className="m-0 min-w-0 font-medium text-ink">{s.v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            <span className="font-mono text-[12px] text-muted">{item.cat}</span>
          </div>
          <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">
            {item.year} {item.name.split(",")[0]}
          </h1>
          <p className="m-0 text-[17px] text-muted-2">
            {showRichDetail
              ? "Saronni red · 56 cm c-t-c · Campagnolo Super Record · Excellent original condition"
              : `${item.cond} · ${item.catShort}`}
          </p>

          <Link
            href={`/u/${owner.handle}`}
            className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-3.5 text-ink no-underline hover:text-ink"
          >
            <Avatar init={owner.init} bg={owner.bg} size={46} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{owner.name}</span>
              <span className="block text-[13px] text-muted">
                ★ {owner.rating}
                <Feature name="spokesCurrency">
                  <> · {owner.spokesNum.toLocaleString()} Spokes</>
                </Feature>
                {" · "}Member since {owner.memberSince}
              </span>
              {owner.roleBadge ? (
                <span className="mt-1 block font-mono text-[12px] font-medium tracking-[0.04em] text-accent-hover">
                  {owner.roleBadge}
                </span>
              ) : null}
            </span>
            <Feature name="spokesLevels">
              <LevelBadge level={owner.level} bright />
            </Feature>
          </Link>

          <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5">
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
                      Median $2,780. Based on 23 comparable sales and 6 member appraisals. Values
                      are estimates — verify condition and originality.
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
                <span className="font-mono text-2xl font-medium">{item.ask}</span>
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
              priceLabel={item.ask}
              ownerHandle={owner.handle}
              ownerName={owner.name}
            >
              <Feature name="makeOffer">
                {item.status !== "Not for sale" ? (
                  <button
                    type="button"
                    className="h-12 min-w-[140px] flex-1 rounded-[10px] border-0 bg-accent text-[15px] font-semibold text-white"
                  >
                    Make an offer
                  </button>
                ) : null}
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
          </section>

          {showRichDetail ? (
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-display mb-4 mt-0 text-[22px]">Provenance</h2>
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
          ) : itemMeta.notes || itemMeta.provenance ? (
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-display mb-4 mt-0 text-[22px]">Notes & provenance</h2>
              {itemMeta.notes ? (
                <p className="mt-0 text-[14px] leading-normal text-muted-2">{itemMeta.notes}</p>
              ) : null}
              {itemMeta.provenance ? (
                <p className="mb-0 mt-3 whitespace-pre-wrap text-[14px] leading-normal text-ink">
                  {itemMeta.provenance}
                </p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>

      {showRichDetail ? (
        <>
          <Feature name="sameModelElsewhere">
            <section>
              <h2 className="font-display mb-4 mt-0 text-[28px]">Same model in other garages</h2>
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
                <h2 className="font-display mb-3 mt-0 text-[22px]">Resource hub</h2>
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
                <h2 className="font-display mb-3 mt-0 text-[22px]">Compatible parts nearby</h2>
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
              <h2 className="font-display mb-3 mt-0 text-[22px]">People who know this</h2>
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
