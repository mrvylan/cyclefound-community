import type { GarageItem } from "@/lib/data/seed";
import { getItemPhotoUrls } from "@/lib/data/local-store";
import { isBikeItem } from "@/lib/garage/item-types";

export type GarageCoverCandidate = {
  item: GarageItem;
  photoUrl: string;
  isBike: boolean;
};

/** Active (non-archived) garage items that have at least one photo. */
export function garageCoverCandidates(items: GarageItem[]): GarageCoverCandidate[] {
  const out: GarageCoverCandidate[] = [];
  for (const item of items) {
    if (item.archived) continue;
    const photos = getItemPhotoUrls(item);
    const photoUrl = photos[0];
    if (!photoUrl) continue;
    out.push({ item, photoUrl, isBike: isBikeItem(item) });
  }
  // Bikes first, then other items — stable within each group by existing order.
  return out.sort((a, b) => Number(b.isBike) - Number(a.isBike));
}

/**
 * Resolve which item's photo should feature as the garage cover.
 * Prefer an explicit owner choice when that item still has a photo;
 * otherwise default to the first bike with a photo, then any item.
 */
export function resolveGarageCoverItem(
  items: GarageItem[],
  coverItemId?: string | null,
): GarageItem | undefined {
  const candidates = garageCoverCandidates(items);
  if (!candidates.length) return undefined;

  const preferredId = String(coverItemId || "").trim();
  if (preferredId) {
    const preferred = candidates.find((c) => c.item.id === preferredId);
    if (preferred) return preferred.item;
  }

  const bike = candidates.find((c) => c.isBike);
  return (bike || candidates[0])!.item;
}

/** Ordered photo URLs for directory / spotlight covers (chosen item first, then fallbacks). */
export function garageCoverPhotoUrls(
  items: GarageItem[],
  coverItemId?: string | null,
): string[] {
  const cover = resolveGarageCoverItem(items, coverItemId);
  if (!cover) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  function pushAll(item: GarageItem) {
    for (const url of getItemPhotoUrls(item)) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }

  pushAll(cover);
  for (const candidate of garageCoverCandidates(items)) {
    if (candidate.item.id === cover.id) continue;
    pushAll(candidate.item);
  }
  return out;
}
