/**
 * Fair-market-style estimate from eBay sold / completed comps.
 * Aggregation only — fetching is done server-side (API secrets).
 */

export const EBAY_SOLD_DISCLAIMER =
  "Estimate is based on recent eBay sold listings for similar bikes/parts — not Cycle Found asks, and not an appraisal.";

export const EBAY_SOLD_SOURCE = "ebay_sold_comps";

const CONDITION_RANK: Record<string, number> = {
  "like new": 5,
  new: 5,
  "new with tags": 5,
  "new without tags": 5,
  excellent: 4,
  "certified refurbished": 4,
  "seller refurbished": 4,
  good: 3,
  used: 3,
  "pre-owned": 3,
  fair: 2,
  "for parts or not working": 1,
  "needs work": 1,
};

const CONDITION_FACTOR: Record<number, number> = {
  1: 0.7,
  2: 0.85,
  3: 1,
  4: 1.08,
  5: 1.15,
};

export type EbaySoldQuery = {
  manufacturer?: string;
  model?: string;
  year?: string;
  condition?: string;
  bikeType?: string;
  subjectKind?: "bike" | "part" | string;
};

export type EbaySoldItem = {
  itemId?: string | null;
  title?: string;
  priceCents?: number;
  condition?: string;
  soldDate?: string | null;
  itemWebUrl?: string | null;
};

export type EbaySoldComp = {
  itemId: string | null;
  title: string;
  soldPriceCents: number;
  adjustedCents: number;
  condition: string;
  soldDate: string | null;
  itemWebUrl: string | null;
  score: number;
};

export type EbaySoldEstimateResult = {
  available: boolean;
  source: string;
  sampleSize: number;
  lowCents: number | null;
  midCents: number | null;
  highCents: number | null;
  confidence: "Low" | "Medium" | "High" | "None";
  comps: EbaySoldComp[];
  disclaimer: string;
  message: string | null;
  computedAt?: string;
};

function normalizeToken(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseYear(value: unknown) {
  const match = String(value || "").match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function conditionRank(value: unknown) {
  return CONDITION_RANK[normalizeToken(value)] ?? null;
}

function conditionAdjustFactor(fromCondition: unknown, toCondition: unknown) {
  const from = conditionRank(fromCondition) ?? 3;
  const to = conditionRank(toCondition) ?? 3;
  const fromFactor = CONDITION_FACTOR[from] || 1;
  const toFactor = CONDITION_FACTOR[to] || 1;
  return toFactor / fromFactor;
}

function tokenOverlapScore(a: unknown, b: unknown) {
  const aTokens = normalizeToken(a)
    .split(" ")
    .filter((t) => t.length > 1);
  const bTokens = new Set(
    normalizeToken(b)
      .split(" ")
      .filter((t) => t.length > 1),
  );
  if (!aTokens.length || !bTokens.size) return 0;
  let hits = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) hits += 1;
  }
  return hits / aTokens.length;
}

function editDistance(a: unknown, b: unknown) {
  const s = normalizeToken(a).replace(/\s/g, "");
  const t = normalizeToken(b).replace(/\s/g, "");
  if (!s || !t) return 99;
  if (s === t) return 0;
  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i]![0] = i;
  for (let j = 0; j < cols; j += 1) dp[0]![j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        (dp[i - 1]![j] ?? 0) + 1,
        (dp[i]![j - 1] ?? 0) + 1,
        (dp[i - 1]![j - 1] ?? 0) + cost,
      );
    }
  }
  return dp[s.length]![t.length]!;
}

function brandsMatch(a: unknown, b: unknown) {
  const mfgQ = normalizeToken(a);
  const mfgL = normalizeToken(b);
  if (!mfgQ || !mfgL) return { match: false, score: 0 };
  if (mfgL === mfgQ) return { match: true, score: 40 };
  if (mfgL.includes(mfgQ) || mfgQ.includes(mfgL)) return { match: true, score: 28 };
  const dist = editDistance(mfgQ, mfgL);
  const maxLen = Math.max(mfgQ.replace(/\s/g, "").length, mfgL.replace(/\s/g, "").length);
  if (maxLen >= 4 && dist <= 1) return { match: true, score: 30 };
  if (maxLen >= 6 && dist <= 2) return { match: true, score: 22 };
  return { match: false, score: 0 };
}

function scoreSoldItem(item: EbaySoldItem, query: EbaySoldQuery) {
  const mfgQ = normalizeToken(query.manufacturer);
  const modelQ = normalizeToken(query.model);
  if (!mfgQ || !modelQ || modelQ === "unknown" || modelQ === "to identify") return 0;

  const title = normalizeToken(item.title);
  if (!title) return 0;

  const brand = brandsMatch(mfgQ, title);
  if (!brand.match && !title.includes(mfgQ)) return 0;
  let score = brand.match ? brand.score : 20;

  if (title.includes(modelQ)) score += 40;
  else {
    const overlap = tokenOverlapScore(modelQ, title);
    if (overlap < 0.34) return 0;
    score += Math.round(overlap * 28);
  }

  const yearQ = parseYear(query.year);
  const yearT = parseYear(item.title);
  if (yearQ && yearT) {
    const diff = Math.abs(yearQ - yearT);
    if (diff === 0) score += 15;
    else if (diff <= 2) score += 10;
    else if (diff <= 5) score += 5;
    else if (diff > 10) score -= 8;
  }

  if (query.condition && item.condition) {
    if (normalizeToken(query.condition) === normalizeToken(item.condition)) score += 8;
  }

  if (query.bikeType) {
    const typeQ = normalizeToken(query.bikeType);
    if (typeQ && title.includes(typeQ)) score += 5;
  }

  if (query.subjectKind !== "part") {
    if (
      /\b(wheelset|tire|saddle|pedal|helmet|jersey|bottle|pump)\b/.test(title) &&
      !/\bbike|bicycle|frame\b/.test(title)
    ) {
      score -= 25;
    }
  }

  return score;
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0]!;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const weight = idx - lo;
  return Math.round(sorted[lo]! * (1 - weight) + sorted[hi]! * weight);
}

function confidenceFromSample(
  sampleSize: number,
  bestScore: number,
): EbaySoldEstimateResult["confidence"] {
  if (sampleSize >= 6 && bestScore >= 70) return "High";
  if (sampleSize >= 3 && bestScore >= 55) return "Medium";
  if (sampleSize >= 1) return "Low";
  return "None";
}

export function buildEbaySearchQuery(query: EbaySoldQuery = {}) {
  const parts = [
    String(query.manufacturer || "").trim(),
    String(query.model || "").trim(),
    String(query.year || "").trim(),
    query.subjectKind === "part" ? "" : "bicycle",
  ].filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function estimateFromEbaySoldItems(
  soldItems: EbaySoldItem[] = [],
  query: EbaySoldQuery = {},
): EbaySoldEstimateResult {
  const manufacturer = String(query.manufacturer || "").trim();
  const model = String(query.model || "").trim();
  const modelNorm = model.toLowerCase();

  if (
    !manufacturer ||
    !model ||
    modelNorm === "unknown" ||
    modelNorm === "to identify"
  ) {
    return {
      available: false,
      source: EBAY_SOLD_SOURCE,
      sampleSize: 0,
      lowCents: null,
      midCents: null,
      highCents: null,
      confidence: "None",
      comps: [],
      disclaimer: EBAY_SOLD_DISCLAIMER,
      message: "Manufacturer and model are required to estimate value.",
    };
  }

  const scored = (soldItems || [])
    .map((item) => {
      const score = scoreSoldItem(item, query);
      if (score < 45) return null;
      const baseCents = Number(item.priceCents);
      if (!Number.isFinite(baseCents) || baseCents <= 0) return null;
      const adjustedCents = Math.round(
        baseCents * conditionAdjustFactor(item.condition, query.condition),
      );
      if (!Number.isFinite(adjustedCents) || adjustedCents <= 0) return null;
      return {
        itemId: item.itemId || null,
        title: item.title || "",
        soldPriceCents: baseCents,
        adjustedCents,
        condition: item.condition || "",
        soldDate: item.soldDate || null,
        itemWebUrl: item.itemWebUrl || null,
        score,
      } satisfies EbaySoldComp;
    })
    .filter((c): c is EbaySoldComp => Boolean(c))
    .sort((a, b) => b.score - a.score || a.adjustedCents - b.adjustedCents);

  const comps = scored.slice(0, 12);
  if (!comps.length) {
    return {
      available: false,
      source: EBAY_SOLD_SOURCE,
      sampleSize: 0,
      lowCents: null,
      midCents: null,
      highCents: null,
      confidence: "None",
      comps: [],
      disclaimer: EBAY_SOLD_DISCLAIMER,
      message:
        query.subjectKind === "part"
          ? "Not enough recent eBay sold comps for this part yet."
          : "Not enough recent eBay sold comps for this bike yet.",
    };
  }

  const prices = comps.map((c) => c.adjustedCents).sort((a, b) => a - b);
  const subjectNote =
    query.subjectKind === "part"
      ? " Subject appears to be a part/component; comps may be sparse."
      : "";

  return {
    available: true,
    source: EBAY_SOLD_SOURCE,
    sampleSize: comps.length,
    lowCents: percentile(prices, 0.25),
    midCents: percentile(prices, 0.5),
    highCents: percentile(prices, 0.75),
    confidence: confidenceFromSample(comps.length, comps[0]!.score),
    comps: comps.map((c) => ({
      itemId: c.itemId,
      title: c.title,
      soldPriceCents: c.soldPriceCents,
      adjustedCents: c.adjustedCents,
      condition: c.condition,
      soldDate: c.soldDate,
      itemWebUrl: c.itemWebUrl,
      score: c.score,
    })),
    disclaimer: EBAY_SOLD_DISCLAIMER + subjectNote,
    message: null,
    computedAt: new Date().toISOString(),
  };
}
