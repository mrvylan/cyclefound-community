"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, PlaceholderPhoto } from "@/components/ui";
import {
  getDirectoryHandleForUserId,
  getDirectoryUserId,
  hydrateCommunityDirectory,
  isCommunityDirectoryReady,
} from "@/lib/community/directory-cache";
import { accountIdentityKey } from "@/lib/community/handles";
import {
  getGarageCoverItemId,
  getGarageItemsFor,
  getSessionHandle,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import { garageCoverPhotoUrls } from "@/lib/garage/garageCover";
import { isBikeItem } from "@/lib/garage/item-types";
import { cityFromLoc, getGarage, type GarageItem, type Person } from "@/lib/data/seed";

function countLabel(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Accurate garage card footer — never call a part a bike. */
function garageStatLine(items: GarageItem[]) {
  const active = items.filter((i) => !i.archived);
  const bikes = active.filter(isBikeItem).length;
  const other = active.length - bikes;
  const forSale = active.filter((i) => i.status !== "Not for sale").length;

  const parts: string[] = [];
  if (bikes) parts.push(countLabel(bikes, "bike", "bikes"));
  if (other) parts.push(countLabel(other, "part", "parts"));
  if (!parts.length) parts.push("0 items");
  if (forSale) parts.push(`${forSale} for sale`);
  return parts.join(" · ");
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

type GarageRow = {
  key: string;
  person: Person;
  garage: ReturnType<typeof getGarage>;
  items: GarageItem[];
  photos: string[];
  isYou: boolean;
};

function mergeItems(...lists: GarageItem[][]) {
  const out: GarageItem[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export default function GaragesIndexPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<GarageRow[]>([]);
  const [me, setMe] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      // Avoid empty → populated flash before the directory finishes loading.
      if (!isCommunityDirectoryReady()) {
        setReady(false);
        return;
      }
      const sessionHandle = getSessionHandle();
      const myDirHandle = profile
        ? getDirectoryHandleForUserId(profile.id) || ""
        : "";
      const myUserId = profile?.id || "";
      const canonicalMe = myDirHandle || sessionHandle;
      if (cancelled) return;
      setMe(canonicalMe);

      const myKey = myUserId
        ? accountIdentityKey(canonicalMe || "me", myUserId)
        : canonicalMe
          ? accountIdentityKey(canonicalMe)
          : "";

      const byKey = new Map<string, GarageRow>();

      for (const person of listMembers({ authUserId: myUserId || undefined })) {
        const userId = getDirectoryUserId(person.handle);
        const key = accountIdentityKey(person.handle, userId || undefined);
        const existing = byKey.get(key);
        const items = mergeItems(
          existing?.items || [],
          getGarageItemsFor(person.handle),
        );
        const isYou =
          Boolean(myKey && key === myKey) ||
          Boolean(canonicalMe && person.handle === canonicalMe) ||
          Boolean(sessionHandle && person.handle === sessionHandle);
        // Prefer the directory-backed person when merging a session stub.
        const preferredPerson = userId || !existing ? person : existing.person;

        byKey.set(key, {
          key,
          person: preferredPerson,
          garage:
            getGarage(preferredPerson.handle) ||
            getGarage(person.handle) ||
            existing?.garage,
          items,
          photos: garageCoverPhotoUrls(
            items,
            getGarageCoverItemId(preferredPerson.handle) ||
              getGarageCoverItemId(person.handle) ||
              preferredPerson.garageCoverItemId,
          ),
          isYou: Boolean(existing?.isYou || isYou),
        });
      }

      // Fold leftover local items still keyed under a stale session slug.
      if (sessionHandle && myKey) {
        const extras = getGarageItemsFor(sessionHandle);
        if (extras.length) {
          const row = byKey.get(myKey);
          if (row) {
            const items = mergeItems(row.items, extras);
            byKey.set(myKey, {
              ...row,
              items,
              photos: garageCoverPhotoUrls(
                items,
                getGarageCoverItemId(row.person.handle) ||
                  getGarageCoverItemId(sessionHandle) ||
                  row.person.garageCoverItemId,
              ),
              isYou: true,
            });
          }
        }
      }
      if (canonicalMe && canonicalMe !== sessionHandle && myKey) {
        const extras = getGarageItemsFor(canonicalMe);
        const row = byKey.get(myKey);
        if (row && extras.length) {
          const items = mergeItems(row.items, extras);
          byKey.set(myKey, {
            ...row,
            items,
            photos: garageCoverPhotoUrls(
              items,
              getGarageCoverItemId(row.person.handle) ||
                getGarageCoverItemId(canonicalMe) ||
                row.person.garageCoverItemId,
            ),
            isYou: true,
          });
        }
      }

      // Only list garages that still have at least one item. An empty garage
      // (including your own after deleting the last bike) leaves this index.
      const next = [...byKey.values()]
        .filter((row) => row.items.filter((i) => !i.archived).length > 0)
        .sort((a, b) => {
          if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
          const aActive = a.items.filter((i) => !i.archived).length;
          const bActive = b.items.filter((i) => !i.archived).length;
          return bActive - aActive;
        });
      if (cancelled) return;
      setRows(next);
      setReady(true);
    };

    void (async () => {
      if (!isCommunityDirectoryReady()) {
        await hydrateCommunityDirectory();
      }
      if (!cancelled) sync();
    })();

    const unsub = subscribeStore(() => {
      if (!cancelled) sync();
    });

    return () => {
      cancelled = true;
      unsub();
    };
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
          {rows.map(({ key, person, garage, items, photos, isYou }) => (
            <Link
              key={key}
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
                  {garageStatLine(items)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
