"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, PlaceholderPhoto } from "@/components/ui";
import {
  getDirectoryHandleForUserId,
  getDirectoryUserId,
} from "@/lib/community/directory-cache";
import { normalizeItemCategory } from "@/lib/data/categories";
import {
  getGarageItemsFor,
  getItemPhotoUrls,
  getSessionHandle,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import { cityFromLoc, getGarage, type GarageItem } from "@/lib/data/seed";

function garageStatLine(items: GarageItem[], forSale: number) {
  const bikeish = items.filter((i) => {
    const cat = normalizeItemCategory(i.cat);
    return cat === "Complete bikes" || cat === "Framesets";
  }).length;
  const useBikes = items.length > 0 && bikeish >= Math.ceil(items.length / 2);
  const noun = useBikes
    ? items.length === 1
      ? "bike"
      : "bikes"
    : items.length === 1
      ? "item"
      : "items";
  const base = `${items.length} ${noun}`;
  return forSale ? `${base} · ${forSale} for sale` : base;
}

function GarageCover({
  photos,
  label,
}: {
  photos: string[];
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const src = photos[index];
  if (!src) {
    return <PlaceholderPhoto silhouette label={label} className="h-[160px]" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      className="h-[160px] w-full object-cover"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

export default function GaragesIndexPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<
    {
      person: ReturnType<typeof listMembers>[number];
      garage: ReturnType<typeof getGarage>;
      items: GarageItem[];
      forSale: number;
      photos: string[];
      isYou: boolean;
    }[]
  >([]);
  const [me, setMe] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const handle = getSessionHandle();
      const myDirHandle = profile
        ? getDirectoryHandleForUserId(profile.id) || ""
        : "";
      const myUserId = profile?.id || (handle ? getDirectoryUserId(handle) : "");
      setMe(myDirHandle || handle);

      const next = listMembers()
        .map((person) => {
          const garage = getGarage(person.handle);
          let items = getGarageItemsFor(person.handle);
          // If this is the signed-in member, also fold in local items still
          // keyed under a stale session handle until migrate finishes.
          if (
            handle &&
            handle !== person.handle &&
            (person.handle === myDirHandle ||
              (myUserId && getDirectoryUserId(person.handle) === myUserId))
          ) {
            const extras = getGarageItemsFor(handle);
            if (extras.length) {
              const seen = new Set(items.map((i) => i.id));
              items = [...items, ...extras.filter((i) => !seen.has(i.id))];
            }
          }
          const photos = items.flatMap((i) => getItemPhotoUrls(i));
          const isYou = Boolean(
            (handle && person.handle === handle) ||
              (myDirHandle && person.handle === myDirHandle) ||
              (myUserId && getDirectoryUserId(person.handle) === myUserId),
          );
          return {
            person,
            garage,
            items,
            forSale: items.filter((i) => i.status !== "Not for sale").length,
            photos,
            isYou,
          };
        })
        .filter((row) => row.items.length > 0 || row.isYou)
        .sort((a, b) => {
          if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
          return b.items.length - a.items.length;
        });
      setRows(next);
      setReady(true);
    };
    sync();
    return subscribeStore(sync);
  }, [profile]);

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-10 pb-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="section-title m-0 text-[clamp(36px,5vw,56px)]">Garages</h1>
          <p className="mt-2 max-w-[540px] text-[16px] leading-relaxed text-muted-2">
            Browse member garages — bikes, frames, and parts documented in Cycle Found.
          </p>
        </div>
        {me ? (
          <Link
            href={`/u/${me}/garage`}
            className="mt-1 inline-flex h-11 shrink-0 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink no-underline hover:bg-ground"
          >
            Your garage
          </Link>
        ) : (
          <Link
            href="/auth?mode=join&next=/garages"
            className="mt-1 inline-flex h-11 shrink-0 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white"
          >
            Join to add yours
          </Link>
        )}
      </div>

      {!ready ? (
        <p className="text-[15px] text-muted">Loading garages…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-8 text-center">
          <p className="m-0 text-[16px] font-semibold text-ink">No garages to show yet</p>
          <p className="mt-2 text-[14px] text-muted-2">
            Sign in and add your first item to start a garage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {rows.map(({ person, garage, items, forSale, photos, isYou }) => (
            <Link
              key={person.handle}
              href={`/u/${person.handle}/garage`}
              className="relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-ink no-underline hover:border-[#D4D3CD]"
            >
              {isYou ? (
                <span className="absolute top-3 left-3 z-[1] rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-white uppercase">
                  You
                </span>
              ) : null}
              <GarageCover photos={photos} label={garage?.name || "Garage"} />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    init={person.init}
                    bg={person.bg}
                    size={36}
                    src={person.avatarUrl}
                    label={person.name}
                  />
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[15px] font-semibold">
                      {garage?.name || `${person.name.split(" ")[0]}'s garage`}
                    </p>
                    <p className="m-0 truncate text-[13px] text-meta">
                      {person.name} · {cityFromLoc(person.loc)}
                    </p>
                  </div>
                </div>
                <p className="m-0 font-mono text-[12px] text-muted">
                  {garageStatLine(items, forSale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
