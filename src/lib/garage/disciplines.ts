import type { GarageItem } from "@/lib/data/seed";

/** Ride disciplines for Market filters and card labels. */
export const DISCIPLINES = [
  "Road",
  "Mountain",
  "Gravel",
  "Hybrid / Comfort",
  "Kids",
  "E-bike",
  "Cargo",
  "Track",
  "Other",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

const DISCIPLINE_SET = new Set<string>(DISCIPLINES.map((d) => d.toLowerCase()));

/** Map a free-text category / tag onto a canonical discipline when possible. */
export function normalizeDiscipline(raw: string | undefined | null): Discipline | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  if (!v) return null;
  if (DISCIPLINE_SET.has(v)) {
    return DISCIPLINES.find((d) => d.toLowerCase() === v) ?? null;
  }
  if (/hybrid|comfort|neko|fx\b|crosstown|fitness|city bike|commuter/.test(v)) {
    return "Hybrid / Comfort";
  }
  if (/e\s*bike|electric|pedelec|bosch|shimano steps/.test(v)) return "E-bike";
  if (/cargo|bullitt|babboe|urban arrow|longtail/.test(v)) return "Cargo";
  if (/kid|youth|junior|children/.test(v)) return "Kids";
  if (/gravel|all.?road|adventure|cyclo.?cross|cx\b/.test(v)) return "Gravel";
  if (/mtb|mountain|trail|enduro|downhill|\bdh\b|dirt/.test(v)) return "Mountain";
  if (/track|fixed|fix|pista/.test(v)) return "Track";
  if (/road|racing|endurance|gran fondo/.test(v)) return "Road";
  return null;
}

/** Infer discipline from listing fields when none is stored. */
export function inferDiscipline(item: Pick<GarageItem, "name" | "cat" | "catShort" | "description" | "discipline">): Discipline {
  if (item.discipline) {
    return normalizeDiscipline(item.discipline) ?? (item.discipline as Discipline);
  }
  const fromCat =
    normalizeDiscipline(item.cat) || normalizeDiscipline(item.catShort);
  if (fromCat) return fromCat;
  const hay = `${item.name} ${item.description || ""}`;
  return normalizeDiscipline(hay) || "Other";
}

export function itemDisciplineLabel(item: GarageItem): string {
  return inferDiscipline(item);
}
