"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Feature } from "@/components/Feature";
import { Avatar, PlaceholderPhoto } from "@/components/ui";
import { featuredGarages } from "@/lib/data/seed";
import {
  getSessionHandle,
  isMockDataEnabled,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";

export function HomeGarageSpotlight() {
  const [mock, setMock] = useState(false);
  const [me, setMe] = useState("");
  const [garageHref, setGarageHref] = useState("/members");

  useEffect(() => {
    function sync() {
      setMock(isMockDataEnabled());
      const handle = getSessionHandle();
      setMe(handle);
      const members = listMembers();
      if (handle) setGarageHref(`/u/${handle}/garage`);
      else if (members[0]) setGarageHref(`/u/${members[0].handle}/garage`);
      else setGarageHref("/members");
    }
    sync();
    return subscribeStore(sync);
  }, []);

  if (!mock) {
    return (
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1280px] px-8 py-14">
          <p className="mb-2 mt-0 font-mono text-[13px] tracking-[0.12em] text-accent-bright">
            GARAGE SPOTLIGHT
          </p>
          <h2 className="font-display m-0 text-[44px]">Walk through someone&apos;s garage</h2>
          <p className="mt-3 max-w-[520px] text-[15px] text-on-dark-muted">
            Document your bikes and parts, or insert mock data from the header to explore sample
            garages.
          </p>
          <Link
            href={garageHref}
            className="mt-5 inline-flex font-semibold text-accent-bright no-underline hover:text-white"
          >
            {me ? "Open your garage →" : "Browse members →"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-[1280px] px-8 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 mt-0 font-mono text-[13px] tracking-[0.12em] text-accent-bright">
              GARAGE SPOTLIGHT
            </p>
            <h2 className="font-display m-0 text-[44px]">Walk through someone&apos;s garage</h2>
          </div>
          <Link
            href={garageHref}
            className="font-semibold text-accent-bright no-underline hover:text-white"
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
                  <Feature name="marketValues">
                    <span>
                      <span className="block font-mono text-[17px]">{g.value}</span>
                      <span className="text-[12px] text-on-dark-muted">est. value</span>
                    </span>
                  </Feature>
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
  );
}
