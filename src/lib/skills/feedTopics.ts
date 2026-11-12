/**
 * Ask intents (what the person is trying to do) + expertise suggestions
 * from typed text (taxonomy skills/brands for matching members).
 */

import { SKILL_TAXONOMY, type SkillDef } from "./taxonomy";

export type AskIntent = {
  id: "fix" | "find" | "value" | "build" | "other";
  label: string;
  /** Short helper under the ask box */
  blurb: string;
  /** Placeholder example that matches this intent */
  example: string;
  /** Free-form question tags that belong under this intent */
  tagMatchers: string[];
};

/** Intent chips — Fix / Find / Value / Build, plus Other last. */
export const ASK_INTENTS: AskIntent[] = [
  {
    id: "fix",
    label: "Fix it",
    blurb: "Repair and maintenance help from people who’ve done the job.",
    example:
      "e.g. Seatpost seized in a 1984 Colnago Super — heat, penetrating oil, or cut it?",
    tagMatchers: [
      "repair",
      "maintenance",
      "seized",
      "seatpost",
      "bottom-bracket",
      "bb",
      "creak",
      "noise",
      "broken",
      "stuck",
      "fix",
    ],
  },
  {
    id: "find",
    label: "Find it",
    blurb: "Source a part — also check Market listings when you post.",
    example:
      "e.g. Looking for a 1980s Campagnolo Super Record rear derailleur cage — who has one?",
    tagMatchers: [
      "rare",
      "rare-parts",
      "parts",
      "nos",
      "looking",
      "wanted",
      "source",
      "cage",
      "campagnolo",
      "find",
    ],
  },
  {
    id: "value",
    label: "Value it",
    blurb: "Authenticity, dating, and what something’s worth.",
    example:
      "e.g. Fair value on a 1987 Specialized Stumpjumper Comp with original Deore XT?",
    tagMatchers: [
      "valuation",
      "value",
      "worth",
      "authentic",
      "appraisal",
      "dating",
      "serial",
      "fake",
    ],
  },
  {
    id: "build",
    label: "Build it",
    blurb: "Geometry, frame work, builds, and setup choices.",
    example:
      "e.g. Building a 56 cm steel frameset for mixed pavement — geometry and groupset advice?",
    tagMatchers: [
      "build",
      "frame",
      "geometry",
      "gravel",
      "wheel",
      "tubeless",
      "brazing",
      "setup",
    ],
  },
  {
    id: "other",
    label: "Other",
    blurb: "Anything else — stories, advice, or questions that don’t fit the jobs above.",
    example: "e.g. First vintage ride meetup tips — what should I bring and ask about?",
    tagMatchers: ["other", "general", "misc"],
  },
];

export const ASK_INTENT_OPTIONS = ASK_INTENTS.map((i) => ({
  value: i.id,
  label: i.label,
}));

export const FEED_INTENT_OPTIONS = [
  { value: "All", label: "All" },
  ...ASK_INTENTS.map((i) => ({ value: i.id, label: i.label })),
];

export function intentById(id: string): AskIntent | undefined {
  return ASK_INTENTS.find((i) => i.id === id);
}

/** Feed filter: match question tags to an intent. */
export function questionMatchesIntent(tags: string[], intentId: string): boolean {
  if (!intentId || intentId === "All") return true;
  const intent = intentById(intentId);
  if (!intent) return false;
  const hay = tags.map((t) => t.toLowerCase());
  return intent.tagMatchers.some((m) =>
    hay.some((t) => t === m || t.includes(m) || m.includes(t)),
  );
}

/** @deprecated Prefer questionMatchesIntent — kept for older call sites. */
export function questionMatchesTopic(tags: string[], topicLabel: string): boolean {
  if (!topicLabel || topicLabel === "All") return true;
  const byLabel = ASK_INTENTS.find((i) => i.label === topicLabel);
  if (byLabel) return questionMatchesIntent(tags, byLabel.id);
  // Legacy skill-topic labels from the previous catalog
  const legacy: Record<string, string> = {
    "Repair & maintenance": "fix",
    "Rare parts": "find",
    Valuation: "value",
    "Frame building": "build",
    Wheelbuilding: "build",
    "Vintage restoration": "fix",
    Suspension: "fix",
    "Electronic shifting": "fix",
  };
  const mapped = legacy[topicLabel];
  return mapped ? questionMatchesIntent(tags, mapped) : true;
}

function skillSearchBlob(skill: SkillDef): string {
  return [skill.label, ...(skill.aliases ?? [])].join(" ").toLowerCase();
}

/**
 * Suggest taxonomy expertise chips from free text (multi-select matching layer).
 * Brands and disciplines both qualify — e.g. Campagnolo + Vintage restoration.
 */
export function suggestTopicsFromText(raw: string, max = 6): string[] {
  const text = raw.trim().toLowerCase();
  if (text.length < 8) return [];

  const scored: { label: string; score: number }[] = [];
  for (const skill of SKILL_TAXONOMY) {
    const blob = skillSearchBlob(skill);
    const needles = [skill.label.toLowerCase(), ...(skill.aliases ?? []).map((a) => a.toLowerCase())];
    let score = 0;
    for (const n of needles) {
      if (n.length < 3) continue;
      if (text.includes(n)) score += n.length >= 8 ? 6 : 4;
      else {
        // token overlap for multi-word labels
        const parts = n.split(/[^a-z0-9]+/).filter((p) => p.length > 3);
        const hits = parts.filter((p) => text.includes(p)).length;
        if (hits && hits === parts.length) score += 3;
        else if (hits) score += 1;
      }
    }
    // Prefer exact-ish brand/discipline hits over weak token noise
    if (score > 0 && blob.length) scored.push({ label: skill.label, score });
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of scored) {
    if (seen.has(s.label)) continue;
    seen.add(s.label);
    out.push(s.label);
    if (out.length >= max) break;
  }
  return out;
}

/** Guess intent from text when the member hasn’t picked one yet. */
export function suggestIntentFromText(raw: string): AskIntent["id"] | "" {
  const t = raw.trim().toLowerCase();
  if (t.length < 12) return "";
  const scores: Record<AskIntent["id"], number> = {
    fix: 0,
    find: 0,
    value: 0,
    build: 0,
    other: 0,
  };
  // Never auto-pick Other from keywords — only the four job intents.
  for (const intent of ASK_INTENTS) {
    if (intent.id === "other") continue;
    for (const m of intent.tagMatchers) {
      if (t.includes(m)) scores[intent.id] += 2;
    }
  }
  // Soft copy cues
  if (/\b(looking for|anyone have|where (can|do) i (get|find)|source)\b/.test(t)) {
    scores.find += 4;
  }
  if (/\b(worth|value|authentic|fake|date|dating|serial)\b/.test(t)) {
    scores.value += 4;
  }
  if (/\b(fix|repair|stuck|seized|creak|broken|won't|cant|can't)\b/.test(t)) {
    scores.fix += 4;
  }
  if (/\b(build|geometry|chainstay|frame|wheelbuild|setup)\b/.test(t)) {
    scores.build += 4;
  }
  const best = (Object.entries(scores) as [AskIntent["id"], number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];
  return best && best[1] >= 4 ? best[0] : "";
}
