/**
 * Aggregate active eBay listing (asking) prices into a market range.
 * Fetching is server-side only — this module is pure math + query helpers.
 */

export const EBAY_ACTIVE_SOURCE = "ebay_active";
export const EBAY_ACTIVE_DISCLAIMER =
  "Based on current eBay listing asking prices (not sold prices) — not an appraisal.";

export type EbayActiveSample = {
  title: string;
  price: number;
  url: string;
  image: string | null;
};

export type EbayActiveResult = {
  source: "ebay_active";
  available: boolean;
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
  samples: EbayActiveSample[];
  query: string;
  fetchedAt: string;
  message: string | null;
};

export type EbayActiveQueryInput = {
  manufacturer?: string;
  model?: string;
  year?: string;
  size?: string;
  partType?: string;
  discipline?: string;
  subjectKind?: "bike" | "part" | string;
  /** When complete, drop frameset / frame-only noise. */
  bikeState?: "complete" | "frameset" | string | null;
  categoryHint?: string;
};

const COMPLETE_BIKE_DROP_PATTERNS = [
  /frame\s*only/i,
  /frameset/i,
  /\bfor\s+parts\b/i,
  /\bparts\b/i,
  /wheelset/i,
  /\bdecal\b/i,
  /\bsticker\b/i,
  /\bmanual\b/i,
];

const FRAMESET_DROP_PATTERNS = [
  /\bfor\s+parts\b/i,
  /wheelset/i,
  /\bdecal\b/i,
  /\bsticker\b/i,
  /\bmanual\b/i,
];

const PART_DROP_BIKE_PATTERNS = [
  /\bcomplete\s+bike\b/i,
  /\broad\s+bike\b/i,
  /\bmountain\s+bike\b/i,
  /\bmtb\b/i,
  /\bgravel\s+bike\b/i,
  /\bfull\s+bike\b/i,
  /\bbicycle\b/i,
];

function cleanPart(value: unknown) {
  return String(value || "")
    .replace(/[^\w\s\-./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short eBay search query — brand + model + year + one key spec. */
export function buildEbayActiveQuery(input: EbayActiveQueryInput): string {
  const parts: string[] = [];
  const brand = cleanPart(input.manufacturer);
  const model = cleanPart(input.model);
  const year = cleanPart(input.year).match(/(19|20)\d{2}/)?.[0] || "";
  const size = cleanPart(input.size);
  const partType = cleanPart(input.partType);
  const discipline = cleanPart(input.discipline);

  if (brand) parts.push(brand);
  if (model && model.toLowerCase() !== brand.toLowerCase()) parts.push(model);
  if (year) parts.push(year);

  if (input.subjectKind === "part") {
    if (partType && !parts.join(" ").toLowerCase().includes(partType.toLowerCase())) {
      parts.push(partType);
    }
  } else if (size) {
    parts.push(size);
  } else if (discipline && !/\b(other|unknown)\b/i.test(discipline)) {
    parts.push(discipline);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function normalizeEbayQueryKey(query: string) {
  return String(query || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldKeepListingTitle(
  title: string,
  subjectKind: EbayActiveQueryInput["subjectKind"],
  bikeState?: EbayActiveQueryInput["bikeState"],
) {
  const t = String(title || "").trim();
  if (!t) return false;
  if (subjectKind === "part") {
    return !PART_DROP_BIKE_PATTERNS.some((re) => re.test(t));
  }
  const patterns =
    bikeState === "frameset" ? FRAMESET_DROP_PATTERNS : COMPLETE_BIKE_DROP_PATTERNS;
  return !patterns.some((re) => re.test(t));
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0]!;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const weight = idx - lo;
  return sorted[lo]! * (1 - weight) + sorted[hi]! * weight;
}

/** Keep prices within [Q1 - 1.5*IQR, Q3 + 1.5*IQR]. */
export function filterOutliersIqr(prices: number[]): number[] {
  const sorted = [...prices].filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (sorted.length < 4) return sorted;
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  if (q1 == null || q3 == null) return sorted;
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return sorted.filter((p) => p >= low && p <= high);
}

export type RawListing = {
  title: string;
  price: number;
  url: string;
  image: string | null;
};

/**
 * From raw listings → aggregate asking-price estimate.
 * Requires ≥5 prices after filters/IQR; otherwise available=false.
 */
export function estimateFromActiveListings(
  listings: RawListing[],
  query: string,
  subjectKind: EbayActiveQueryInput["subjectKind"] = "bike",
  bikeState?: EbayActiveQueryInput["bikeState"],
): EbayActiveResult {
  const fetchedAt = new Date().toISOString();
  const q = String(query || "").trim();

  const filtered = listings.filter(
    (l) =>
      l &&
      Number.isFinite(l.price) &&
      l.price > 0 &&
      shouldKeepListingTitle(l.title, subjectKind, bikeState),
  );

  const keptPrices = filterOutliersIqr(filtered.map((l) => l.price));
  if (keptPrices.length < 5) {
    return {
      source: "ebay_active",
      available: false,
      median: null,
      low: null,
      high: null,
      count: keptPrices.length,
      samples: [],
      query: q,
      fetchedAt,
      message:
        keptPrices.length === 0
          ? "No matching eBay listings found."
          : `Only ${keptPrices.length} eBay listings after filters — need at least 5.`,
    };
  }

  const sorted = [...keptPrices].sort((a, b) => a - b);
  const median = Math.round(percentile(sorted, 0.5)!);
  const low = Math.round(percentile(sorted, 0.25)!);
  const high = Math.round(percentile(sorted, 0.75)!);

  const byPrice = [...filtered]
    .filter((l) => keptPrices.includes(l.price))
    .sort((a, b) => Math.abs(a.price - median) - Math.abs(b.price - median));

  const samples: EbayActiveSample[] = [];
  const seen = new Set<string>();
  for (const row of byPrice) {
    const key = row.url || `${row.title}-${row.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    samples.push({
      title: row.title,
      price: Math.round(row.price),
      url: row.url,
      image: row.image,
    });
    if (samples.length >= 3) break;
  }

  return {
    source: "ebay_active",
    available: true,
    median,
    low,
    high,
    count: sorted.length,
    samples,
    query: q,
    fetchedAt,
    message: null,
  };
}

export function ebaySearchUrl(query: string) {
  const q = encodeURIComponent(String(query || "").trim());
  return `https://www.ebay.com/sch/i.html?_nkw=${q}&_sacat=177&LH_BIN=1`;
}
