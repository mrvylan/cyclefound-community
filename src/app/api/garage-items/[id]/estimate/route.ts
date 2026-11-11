import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildEbayActiveQuery,
  EBAY_ACTIVE_DISCLAIMER,
  EBAY_ACTIVE_SOURCE,
} from "@/lib/garage/ebayActiveEstimate";
import { ebayBrowseConfigured, estimateEbayActiveValue } from "@/lib/garage/ebayBrowseClient";
import { readEbayPriceCache, writeEbayPriceCache } from "@/lib/garage/ebayPriceCache";
import {
  ESTIMATE_DISCLAIMER,
  confidenceFromListingCount,
  estimateFromDbRow,
  normalizeEstimateConfidence,
  orderEstimateCents,
  toMarketEstimateResult,
  usdToCents,
  type EstimateSample,
  type ItemEstimate,
  type MarketEstimateResult,
} from "@/lib/garage/estimates";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gpt-4o-mini";

type Body = {
  action?: "generate" | "owner_range" | "clear";
  lowUsd?: number;
  highUsd?: number;
};

function estimatePayload(estimate: ItemEstimate | null) {
  if (!estimate || (estimate.midCents == null && estimate.lowCents == null)) {
    return {
      estimated_value_cents: null,
      estimated_value_low_cents: null,
      estimated_value_high_cents: null,
      estimated_value_sample_size: 0,
      estimated_value_confidence: "None",
      estimated_value_source: null,
      estimated_value_at: null,
      estimated_value_meta: null,
    };
  }
  return {
    estimated_value_cents: estimate.midCents,
    estimated_value_low_cents: estimate.lowCents,
    estimated_value_high_cents: estimate.highCents,
    estimated_value_sample_size: estimate.sampleSize ?? 0,
    estimated_value_confidence: estimate.confidence || "Medium",
    estimated_value_source: estimate.source || "ai",
    estimated_value_at: estimate.estimatedAt || new Date().toISOString(),
    estimated_value_meta: {
      disclaimer: estimate.disclaimer || ESTIMATE_DISCLAIMER,
      samples: Array.isArray(estimate.samples) ? estimate.samples.slice(0, 3) : [],
      query: estimate.query || null,
      ebayFallbackMessage: estimate.ebayFallbackMessage || null,
      market: toMarketEstimateResult(estimate),
    },
  };
}

function subjectKindFromRow(row: Record<string, unknown>): "bike" | "part" {
  const type = String(row.community_item_type || "").toLowerCase();
  if (type === "bike") return "bike";
  if (type === "part" || type === "gear") return "part";
  const cat = String(row.category || row.part_category || "").toLowerCase();
  if (cat.includes("complete bike") || cat.includes("frameset")) return "bike";
  return "part";
}

function bikeStateFromRow(row: Record<string, unknown>): "complete" | "frameset" | null {
  const state = String(row.bike_state || "").toLowerCase();
  if (state === "complete" || state === "frameset") return state;
  const cat = String(row.category || "").toLowerCase();
  if (cat.includes("frameset")) return "frameset";
  if (cat.includes("complete bike")) return "complete";
  return subjectKindFromRow(row) === "bike" ? "complete" : null;
}

function modelFromRow(row: Record<string, unknown>, manufacturer: string) {
  const explicit = String(row.model_name || "").trim();
  if (explicit) return explicit;
  const title = String(row.title || "").trim();
  if (!title) return "";
  const mfg = manufacturer.trim();
  if (mfg && title.toLowerCase().startsWith(mfg.toLowerCase())) {
    return title.slice(mfg.length).trim().replace(/^[-–—,]+/, "").trim();
  }
  return title;
}

function itemEstimateFromEbay(result: {
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
  samples: EstimateSample[];
  query: string;
  fetchedAt: string;
}): ItemEstimate {
  const ordered = orderEstimateCents({
    lowCents: usdToCents(result.low),
    midCents: usdToCents(result.median),
    highCents: usdToCents(result.high),
  });
  return {
    ...ordered,
    confidence: confidenceFromListingCount(result.count),
    source: EBAY_ACTIVE_SOURCE,
    sampleSize: result.count,
    estimatedAt: result.fetchedAt,
    disclaimer: EBAY_ACTIVE_DISCLAIMER,
    samples: result.samples,
    query: result.query,
  };
}

async function generateAiEstimate(item: {
  title: string;
  manufacturer: string;
  year: string;
  category: string;
  condition: string;
  size: string;
  discipline: string;
  description: string;
}): Promise<ItemEstimate> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Estimates are not configured. Add OPENAI_API_KEY to the server environment.",
    );
  }

  const prompt = `You estimate used bicycle / part fair market value in USD for Cycle Found.
Return JSON only:
{
  "estimatedValueLowUsd": number,
  "estimatedValueMidUsd": number,
  "estimatedValueHighUsd": number,
  "confidence": "Low" | "Medium" | "High",
  "rationale": "short string max 200 chars"
}
Rules:
- Ranges for used private-party / marketplace prices, not dealer retail.
- Prefer conservative mid values.
- If unknown, still give a wide low-confidence range rather than inventing a precise sale.
- Do not include asking prices the owner set; this is market context only.

Item:
Title: ${item.title}
Brand: ${item.manufacturer || "Unknown"}
Year: ${item.year || "Unknown"}
Category: ${item.category || "Unknown"}
Condition: ${item.condition || "Unknown"}
Size/spec: ${item.size || "Unknown"}
Discipline: ${item.discipline || "Unknown"}
Notes: ${item.description?.slice(0, 400) || "None"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ESTIMATE_MODEL?.trim() || DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a bicycle market valuation assistant. Output JSON only. Estimates are not appraisals.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[estimate-ai] openai status=", res.status, text.slice(0, 200));
    throw new Error("Could not generate an AI estimate right now.");
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content || "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Could not parse estimate response.");
  }

  const ordered = orderEstimateCents({
    lowCents: usdToCents(parsed.estimatedValueLowUsd),
    midCents: usdToCents(parsed.estimatedValueMidUsd),
    highCents: usdToCents(parsed.estimatedValueHighUsd),
  });
  if (ordered.midCents == null) {
    throw new Error("Could not produce an estimate for this item yet.");
  }

  return {
    ...ordered,
    confidence: normalizeEstimateConfidence(parsed.confidence),
    source: "ai",
    sampleSize: 0,
    estimatedAt: new Date().toISOString(),
    disclaimer: ESTIMATE_DISCLAIMER,
    samples: [],
    query: "",
  };
}

/** Prefer eBay active listing asking prices; fall back to AI when <5 comps. */
async function generateMarketEstimate(row: Record<string, unknown>): Promise<{
  estimate: ItemEstimate;
  market: MarketEstimateResult;
}> {
  const manufacturer = String(row.manufacturer_name || "").trim();
  const model = modelFromRow(row, manufacturer);
  const year = String(row.approximate_year || "").trim();
  const condition = String(row.condition || "").trim();
  const discipline = String(row.discipline || row.bike_type || "").trim();
  const category = String(row.category || row.part_category || "").trim();
  const size = String(row.frame_size_label || "").trim();
  const title =
    String(row.title || "").trim() ||
    [manufacturer, model].filter(Boolean).join(" ").trim() ||
    "Item";
  const subjectKind = subjectKindFromRow(row);
  const bikeState = bikeStateFromRow(row);

  let ebayFallbackMessage: string | null = null;
  let ebayQuery = "";

  if (ebayBrowseConfigured()) {
    const input = {
      manufacturer,
      model,
      year,
      size,
      partType: subjectKind === "part" ? category : "",
      discipline,
      subjectKind,
      bikeState,
      categoryHint: process.env.EBAY_CYCLING_CATEGORY_ID || "",
    };

    try {
      ebayQuery = buildEbayActiveQuery(input);

      const cached = ebayQuery ? await readEbayPriceCache(ebayQuery) : null;
      const ebay =
        cached?.available && cached.median != null
          ? cached
          : await estimateEbayActiveValue(input);

      if (ebay.available && ebay.median != null && ebay.count >= 5) {
        if (!cached?.available) {
          await writeEbayPriceCache(ebay.query || ebayQuery, ebay);
        }
        const estimate = itemEstimateFromEbay({
          median: ebay.median,
          low: ebay.low,
          high: ebay.high,
          count: ebay.count,
          samples: ebay.samples,
          query: ebay.query,
          fetchedAt: ebay.fetchedAt,
        });
        return {
          estimate,
          market: {
            source: "ebay_active",
            median: ebay.median,
            low: ebay.low,
            high: ebay.high,
            count: ebay.count,
            samples: ebay.samples,
            query: ebay.query,
            fetchedAt: ebay.fetchedAt,
          },
        };
      }
      ebayFallbackMessage = ebay.message || "Not enough eBay listings found.";
      ebayQuery = ebay.query || ebayQuery;
    } catch (err) {
      console.warn(
        "[estimate] eBay soft-fail:",
        err instanceof Error ? err.message : err,
      );
      ebayFallbackMessage = "eBay listings unavailable right now.";
    }
  } else {
    ebayFallbackMessage = "eBay is not configured.";
  }

  const ai = await generateAiEstimate({
    title,
    manufacturer,
    year,
    category,
    condition,
    size,
    discipline,
    description: String(row.description || row.modifications || ""),
  });

  const estimate: ItemEstimate = {
    ...ai,
    source: "ai",
    query: ebayQuery || null,
    ebayFallbackMessage,
  };

  return {
    estimate,
    market: {
      source: "ai",
      median: (estimate.midCents ?? 0) / 100,
      low: (estimate.lowCents ?? estimate.midCents ?? 0) / 100,
      high: (estimate.highCents ?? estimate.midCents ?? 0) / 100,
      count: 0,
      samples: [],
      query: ebayQuery,
      fetchedAt: estimate.estimatedAt || new Date().toISOString(),
    },
  };
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage estimates." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action || "generate";

  const { data: row, error: loadError } = await supabase
    .from("garage_bikes")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 400 });
  }
  if (!row) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  let nextEstimate: ItemEstimate | null = null;
  let market: MarketEstimateResult | null = null;

  try {
    if (action === "clear") {
      nextEstimate = null;
    } else if (action === "owner_range") {
      const lowCents = usdToCents(body.lowUsd);
      const highCents = usdToCents(body.highUsd);
      if (lowCents == null || highCents == null || highCents < lowCents) {
        return NextResponse.json(
          { error: "Enter a valid low and high range in USD." },
          { status: 400 },
        );
      }
      const ordered = orderEstimateCents({
        lowCents,
        midCents: Math.round((lowCents + highCents) / 2),
        highCents,
      });
      nextEstimate = {
        ...ordered,
        confidence: "Medium",
        source: "owner_range",
        sampleSize: 0,
        estimatedAt: new Date().toISOString(),
        disclaimer: ESTIMATE_DISCLAIMER,
        samples: [],
        query: "",
      };
      market = toMarketEstimateResult(nextEstimate);
    } else {
      const generated = await generateMarketEstimate(row as Record<string, unknown>);
      nextEstimate = generated.estimate;
      market = generated.market;
    }
  } catch (err) {
    console.warn("[estimate] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not update estimate. Please try again.",
      },
      { status: 502 },
    );
  }

  const payload = estimatePayload(nextEstimate);
  const { data: updated, error: saveError } = await supabase
    .from("garage_bikes")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 400 });
  }

  const estimate = updated
    ? estimateFromDbRow(updated as Record<string, unknown>)
    : nextEstimate;

  return NextResponse.json({
    itemId: id,
    estimate,
    market: market || toMarketEstimateResult(estimate),
  });
}
