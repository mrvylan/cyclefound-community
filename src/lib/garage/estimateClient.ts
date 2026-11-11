"use client";

import type { ItemEstimate } from "@/lib/garage/estimates";

export type EstimateActionResult = {
  estimate: ItemEstimate | null;
  itemId: string;
};

async function postEstimate(
  itemId: string,
  body: Record<string, unknown>,
): Promise<EstimateActionResult> {
  const res = await fetch(`/api/garage-items/${encodeURIComponent(itemId)}/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    estimate?: ItemEstimate | null;
    itemId?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not update estimate.");
  }
  return {
    estimate: data.estimate ?? null,
    itemId: data.itemId || itemId,
  };
}

/** Opt-in AI/comps estimate — never runs from identify. */
export function requestGarageItemEstimate(itemId: string) {
  return postEstimate(itemId, { action: "generate" });
}

export function saveOwnerEstimateRange(
  itemId: string,
  range: { lowUsd: number; highUsd: number },
) {
  return postEstimate(itemId, { action: "owner_range", ...range });
}

export function clearGarageItemEstimate(itemId: string) {
  return postEstimate(itemId, { action: "clear" });
}
