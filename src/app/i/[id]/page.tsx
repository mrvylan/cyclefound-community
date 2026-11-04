"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Avatar,
  LevelBadge,
  PlaceholderPhoto,
  StatusChip,
} from "@/components/ui";
import { getItem, getPerson, itemDetail } from "@/lib/data/seed";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = getItem(id);
  const owner = getPerson("lugged_marco");
  const [photo, setPhoto] = useState(0);
  const [range, setRange] = useState<"1Y" | "5Y" | "All">("5Y");
  const [watching, setWatching] = useState(false);

  if (!item || !owner) {
    notFound();
  }

  const trend = itemDetail.trendBars[range];
  const labels = itemDetail.photoLabels;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-8 py-6 pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-muted">
        <Link href="/u/lugged_marco/garage">Garages</Link>
        <span aria-hidden>/</span>
        <Link href="/u/lugged_marco">Marco Reyes</Link>
        <span aria-hidden>/</span>
        <Link href="/u/lugged_marco/garage">Lugged & Loved</Link>
        <span aria-hidden>/</span>
        <span>{item.name.split(",")[0]}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-2.5">
          <PlaceholderPhoto
            label={`Photo ${photo + 1} of 8 · ${labels[photo]}`}
            className="h-[520px] rounded-[18px]"
          />
          <div className="grid grid-cols-6 gap-2.5">
            {labels.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-label={`Show ${label}`}
                onClick={() => setPhoto(i)}
                className={`ph h-[72px] rounded-[10px] p-0 ${
                  photo === i ? "border-[3px] border-accent" : "border border-line"
                }`}
              />
            ))}
          </div>
        </div>

        <aside className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            <span className="font-mono text-[12px] text-muted">
              {item.cat} · ITEM 07 OF 34
            </span>
          </div>
          <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">
            {item.year} {item.name.split(",")[0]}
          </h1>
          <p className="m-0 text-[17px] text-muted-2">
            Saronni red · 56 cm c-t-c · Campagnolo Super Record · Excellent original condition
          </p>

          <Link
            href={`/u/${owner.handle}`}
            className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-3.5 text-ink no-underline hover:text-ink"
          >
            <Avatar init={owner.init} bg={owner.bg} size={46} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{owner.name}</span>
              <span className="block text-[13px] text-muted">
                ★ {owner.rating} · {owner.spokesNum.toLocaleString()} Spokes · Owned since 2011
              </span>
            </span>
            <LevelBadge level={owner.level} bright />
          </Link>

          <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-[15px] font-bold normal-case tracking-normal">
                Market value
              </h2>
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
                      range === r ? "bg-white text-ink" : "bg-transparent text-muted-2"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-[44px]">$2,400 – $3,200</span>
              <span className="text-[14px] font-semibold text-blue">{trend.t}</span>
            </div>
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
                      background: i === trend.v.length - 1 ? "#C2410C" : "#15171A",
                    }}
                  />
                  <span className="font-mono text-[10px] text-muted">{trend.l[i]}</span>
                </div>
              ))}
            </div>
            <p className="m-0 text-[12px] leading-normal text-muted">
              Median $2,780. Based on 23 comparable sales and 6 member appraisals. Values are
              estimates — verify condition and originality.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line-soft pt-3.5">
              <span>
                <span className="block text-[12px] text-muted">MARCO WOULD LET IT GO FOR</span>
                <span className="font-mono text-2xl font-medium">$3,000</span>
              </span>
              <span className="text-right text-[13px] text-muted-2">
                Local pickup, Oakland
                <br />
                Open to trades
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-12 min-w-[140px] flex-1 rounded-[10px] border-0 bg-accent text-[15px] font-semibold text-white"
              >
                Make an offer
              </button>
              <Link
                href="/q/seized-seatpost"
                className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white no-underline hover:text-white"
              >
                Ask about this bike
              </Link>
              <button
                type="button"
                onClick={() => setWatching((w) => !w)}
                className="h-12 rounded-[10px] border border-[#D4D3CD] bg-white px-4 font-semibold"
              >
                {watching ? "Watching" : "Watch"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display mb-4 mt-0 text-[22px]">Specs</h2>
          <dl className="m-0 grid grid-cols-1 gap-y-2 sm:grid-cols-2">
            {itemDetail.specs.map((s) => (
              <div key={s.k} className="flex justify-between gap-3 border-b border-line-soft py-2 text-[14px]">
                <dt className="text-muted">{s.k}</dt>
                <dd className="m-0 text-right font-medium">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

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
      </div>

      <section>
        <h2 className="font-display mb-4 mt-0 text-[28px]">Same model in other garages</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {itemDetail.others.map((o) => (
            <div
              key={o.name}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <PlaceholderPhoto className="mb-3 h-28 rounded-lg" />
              <div className="font-semibold">{o.name}</div>
              <div className="mt-1 text-[13px] text-muted">{o.owner}</div>
              <div className="mt-2 text-[13px] font-semibold" style={{ color: o.color }}>
                {o.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
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
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display mb-3 mt-0 text-[22px]">Compatible parts nearby</h2>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {itemDetail.parts.map((p) => (
              <li key={p.n} className="flex justify-between gap-2 border-b border-line-soft pb-2.5 text-[14px]">
                <span>
                  <span className="block font-semibold">{p.n}</span>
                  <span className="text-[12px] text-muted">{p.w}</span>
                </span>
                <span className="font-mono font-medium">{p.p}</span>
              </li>
            ))}
          </ul>
        </section>
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
    </div>
  );
}
