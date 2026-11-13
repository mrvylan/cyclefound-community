import { Suspense } from "react";
import { HomeFeed } from "@/components/HomeFeed";
import { HomeGarageSpotlight } from "@/components/HomeGarageSpotlight";
import { HomeHero } from "@/components/HomeHero";
import { HomeOnboardedBanner } from "@/components/HomeOnboardedBanner";
import { HomeFoundingSpots } from "@/components/HomeFoundingSpots";
import {
  HomeBrowseExpertise,
  HomeRecentlyListed,
  HomeTopContributors,
  HomeTopHelpers,
  HomeUnansweredForYou,
  HomeWantedBoard,
  HomeYourQuestions,
} from "@/components/HomeMockPanels";
import { Feature } from "@/components/Feature";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeOnboardedBanner />
      </Suspense>

      <HomeHero />

      <div className="mx-auto max-w-[1280px] px-8 pt-3">
        <HomeFoundingSpots />
      </div>

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-8 px-8 py-10">
        <HomeFeed />

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <HomeYourQuestions />

          <HomeUnansweredForYou />

          <Feature name="topContributors">
            <HomeTopContributors />
          </Feature>

          <HomeTopHelpers />

          <HomeRecentlyListed />

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
