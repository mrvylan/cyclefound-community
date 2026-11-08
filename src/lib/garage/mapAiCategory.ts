import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/data/categories";

const CONDITIONS = ["New", "Excellent", "Very good", "Good", "Fair", "Project"] as const;
export type FormCondition = (typeof CONDITIONS)[number];

/** Map AI / marketplace labels onto Community garage categories. */
export function mapAiToGarageCategory(input: {
  subjectKind?: string;
  category?: string;
  partCategory?: string;
}): ItemCategory {
  const kind = String(input.subjectKind || "").toLowerCase();
  const hay = `${input.partCategory || ""} ${input.category || ""}`.toLowerCase();

  if (kind === "bike" || /complete\s*bike|road|mountain|gravel|electric|ebike/.test(hay)) {
    if (/frame(?!set)|frameset/.test(hay) && !/complete/.test(hay)) return "Framesets";
    return "Complete bikes";
  }
  if (/frameset|\bframe\b/.test(hay)) return "Framesets";
  if (/wheel|rim|hub|spoke/.test(hay)) return "Wheels";
  if (
    /accessor|light|lamp|computer|gps|bottle|cage|bag|pannier|rack|lock|pump|fender|mudguard|bell|mirror|camera|sensor|tracker/.test(
      hay,
    )
  ) {
    return "Accessories";
  }
  if (/tool|stand|torque|wrench|bleed|truing|facing|reamer/.test(hay)) return "Tools";
  if (/other|misc|apparel|jersey|kit|memorabilia|badge|poster/.test(hay)) return "Other";
  if (/groupset|drivetrain|derailleur|crank|brake|stem|bar|saddle|seatpost|pedal|cassette|chain|headset/.test(hay)) {
    return "Components";
  }
  // Prefer Components for bike parts; Other only when nothing bike-shaped matches.
  if (kind === "part" || /component|part/.test(hay)) return "Components";
  return "Other";
}

export function mapAiCondition(raw: string): FormCondition | "" {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (v.includes("like new") || v === "new") return "New";
  if (v.includes("excellent")) return "Excellent";
  if (v.includes("very good")) return "Very good";
  if (v.includes("good")) return "Good";
  if (v.includes("fair")) return "Fair";
  if (v.includes("need") || v.includes("project") || v.includes("work")) return "Project";
  return "";
}

export function buildSuggestedTitle(s: {
  year?: string;
  manufacturer?: string;
  model?: string;
  subjectKind?: string;
  partCategory?: string;
}): string {
  const year =
    s.year && s.year !== "Unknown" && !/^unk/i.test(s.year) ? s.year.trim() : "";
  const brand = (s.manufacturer || "").trim();
  const model = (s.model || "").trim();
  const parts = [year, brand, model].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (s.partCategory) return s.partCategory;
  return "";
}

export { CONDITIONS, ITEM_CATEGORIES };
