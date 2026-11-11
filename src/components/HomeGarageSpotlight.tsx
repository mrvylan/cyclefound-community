"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Feature } from "@/components/Feature";
import { Avatar } from "@/components/ui";
import { cityFromLoc, featuredGarages, getGarage } from "@/lib/data/seed";
import {
  getGarageCoverItemId,
  getGarageItemsFor,
  isMockDataEnabled,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import { garageCoverPhotoUrls } from "@/lib/garage/garageCover";

type Spotlight = {
  handle: string;
  name: string;
  owner: string;
  init: string;
  bg: string;
  avatarUrl?: string;
  cover: string;
  photoCount: number;
  items: number;
  forSale: number;
  value?: string;
};

/** Mock-on only: garages that actually have item photos. */
function loadSpotlights(): Spotlight[] {
  const out: Spotlight[] = [];
  for (const m of listMembers()) {
    const items = getGarageItemsFor(m.handle);
    const photos = garageCoverPhotoUrls(
      items,
      getGarageCoverItemId(m.handle) || m.garageCoverItemId,
    );
    if (!photos.length) continue;
    out.push({
      handle: m.handle,
      name: getGarage(m.handle)?.name ?? `${m.name.split(" ")[0]}’s garage`,
      owner: `${m.name}${m.loc ? ` · ${cityFromLoc(m.loc)}` : ""}`,
      init: m.init,
      bg: m.bg,
      avatarUrl: m.avatarUrl,
      cover: photos[0]!,
      photoCount: photos.length,
      items: items.length,
      forSale: items.filter((i) => i.status !== "Not for sale").length,
      value: featuredGarages.find((g) => g.handle === m.handle)?.value,
    });
  }
  return out.sort((a, b) => b.photoCount - a.photoCount).slice(0, 3);
}

export function HomeGarageSpotlight() {
  const [mock, setMock] = useState(false);
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);

  useEffect(() => {
    function sync() {
      const on = isMockDataEnabled();
      setMock(on);
      setSpotlights(on ? loadSpotlights() : []);
    }
    sync();
    return subscribeStore(sync);
  }, []);

  // Hide the whole band until there is real spotlight content — no empty homepage state.
  if (!mock || spotlights.length === 0) return null;

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-[1280px] px-8 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 mt-0 font-mono text-[13px] tracking-[0.12em] text-accent-bright">
              GARAGE SPOTLIGHT
            </p>
            <h2 className="section-title m-0 text-[32px] text-white">
              Walk through someone&apos;s garage
            </h2>
          </div>
          <Link
            href="/garages"
            className="inline-flex min-h-11 items-center font-semibold text-accent-bright no-underline hover:text-white"
          >
            All garages →
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {spotlights.map((g) => (
            <Link
              key={g.handle}
              href={`/u/${g.handle}/garage`}
              className="flex flex-col overflow-hidden rounded-2xl bg-ink-2 text-white no-underline hover:text-white"
            >
              <div className="relative h-[190px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.cover} alt="" className="size-full object-cover" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-ink/80 px-2 py-1 font-mono text-[12px] text-white">
                  <Camera className="size-3.5" aria-hidden />
                  {g.photoCount} photo{g.photoCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-[18px]">
                <div className="flex items-center gap-2.5">
                  <Avatar init={g.init} bg={g.bg} size={36} src={g.avatarUrl} />
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
                      <span className="block font-mono text-[17px]">{g.value ?? "—"}</span>
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
