import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeSkillLabels,
  taxonomyCatalog,
} from "@/lib/skills/taxonomy";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-4o-mini";

type Body = {
  bio?: string;
  role?: string;
  city?: string;
  garageHints?: string[];
  currentSkills?: string[];
};

function sanitizeString(value: unknown, max = 800) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI skill suggestions are not configured. Add OPENAI_API_KEY to the Community server environment.",
        configured: false,
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  void user; // Pre-Alpha: allow local/demo without requiring auth

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bio = sanitizeString(body.bio, 1200);
  const role = sanitizeString(body.role, 200);
  const city = sanitizeString(body.city, 120);
  const garageHints = Array.isArray(body.garageHints)
    ? body.garageHints
        .filter((h): h is string => typeof h === "string")
        .map((h) => h.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const currentSkills = normalizeSkillLabels(
    Array.isArray(body.currentSkills)
      ? body.currentSkills.filter((s): s is string => typeof s === "string")
      : [],
  );

  if (!bio && !role && !garageHints.length && !currentSkills.length) {
    return NextResponse.json(
      {
        error:
          "Add a short bio, or describe what’s in your garage, so we can suggest skills.",
      },
      { status: 400 },
    );
  }

  const catalog = taxonomyCatalog();
  const allowed = catalog.map((s) => s.label);
  const model =
    process.env.OPENAI_MODEL?.trim() ||
    process.env.OPENAI_VISION_MODEL?.trim() ||
    DEFAULT_MODEL;

  const system = `You help Cycle Found Community members pick public expertise tags for their profile.
Only suggest skills from the curated catalog. Never invent new labels.
Return JSON only:
{
  "suggestions": string[],  // 3–6 catalog labels the member does not already have
  "reasons": { "<label>": string }  // one short phrase per suggestion (why it fits)
}
Rules:
- suggestions must be exact catalog labels (character-for-character).
- Prefer bike expertise over product/company roles.
- Do not suggest skills already in currentSkills.
- Keep reasons under 12 words, practical, no hype.`;

  const userPrompt = `Catalog:
${catalog.map((s) => `- [${s.group}] ${s.label}`).join("\n")}

Member context:
- Role / headline: ${role || "(none)"}
- City: ${city || "(none)"}
- Bio: ${bio || "(none)"}
- Garage hints: ${garageHints.length ? garageHints.join("; ") : "(none)"}
- Already selected: ${currentSkills.length ? currentSkills.join(", ") : "(none)"}

Suggest 3–6 additional skills from the catalog.`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
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

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Empty AI response." }, { status: 502 });
  }

  let parsed: { suggestions?: unknown; reasons?: unknown };
  try {
    parsed = JSON.parse(content) as { suggestions?: unknown; reasons?: unknown };
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
  }

  const allowedSet = new Set(allowed);
  const currentSet = new Set(currentSkills);
  const rawList = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const suggestions = normalizeSkillLabels(
    rawList
      .filter((s): s is string => typeof s === "string")
      .filter((s) => allowedSet.has(s) && !currentSet.has(s)),
    6,
  );

  const reasons: Record<string, string> = {};
  if (parsed.reasons && typeof parsed.reasons === "object") {
    for (const label of suggestions) {
      const r = (parsed.reasons as Record<string, unknown>)[label];
      if (typeof r === "string" && r.trim()) {
        reasons[label] = r.trim().slice(0, 80);
      }
    }
  }

  return NextResponse.json({
    suggestions,
    reasons,
    configured: true,
  });
}
