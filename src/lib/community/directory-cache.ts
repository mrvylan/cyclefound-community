"use client";

import type { GarageItem, Person } from "@/lib/data/seed";
import { roleBadgeForMember } from "@/lib/community/founding-members";
import { isHiddenMember } from "@/lib/community/hidden-members";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { initialsFromName, colorForId } from "@/lib/auth/user";

export type DirectoryMember = {
  userId: string;
  handle: string;
  person: Person;
};

export type MarketplaceGarageItem = GarageItem & {
  /** Supabase auth user id (seller). */
  sellerId: string;
  listingId: string;
  classicUrl: string;
  /** Signed marketplace photo URLs (cover first). */
  photoUrls: string[];
};

type Cache = {
  ready: boolean;
  error: string;
  members: DirectoryMember[];
  /** handle → member */
  byHandle: Map<string, DirectoryMember>;
  /** userId → member */
  byUserId: Map<string, DirectoryMember>;
  items: MarketplaceGarageItem[];
};

const cache: Cache = {
  ready: false,
  error: "",
  members: [],
  byHandle: new Map(),
  byUserId: new Map(),
  items: [],
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cf-store"));
}

function locOf(city?: string | null, state?: string | null) {
  return [city, state].map((s) => String(s || "").trim()).filter(Boolean).join(", ");
}

function personFromRow(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
}): DirectoryMember {
  const name = String(row.display_name || "").trim() || "Member";
  const handle = communityHandleFromProfile(row.id, name);
  const year = row.created_at ? String(new Date(row.created_at).getFullYear()) : "2026";
  const badge = roleBadgeForMember({ userId: row.id, handle });
  const person: Person = {
    handle,
    name,
    init: initialsFromName(name),
    bg: colorForId(row.id),
    role: badge,
    loc: locOf(row.city, row.state),
    level: "RIDER",
    rating: "New",
    reviews: 0,
    spokes: "0",
    spokesNum: 0,
    accepted: 0,
    items: 0,
    reply: "—",
    bio: "",
    skills: [],
    consult: "",
    verified: false,
    roleBadge: badge,
    memberSince: year,
    avatarUrl: row.avatar_url || undefined,
  };
  return { userId: row.id, handle, person };
}

function formatUsdFromCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  const n = Number(cents) / 100;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusFromListing(status: string): GarageItem["status"] {
  if (status === "active") return "For sale";
  return "Not for sale";
}

export function getDirectoryMembers(): DirectoryMember[] {
  return cache.members;
}

export function getDirectoryPerson(handle: string): Person | undefined {
  return cache.byHandle.get(handle)?.person;
}

export function getDirectoryUserId(handle: string): string | undefined {
  return cache.byHandle.get(handle)?.userId;
}

export function getDirectoryHandleForUserId(userId: string): string | undefined {
  return cache.byUserId.get(userId)?.handle;
}

export function getMarketplaceItemsForHandle(handle: string): MarketplaceGarageItem[] {
  const userId = cache.byHandle.get(handle)?.userId;
  if (!userId) return [];
  return cache.items.filter((i) => i.sellerId === userId);
}

export function getAllMarketplaceItems(): MarketplaceGarageItem[] {
  return cache.items;
}

export function getMarketplaceItem(id: string): MarketplaceGarageItem | undefined {
  return cache.items.find((i) => i.id === id || i.listingId === id);
}

export function isCommunityDirectoryReady() {
  return cache.ready;
}

export function communityDirectoryError() {
  return cache.error;
}

/** Load Supabase profiles + active marketplace listings into the client cache. */
export async function hydrateCommunityDirectory() {
  if (typeof window === "undefined") return;

  try {
    const dirRes = await fetch("/api/community/directory", { cache: "no-store" });
    const dirPayload = (await dirRes.json().catch(() => ({}))) as {
      members?: Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        city: string | null;
        state: string | null;
        created_at: string | null;
      }>;
      error?: string;
    };
    if (!dirRes.ok) {
      throw new Error(dirPayload.error || `Directory failed (${dirRes.status})`);
    }

    const members = (dirPayload.members || [])
      .map(personFromRow)
      .filter(
        (m) =>
          !isHiddenMember({
            name: m.person.name,
            handle: m.handle,
            userId: m.userId,
          }),
      );
    const byHandle = new Map(members.map((m) => [m.handle, m]));
    const byUserId = new Map(members.map((m) => [m.userId, m]));

    // Members first so garage/profile pages can open without waiting on photos.
    cache.members = members;
    cache.byHandle = byHandle;
    cache.byUserId = byUserId;
    cache.ready = true;
    cache.error = "";
    notify();

    const listRes = await fetch("/api/community/listings", { cache: "no-store" });
    const listPayload = (await listRes.json().catch(() => ({}))) as {
      listings?: Array<{
        id: string;
        seller_id: string;
        title: string | null;
        description: string | null;
        status: string | null;
        condition: string | null;
        asking_price_cents: number | null;
        manufacturer_name: string | null;
        model_name: string | null;
        category_name: string | null;
        approximate_year: string | null;
        frame_size_label: string | null;
        photoUrls?: string[];
      }>;
      error?: string;
    };
    if (!listRes.ok) {
      throw new Error(listPayload.error || `Listings failed (${listRes.status})`);
    }

    const items: MarketplaceGarageItem[] = [];
    for (const row of listPayload.listings || []) {
      const sellerId = String(row.seller_id || "");
      const member = byUserId.get(sellerId);
      if (!member) continue;
      const listingId = String(row.id);
      const classicUrl = `https://classic.cyclefound.com/listing.html?id=${encodeURIComponent(listingId)}`;
      const photoUrls = (row.photoUrls || []).filter(Boolean);
      const year = String(row.approximate_year || "—");
      const rawTitle =
        String(row.title || "").trim() ||
        [row.manufacturer_name, row.model_name].filter(Boolean).join(" ") ||
        "Listing";
      // Keep year in the structured field; strip it from the display name to avoid "1996 … 1996".
      const title =
        year && year !== "—"
          ? rawTitle
              .replace(new RegExp(`\\b${year}\\b`, "g"), "")
              .replace(/\s+/g, " ")
              .replace(/^[-–—:/]+|[-–—:/]+$/g, "")
              .trim() || rawTitle
          : rawTitle;
      const ask = formatUsdFromCents(
        row.asking_price_cents == null ? null : Number(row.asking_price_cents),
      );
      const catLabel = String(row.category_name || "").trim();
      const catShort = catLabel
        ? catLabel.replace(/\s+/g, " ").slice(0, 24)
        : "Complete bikes";

      items.push({
        id: listingId,
        listingId,
        sellerId,
        ownerHandle: member.handle,
        catShort,
        cat: catShort,
        year,
        size: row.frame_size_label ? String(row.frame_size_label) : undefined,
        name: title,
        cond: String(row.condition || "—"),
        mkt: ask,
        ask,
        status: statusFromListing(String(row.status || "active")),
        links: "Marketplace",
        trend: "Flat",
        photo: photoUrls[0],
        photoUrls,
        description:
          String(row.description || "").trim() ||
          `Listed on Cycle Found marketplace. ${classicUrl}`,
        classicUrl,
      });
    }

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.ownerHandle, (counts.get(item.ownerHandle) || 0) + 1);
    }
    for (const m of members) {
      m.person = { ...m.person, items: counts.get(m.handle) || 0 };
    }

    cache.members = members;
    cache.byHandle = new Map(members.map((m) => [m.handle, m]));
    cache.byUserId = new Map(members.map((m) => [m.userId, m]));
    cache.items = items;
    notify();
  } catch (err) {
    cache.ready = true;
    cache.error = err instanceof Error ? err.message : "Directory unavailable";
    notify();
  }
}
