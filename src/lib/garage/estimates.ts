/** Fair-market estimate helpers — separate from AI identify. */

export const ESTIMATE_DISCLAIMER =
  "Market estimate based on typical asking and sold ranges for similar bikes/parts — not an appraisal. Verify condition and originality.";

export const EBAY_ACTIVE_DISCLAIMER =
  "Based on current eBay listing asking prices (not sold prices) — not an appraisal.";

export type EstimateConfidence = "Low" | "Medium" | "High" | "None";

export type EstimateSample = {
  title: string;
  price: number;
  url: string;
  image?: string | null;
};

/** @deprecated Prefer EstimateSample — kept for rows saved before Browse API. */
export type EstimateComp = {
  itemId?: string | null;
  title?: string;
  soldPriceCents?: number;
  adjustedCents?: number;
  price?: number;
  condition?: string;
  soldDate?: string | null;
  itemWebUrl?: string | null;
  url?: string;
  image?: string | null;
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
  /** Active eBay listing samples (asking prices). */
  samples?: EstimateSample[] | null;
  /** Legacy comps field (still read from older meta). */
  comps?: EstimateComp[] | null;
  query?: string | null;
  ebayFallbackMessage?: string | null;
};

/** API / market payload shape for Get estimate. */
export type MarketEstimateResult = {
  source: "ebay_active" | "ai" | "owner_range";
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
  samples: EstimateSample[];
  query: string;
  fetchedAt: string;
};

export function estimateSourceLabel(source: string | null | undefined): string {
  const raw = String(source || "").toLowerCase();
  if (raw === "ebay_active" || raw.includes("ebay_active")) {
    return "eBay listings";
  }
  if (raw.includes("ebay")) return "eBay listings";
  if (raw.includes("owner")) return "Your range";
  if (raw === "ai" || raw.includes("ai")) return "AI estimate";
  return "Estimate";
}

export function usdToCents(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToUsd(cents: number | null | undefined): number | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
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

export function formatUsdCompact(dollars: number | null | undefined): string {
  if (dollars == null || !Number.isFinite(dollars)) return "—";
  return formatUsdCompactFromCents(Math.round(dollars * 100));
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

export function confidenceFromListingCount(count: number): EstimateConfidence {
  if (count >= 15) return "High";
  if (count >= 8) return "Medium";
  if (count >= 5) return "Low";
  return "None";
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

function samplesFromMeta(meta: Record<string, unknown> | null): EstimateSample[] | null {
  if (!meta) return null;
  if (Array.isArray(meta.samples)) {
    return (meta.samples as EstimateSample[]).filter(
      (s) => s && typeof s.title === "string" && typeof s.price === "number",
    );
  }
  if (Array.isArray(meta.comps)) {
    return (meta.comps as EstimateComp[])
      .map((c) => ({
        title: String(c.title || "Listing"),
        price:
          typeof c.price === "number"
            ? c.price
            : typeof c.adjustedCents === "number"
              ? c.adjustedCents / 100
              : typeof c.soldPriceCents === "number"
                ? c.soldPriceCents / 100
                : 0,
        url: String(c.url || c.itemWebUrl || ""),
        image: c.image || null,
      }))
      .filter((s) => s.price > 0);
  }
  return null;
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
  const samples = samplesFromMeta(meta);

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
    samples,
    comps: Array.isArray(meta?.comps) ? (meta.comps as EstimateComp[]) : null,
    query: meta?.query ? String(meta.query) : null,
    ebayFallbackMessage: meta?.ebayFallbackMessage
      ? String(meta.ebayFallbackMessage)
      : null,
  };
}

export function toMarketEstimateResult(estimate: ItemEstimate | null): MarketEstimateResult | null {
  if (!estimate || estimate.midCents == null) return null;
  const sourceRaw = String(estimate.source || "").toLowerCase();
  const source: MarketEstimateResult["source"] =
    sourceRaw === "ebay_active" || sourceRaw.includes("ebay")
      ? "ebay_active"
      : sourceRaw.includes("owner")
        ? "owner_range"
        : "ai";

  return {
    source,
    median: centsToUsd(estimate.midCents),
    low: centsToUsd(estimate.lowCents),
    high: centsToUsd(estimate.highCents),
    count: estimate.sampleSize || 0,
    samples: estimate.samples || [],
    query: estimate.query || "",
    fetchedAt: estimate.estimatedAt || new Date().toISOString(),
  };
}
