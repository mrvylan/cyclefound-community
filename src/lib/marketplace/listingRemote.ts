"use client";

import type { ItemStatus } from "@/lib/data/seed";
import type { BikeComponent } from "@/lib/garage/bike-components";
import { askAmount, normalizeAskInput } from "@/lib/garage/itemFields";
import { normalizeItemCategory } from "@/lib/data/categories";

export type MarketplaceListingInput = {
  title: string;
  category: string;
  year: string;
  size?: string;
  discipline?: string;
  manufacturer?: string;
  condition: string;
  status: ItemStatus;
  askingPrice: string;
  description: string;
  notes?: string;
  provenance?: string;
  photos?: string[];
  bikeComponents?: BikeComponent[];
};

function dollarsToCents(ask: string): number | null {
  const n = askAmount(normalizeAskInput(ask) || "");
  return n == null ? null : n * 100;
}

function splitTitle(title: string, manufacturer?: string) {
  const brand = String(manufacturer || "").trim();
  const clean = String(title || "").trim();
  if (brand && clean) {
    const without = clean
      .replace(new RegExp(`^${brand}\\b[\\s\\-–—:]*`, "i"), "")
      .trim();
    return {
      manufacturer_name: brand,
      model_name: without || clean || "Item",
    };
  }
  if (brand) return { manufacturer_name: brand, model_name: clean || "Item" };
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return {
      manufacturer_name: parts[0]!,
      model_name: parts.slice(1).join(" ") || "Item",
    };
  }
  return { manufacturer_name: clean || "Unknown", model_name: clean || "Item" };
}

/** Map Community garage status → bike_listings.status. */
export function listingDbStatusFromItemStatus(status: ItemStatus): "active" | "paused" {
  if (status === "For sale" || status === "Open to offers") return "active";
  return "paused";
}

/**
 * Update an owned marketplace listing via Community API (no Classic).
 * Text/status fields only — photo changes for Market listings are not rewritten here.
 */
export async function updateRemoteMarketplaceListing(
  listingId: string,
  input: MarketplaceListingInput,
) {
  const names = splitTitle(input.title, input.manufacturer);
  const askCents = dollarsToCents(input.askingPrice);
  const listed =
    input.status === "For sale" || input.status === "Open to offers";

  const newLocalPhotos = (input.photos || []).some((p) =>
    String(p).startsWith("data:"),
  );
  if (newLocalPhotos) {
    throw new Error(
      "Photo uploads for Market listings aren’t supported in this editor yet. Keep the existing photos, or remove the listing and add it to your Community garage.",
    );
  }

  const res = await fetch(
    `/api/community/listings/${encodeURIComponent(listingId)}`,
    {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title.trim().slice(0, 120),
        description: input.description.trim(),
        condition: input.condition.trim() || "Good",
        manufacturer_name: names.manufacturer_name,
        model_name: names.model_name,
        category_name:
          input.discipline?.trim() ||
          normalizeItemCategory(input.category) ||
          null,
        approximate_year:
          input.year.trim() && input.year.trim() !== "—"
            ? input.year.trim()
            : "Unknown",
        frame_size_label: input.size?.trim() || null,
        asking_price_cents: listed ? askCents ?? 0 : 0,
        status: listingDbStatusFromItemStatus(input.status),
      }),
    },
  );

  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    listing?: { id: string; status: string };
  };
  if (!res.ok) {
    throw new Error(payload.error || "Could not save marketplace listing.");
  }
  return payload.listing;
}
