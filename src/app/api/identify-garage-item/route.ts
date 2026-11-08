import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ITEM_CATEGORIES } from "@/lib/data/categories";
import {
  buildSuggestedTitle,
  mapAiCondition,
  mapAiToGarageCategory,
} from "@/lib/garage/mapAiCategory";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_PHOTOS = 4;
const MAX_DATA_URL_CHARS = 2_500_000; // ~rough cap across all photos

type Body = {
  photos?: string[];
};

function sanitizeString(value: unknown, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI identify is not configured. Add OPENAI_API_KEY to the Community server environment (same secret as Cycle Found marketplace).",
        configured: false,
      },
      { status: 503 },
    );
  }

  // Prefer signed-in users; demo/local still works without auth for Pre-Alpha.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const photos = Array.isArray(body.photos)
    ? body.photos.filter((p) => typeof p === "string" && p.startsWith("data:image/")).slice(0, MAX_PHOTOS)
    : [];

  if (!photos.length) {
    return NextResponse.json(
      { error: "Add at least one photo before running AI identify." },
      { status: 400 },
    );
  }

  const totalChars = photos.reduce((n, p) => n + p.length, 0);
  if (totalChars > MAX_DATA_URL_CHARS) {
    return NextResponse.json(
      { error: "Photos are too large. Try fewer or smaller images." },
      { status: 400 },
    );
  }

  const categories = ITEM_CATEGORIES.join(", ");
  const system = `You identify used bicycles OR bicycle parts from photos for Cycle Found Community garage documentation.
Return JSON only with this shape:
{
  "suggestion": {
    "subjectKind": "bike"|"part",
    "manufacturer": string,
    "model": string,
    "partCategory": string,
    "category": string,
    "year": string,
    "yearRange": string|null,
    "yearConfidence": "low"|"medium"|"high",
    "frameMaterial": string,
    "condition": "Like New"|"Excellent"|"Good"|"Fair"|"Needs Work"|"",
    "components": string,
    "description": string,
    "confidence": "Low"|"Medium"|"High",
    "evidence": string,
    "uncertainFields": string[],
    "needsMorePhotos": boolean,
    "guidance": string
  },
  "alternatives": [{"manufacturer": string, "model": string, "reason": string}]
}
Rules:
- subjectKind "bike" for complete bikes; "part" for frames alone, wheels, groupsets, tools, etc.
- category MUST be one of these Community garage categories: ${categories}.
  Map accordingly: complete bicycle → "Complete bikes"; bare frame/frameset → "Framesets"; wheelsets → "Wheels"; drivetrain/cockpit/brakes/saddles/etc. → "Components"; lights/computers/bags/bottles/locks/pumps → "Accessories"; shop tools → "Tools"; anything else → "Other".
- Do NOT invent precise years. Use "Unknown" or a range and low yearConfidence unless a year is clearly printed.
- description: 1–3 sentences for the public garage listing (visible condition, notable features). No prices or invented ownership history. Under 400 characters.
- These are suggestions for the owner to confirm — never claim certainty.`;

  const model =
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_MODEL;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Community garage categories: ${categories}\n\nAnalyze the bicycle or part in these photos and return structured identification JSON.`,
            },
            ...photos.map((url) => ({
              type: "image_url" as const,
              image_url: { url, detail: "low" as const },
            })),
          ],
        },
      ],
    }),
  });

  const payload = await openaiRes.json().catch(() => ({}));
  if (!openaiRes.ok) {
    const detail = payload?.error?.message || openaiRes.statusText;
    return NextResponse.json(
      { error: `OpenAI error: ${detail}`, configured: true },
      { status: 502 },
    );
  }

  const raw = payload?.choices?.[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "Empty AI response." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
  }

  const s = (parsed.suggestion || parsed) as Record<string, unknown>;
  const subjectKind =
    String(s.subjectKind || "bike").toLowerCase() === "part" ? "part" : "bike";
  const manufacturer = sanitizeString(s.manufacturer);
  const modelName = sanitizeString(s.model);
  const partCategory = sanitizeString(s.partCategory);
  const year = sanitizeString(s.year) || "Unknown";
  const description = sanitizeString(s.description, 500);
  const components = sanitizeString(s.components, 400);
  const evidence = sanitizeString(s.evidence, 500);
  const guidance = sanitizeString(s.guidance, 400);
  const confidence = sanitizeString(s.confidence) || "Low";

  const garageCategory = mapAiToGarageCategory({
    subjectKind,
    category: sanitizeString(s.category),
    partCategory,
  });
  const condition = mapAiCondition(sanitizeString(s.condition));
  const title = buildSuggestedTitle({
    year: year === "Unknown" ? "" : year,
    manufacturer,
    model: modelName,
    subjectKind,
    partCategory,
  });

  const alternatives = Array.isArray(parsed.alternatives)
    ? parsed.alternatives
        .slice(0, 3)
        .map((a) => {
          const row = a as Record<string, unknown>;
          return {
            manufacturer: sanitizeString(row.manufacturer),
            model: sanitizeString(row.model),
            reason: sanitizeString(row.reason, 200),
          };
        })
        .filter((a) => a.manufacturer || a.model)
    : [];

  return NextResponse.json({
    configured: true,
    source: "openai",
    userId: user?.id ?? null,
    photosUsed: photos.length,
    suggestion: {
      subjectKind,
      manufacturer,
      model: modelName,
      partCategory,
      category: garageCategory,
      year,
      yearRange: sanitizeString(s.yearRange) || null,
      yearConfidence: sanitizeString(s.yearConfidence) || "low",
      frameMaterial: sanitizeString(s.frameMaterial),
      condition,
      components,
      description,
      confidence,
      evidence,
      uncertainFields: Array.isArray(s.uncertainFields)
        ? s.uncertainFields.map((x) => sanitizeString(x)).filter(Boolean).slice(0, 8)
        : [],
      needsMorePhotos: Boolean(s.needsMorePhotos),
      guidance,
      title,
    },
    alternatives,
  });
}
