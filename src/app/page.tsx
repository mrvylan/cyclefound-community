import { HomeAskBox } from "@/components/HomeAskBox";
import { HomeFeed } from "@/components/HomeFeed";
import { HomeGarageSpotlight } from "@/components/HomeGarageSpotlight";
import {
  HomeBrowseExpertise,
  HomeExpertsOnline,
  HomeTopContributors,
  HomeWantedBoard,
} from "@/components/HomeMockPanels";
import { Feature } from "@/components/Feature";

export default function HomePage() {
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
              have done the job before. Every answer is tied to a person and the bikes they own.
            </p>
            <HomeAskBox />
          </div>

          <Feature name="expertsOnline">
            <HomeExpertsOnline />
          </Feature>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-8 pb-2 pt-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {[
            {
              n: "01",
              t: "Build your garage",
              d: "Document the bikes and parts you own — specs, history, and whether you'd ever let them go.",
            },
            {
              n: "02",
              t: "Ask & answer",
              d: "Repairs, rare parts, builds. Questions reach the members whose garages and track record match.",
            },
            {
              n: "03",
              t: "Grow the community",
              d: "Helpful answers and well-documented garages bring the next member in.",
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
          <Feature name="topContributors">
            <HomeTopContributors />
          </Feature>

          <Feature name="homeWantedBoard">
            <HomeWantedBoard />
          </Feature>

          <HomeBrowseExpertise />
        </aside>
      </section>

      <HomeGarageSpotlight />
    </>
  );
}
