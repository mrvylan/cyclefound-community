import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ESTIMATE_DISCLAIMER,
  estimateFromDbRow,
  normalizeEstimateConfidence,
  orderEstimateCents,
  usdToCents,
  type ItemEstimate,
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
    estimated_value_source: estimate.source || "ai_estimate",
    estimated_value_at: estimate.estimatedAt || new Date().toISOString(),
    estimated_value_meta: {
      disclaimer: estimate.disclaimer || ESTIMATE_DISCLAIMER,
    },
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
    throw new Error(text.slice(0, 200) || "Estimate request failed.");
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
    source: "ai_estimate",
    sampleSize: 0,
    estimatedAt: new Date().toISOString(),
    disclaimer: ESTIMATE_DISCLAIMER,
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
      };
    } else {
      const title =
        String(row.title || "").trim() ||
        [row.manufacturer_name, row.model_name].filter(Boolean).join(" ").trim() ||
        "Item";
      nextEstimate = await generateAiEstimate({
        title,
        manufacturer: String(row.manufacturer_name || ""),
        year: String(row.approximate_year || ""),
        category: String(row.category || row.part_category || ""),
        condition: String(row.condition || ""),
        size: String(row.frame_size_label || ""),
        discipline: String(row.discipline || row.bike_type || ""),
        description: String(row.description || row.modifications || ""),
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Estimate failed." },
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

  return NextResponse.json({ itemId: id, estimate });
}
