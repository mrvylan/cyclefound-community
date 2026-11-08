"use client";

import { useEffect, useState } from "react";
import { HomeAskBox } from "@/components/HomeAskBox";
import { HomeExpertsOnline } from "@/components/HomeMockPanels";
import { Feature } from "@/components/Feature";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getSessionHandle,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { abbreviatedDisplayName } from "@/lib/auth/user";

export function HomeHero() {
  const { ready: authReady, profile, user } = useAuth();
  const [storeReady, setStoreReady] = useState(false);
  const [handle, setHandle] = useState("");

  useEffect(() => {
    function sync() {
      setHandle(getSessionHandle());
      setStoreReady(true);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  const ready = authReady && storeReady;
  /** Real auth only — a leftover local session must not show the member hero. */
  const signedIn = Boolean(user && profile);
  const memberHome = ready && signedIn;

  if (!ready) {
    return (
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1280px] px-8 py-10">
          <div className="h-40 animate-pulse rounded-[14px] bg-ground" aria-hidden />
        </div>
      </section>
    );
  }

  if (memberHome && profile) {
    const authHandle = handleFromAuthProfile(profile);
    const person = resolvePerson(handle || authHandle);
    const displayName =
      person?.name ||
      profile.displayName ||
      profile.fullName ||
      authHandle;
    const firstName =
      abbreviatedDisplayName(displayName).split(" ")[0] || "there";
    return (
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-8 pb-7">
          <div>
            <p className="m-0 text-[16px] font-medium text-muted-2">Hi {firstName}</p>
            <h1 className="section-title m-0 mt-1 text-[clamp(28px,4vw,40px)]">
              What&apos;s rolling around in your head?
            </h1>
            <p className="m-0 mt-2 max-w-[560px] text-[16px] leading-[1.55] text-muted-2">
              Questions go to members whose garages and expertise match.
            </p>
          </div>
          <HomeAskBox compact />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-stretch gap-12 px-8 py-16 pb-14">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
            <p className="eyebrow m-0">Builders · Mechanics · Restorers · Collectors</p>
            <h1 className="hero-display m-0 max-w-[16ch] text-[clamp(40px,8vw,72px)]">
              Ask people who&apos;ve
              <br />
              <span className="text-accent">done the job.</span>
            </h1>
            <p className="m-0 max-w-[620px] text-[19px] leading-[1.55] text-muted-2">
              Browse real garages, track down rare parts, and get repair help from members who
              have been there. Every answer is tied to a person and the bikes they own.
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
                <p className="m-0 text-[15px] leading-normal text-meta">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
