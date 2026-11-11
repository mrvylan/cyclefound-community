/** Fair-market estimate helpers — separate from AI identify. */

export const ESTIMATE_DISCLAIMER =
  "Market estimate based on typical asking and sold ranges for similar bikes/parts — not an appraisal. Verify condition and originality.";

export type EstimateConfidence = "Low" | "Medium" | "High" | "None";

export type EstimateComp = {
  itemId?: string | null;
  title?: string;
  soldPriceCents?: number;
  adjustedCents?: number;
  condition?: string;
  soldDate?: string | null;
  itemWebUrl?: string | null;
  score?: number;
};

export type ItemEstimate = {
  midCents: number | null;
  lowCents: number | null;
  highCents: number | null;
  confidence?: EstimateConfidence | string | null;
  source?: string | null;
  sampleSize?: number | null;
  estimatedAt?: string | null;
  disclaimer?: string | null;
  /** Sold comps when source is ebay_sold_comps (from estimated_value_meta). */
  comps?: EstimateComp[] | null;
  ebayFallbackMessage?: string | null;
};

export function estimateSourceLabel(source: string | null | undefined): string {
  const raw = String(source || "").toLowerCase();
  if (raw.includes("ebay")) return "eBay sold comps";
  if (raw.includes("owner")) return "Your range";
  if (raw.includes("ai")) return "AI estimate";
  return "Estimate";
}

export function usdToCents(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function formatUsdCompactFromCents(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  const dollars = cents / 100;
  if (dollars >= 1000) {
    const k = dollars / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `$${rounded}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function formatEstimateRangeLabel(estimate: ItemEstimate | null | undefined): string {
  if (!estimate?.midCents && !estimate?.lowCents && !estimate?.highCents) {
    return "No estimate";
  }
  const low = estimate.lowCents;
  const high = estimate.highCents;
  if (low != null && high != null && low !== high) {
    return `${formatUsdCompactFromCents(low)}–${formatUsdCompactFromCents(high)}`;
  }
  return formatUsdCompactFromCents(estimate.midCents ?? low ?? high);
}

export function formatEstimateMidLabel(estimate: ItemEstimate | null | undefined): string {
  if (!estimate?.midCents) return "—";
  return formatUsdCompactFromCents(estimate.midCents);
}

export function hasEstimate(estimate: ItemEstimate | null | undefined): boolean {
  return Boolean(
    estimate &&
      (estimate.midCents != null ||
        (estimate.lowCents != null && estimate.highCents != null)),
  );
}

export function normalizeEstimateConfidence(value: unknown): EstimateConfidence {
  const raw = String(value || "").toLowerCase();
  if (!raw || raw === "none") return "None";
  if (raw.includes("high")) return "High";
  if (raw.includes("low")) return "Low";
  return "Medium";
}

export function orderEstimateCents(input: {
  lowCents: number | null;
  midCents: number | null;
  highCents: number | null;
}): { lowCents: number | null; midCents: number | null; highCents: number | null } {
  let { lowCents, midCents, highCents } = input;
  if (midCents == null && lowCents != null && highCents != null) {
    midCents = Math.round((lowCents + highCents) / 2);
  }
  if (lowCents != null && midCents != null && highCents != null) {
    const ordered = [lowCents, midCents, highCents].sort((a, b) => a - b);
    return { lowCents: ordered[0]!, midCents: ordered[1]!, highCents: ordered[2]! };
  }
  return { lowCents, midCents, highCents };
}

/** Sum mid estimates for garage total; omit items without a mid. */
export function garageEstimateTotals(items: Array<{ estimate?: ItemEstimate | null; archived?: boolean }>) {
  const active = items.filter((i) => !i.archived);
  const valued = active.filter((i) => i.estimate?.midCents != null);
  const midSum = valued.reduce((n, i) => n + (i.estimate?.midCents || 0), 0);
  const lowSum = valued.reduce((n, i) => n + (i.estimate?.lowCents ?? i.estimate?.midCents ?? 0), 0);
  const highSum = valued.reduce(
    (n, i) => n + (i.estimate?.highCents ?? i.estimate?.midCents ?? 0),
    0,
  );
  return {
    activeCount: active.length,
    valuedCount: valued.length,
    midCents: valued.length ? midSum : null,
    lowCents: valued.length ? lowSum : null,
    highCents: valued.length ? highSum : null,
  };
}

export function estimateFromDbRow(row: Record<string, unknown>): ItemEstimate | null {
  const mid =
    typeof row.estimated_value_cents === "number" ? row.estimated_value_cents : null;
  const low =
    typeof row.estimated_value_low_cents === "number"
      ? row.estimated_value_low_cents
      : null;
  const high =
    typeof row.estimated_value_high_cents === "number"
      ? row.estimated_value_high_cents
      : null;
  if (mid == null && low == null && high == null) return null;
  const meta =
    row.estimated_value_meta && typeof row.estimated_value_meta === "object"
      ? (row.estimated_value_meta as Record<string, unknown>)
      : null;
  const comps = Array.isArray(meta?.comps)
    ? (meta.comps as EstimateComp[])
    : null;

  return {
    midCents: mid,
    lowCents: low,
    highCents: high,
    confidence: normalizeEstimateConfidence(row.estimated_value_confidence),
    source: row.estimated_value_source ? String(row.estimated_value_source) : null,
    sampleSize:
      typeof row.estimated_value_sample_size === "number"
        ? row.estimated_value_sample_size
        : null,
    estimatedAt: row.estimated_value_at ? String(row.estimated_value_at) : null,
    disclaimer:
      (meta?.disclaimer ? String(meta.disclaimer) : null) || ESTIMATE_DISCLAIMER,
    comps,
    ebayFallbackMessage: meta?.ebayFallbackMessage
      ? String(meta.ebayFallbackMessage)
      : null,
  };
}
