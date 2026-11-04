import Link from "next/link";
import { Star } from "lucide-react";
import { HomeAskBox } from "@/components/HomeAskBox";
import { HomeFeed } from "@/components/HomeFeed";
import { Avatar, PlaceholderPhoto } from "@/components/ui";
import {
  areas,
  featuredGarages,
  leaders,
  people,
  wanted,
} from "@/lib/data/seed";

export default function HomePage() {
  const online = people.slice(0, 4);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-stretch gap-12 px-8 py-16 pb-14">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
            <p className="eyebrow m-0">Builders · Mechanics · Restorers · Collectors</p>
            <h1 className="font-display m-0 text-[clamp(40px,8vw,76px)]">
              Ask the people who actually know bikes.
            </h1>
            <p className="m-0 max-w-[620px] text-[19px] leading-[1.55] text-muted-2">
              Browse real garages, track down rare parts, and get repair help from members who
              have done the job before. Every answer is tied to a person, their reputation, and
              the bikes they own.
            </p>
            <HomeAskBox />
          </div>

          <aside
            aria-label="Experts online now"
            className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl bg-ink p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display m-0 text-[22px] font-bold tracking-[0.02em]">
                In the shop now
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-on-dark-muted">
                <span className="size-2 rounded-full bg-[#4ADE80]" aria-hidden />
                Online
              </span>
            </div>
            {online.map((p) => (
              <Link
                key={p.handle}
                href={`/u/${p.handle}`}
                className="flex items-center gap-3 rounded-xl bg-ink-2 p-3 text-white no-underline hover:text-white"
              >
                <Avatar init={p.init} bg={p.bg} size={44} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{p.name}</span>
                  <span className="text-[13px] text-on-dark-muted">{p.role}</span>
                </span>
                <span className="flex flex-col items-end gap-0.5 text-[13px]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-accent-bright text-accent-bright" aria-hidden />
                    {p.rating}
                  </span>
                  <span className="font-mono text-on-dark-muted">{p.spokes} sp</span>
                </span>
              </Link>
            ))}
            <Link
              href="/experts"
              className="text-[14px] font-semibold text-[#FDBA74] no-underline hover:text-accent-bright"
            >
              Browse all experts →
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-8 pb-2 pt-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {[
            {
              n: "01",
              t: "Build your garage",
              d: "Document the bikes and parts you own — specs, history, market value, and whether you'd ever let them go.",
            },
            {
              n: "02",
              t: "Ask & answer",
              d: "Repairs, rare parts, builds, valuations. Questions reach the members whose garages and track record match.",
            },
            {
              n: "03",
              t: "Earn Spokes",
              d: "Helpful answers, accepted fixes and well-documented garages earn Spokes — your visible reputation in the community.",
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-4">
              <span className="font-display text-[44px] leading-none text-accent">{step.n}</span>
              <div>
                <h3 className="mb-1.5 mt-0 text-[17px] font-semibold normal-case tracking-normal">
                  {step.t}
                </h3>
                <p className="m-0 text-[15px] leading-normal text-muted">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-8 px-8 py-10">
        <HomeFeed />

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <div className="mb-3.5 flex items-baseline justify-between">
              <h2 className="font-display m-0 text-[22px]">Top contributors</h2>
              <span className="text-[13px] text-muted">This month</span>
            </div>
            <ol className="m-0 flex list-none flex-col gap-1 p-0">
              {leaders.map((l) => (
                <li key={l.handle}>
                  <Link
                    href={`/u/${l.handle}`}
                    className="flex items-center gap-3 py-2 text-ink no-underline hover:text-accent-hover"
                  >
                    <span className="w-[18px] font-mono text-[13px] text-muted">{l.rank}</span>
                    <Avatar init={l.init} bg={l.bg} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold">{l.name}</span>
                      <span className="block text-[12px] text-muted">{l.role}</span>
                    </span>
                    <span className="font-mono text-[13px] font-medium text-accent-hover">
                      +{l.gain}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[14px] border border-accent-soft-border bg-accent-soft p-5">
            <h2 className="font-display mb-1 mt-0 text-[22px]">Wanted board</h2>
            <p className="mb-3.5 mt-0 text-[13px] text-[#7C2D12]">
              Members hunting for specific parts. Matches in garages are flagged automatically.
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {wanted.map((w) => (
                <li
                  key={w.part}
                  className="flex flex-col gap-1.5 rounded-[10px] border border-accent-soft-border bg-white px-3.5 py-3"
                >
                  <Link
                    href="/q/super-record-cage"
                    className="text-[14px] font-semibold leading-snug text-ink no-underline hover:text-accent-hover"
                  >
                    {w.part}
                  </Link>
                  <span className="flex justify-between text-[12px] text-muted">
                    <span>{w.who}</span>
                    <span className="font-semibold text-accent-hover">{w.matches}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="font-display mb-3.5 mt-0 text-[22px]">Browse by expertise</h2>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Link
                  key={a.label}
                  href="/experts"
                  className="rounded-full border border-[#D4D3CD] px-3 py-1.5 text-[13px] text-ink no-underline hover:border-ink hover:text-ink"
                >
                  {a.label}{" "}
                  <span className="font-mono text-muted">{a.n}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1280px] px-8 py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 mt-0 font-mono text-[13px] tracking-[0.12em] text-[#FDBA74]">
                GARAGE SPOTLIGHT
              </p>
              <h2 className="font-display m-0 text-[44px]">Walk through someone&apos;s garage</h2>
            </div>
            <Link
              href="/u/lugged_marco/garage"
              className="font-semibold text-[#FDBA74] no-underline hover:text-accent-bright"
            >
              All garages →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
            {featuredGarages.map((g) => (
              <Link
                key={g.handle}
                href={`/u/${g.handle}/garage`}
                className="flex flex-col overflow-hidden rounded-2xl bg-ink-2 text-white no-underline hover:text-white"
              >
                <PlaceholderPhoto
                  label={`Photo: ${g.photo}`}
                  className="h-[190px] brightness-[0.85]"
                />
                <div className="flex flex-col gap-3 p-[18px]">
                  <div className="flex items-center gap-2.5">
                    <Avatar init={g.init} bg={g.bg} size={36} />
                    <span>
                      <span className="block font-semibold">{g.name}</span>
                      <span className="block text-[13px] text-on-dark-muted">{g.owner}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-[#33373D] pt-3">
                    <span>
                      <span className="block font-mono text-[17px]">{g.items}</span>
                      <span className="text-[12px] text-on-dark-muted">items</span>
                    </span>
                    <span>
                      <span className="block font-mono text-[17px]">{g.value}</span>
                      <span className="text-[12px] text-on-dark-muted">est. value</span>
                    </span>
                    <span>
                      <span className="block font-mono text-[17px]">{g.forSale}</span>
                      <span className="text-[12px] text-on-dark-muted">available</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
