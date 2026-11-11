import type { ItemCategory } from "@/lib/data/categories";

/** Part subtype picker for the Parts & wheels add path. */
export const PART_TYPES = [
  "Frame only",
  "Fork",
  "Wheelset",
  "Front wheel",
  "Rear wheel",
  "Crankset",
  "Derailleur",
  "Shifters",
  "Brakes",
  "Saddle",
  "Seatpost",
  "Bars",
  "Stem",
  "Tires",
  "Other",
] as const;

export type PartType = (typeof PART_TYPES)[number];

export function isPartType(value: string | null | undefined): value is PartType {
  return (PART_TYPES as readonly string[]).includes(String(value || ""));
}

/** Map part type → legacy ItemCategory (kept on save). */
export function categoryFromPartType(partType: PartType): ItemCategory {
  if (
    partType === "Wheelset" ||
    partType === "Front wheel" ||
    partType === "Rear wheel" ||
    partType === "Tires"
  ) {
    return "Wheels";
  }
  return "Components";
}

/** Dynamic size/spec label for the part path. */
export function sizeLabelForPartType(partType: PartType | ""): string {
  switch (partType) {
    case "Frame only":
      return "Frame size";
    case "Fork":
      return "Steerer / axle";
    case "Wheelset":
    case "Front wheel":
    case "Rear wheel":
      return "Wheel size";
    case "Crankset":
      return "Crank length";
    case "Derailleur":
      return "Cage / capacity";
    case "Shifters":
      return "Speeds";
    case "Brakes":
      return "Rotor size";
    case "Saddle":
      return "Width";
    case "Seatpost":
      return "Diameter / offset";
    case "Bars":
      return "Width";
    case "Stem":
      return "Length / rise";
    case "Tires":
      return "Size / width";
    case "Other":
    default:
      return "Size / spec";
  }
}

export function sizePlaceholderForPartType(partType: PartType | ""): string {
  switch (partType) {
    case "Frame only":
      return "e.g. 56 cm / Large";
    case "Fork":
      return "e.g. 1-1/8\" tapered, 15×110";
    case "Wheelset":
    case "Front wheel":
    case "Rear wheel":
      return "e.g. 700c / 29\"";
    case "Crankset":
      return "e.g. 172.5 mm";
    case "Derailleur":
      return "e.g. Medium cage";
    case "Shifters":
      return "e.g. 2×11";
    case "Brakes":
      return "e.g. 160 mm";
    case "Saddle":
      return "e.g. 143 mm";
    case "Seatpost":
      return "e.g. 27.2 mm, 20 mm setback";
    case "Bars":
      return "e.g. 42 cm";
    case "Stem":
      return "e.g. 100 mm, ±6°";
    case "Tires":
      return "e.g. 700×28c";
    default:
      return "Size or key spec";
  }
}

/** Infer a part type from AI text — soft hint only. */
export function inferPartTypeFromAi(hay: string): PartType | "" {
  const h = hay.toLowerCase();
  if (/wheelset|wheel\s*set/.test(h)) return "Wheelset";
  if (/front\s*wheel/.test(h)) return "Front wheel";
  if (/rear\s*wheel/.test(h)) return "Rear wheel";
  if (/\btire|\btyre/.test(h)) return "Tires";
  if (/\bfork\b/.test(h)) return "Fork";
  if (/frameset|\bframe\b/.test(h) && !/complete/.test(h)) return "Frame only";
  if (/crank/.test(h)) return "Crankset";
  if (/derailleur/.test(h)) return "Derailleur";
  if (/shifter|brifter/.test(h)) return "Shifters";
  if (/brake|rotor|caliper/.test(h)) return "Brakes";
  if (/saddle|seat\b/.test(h) && !/seatpost/.test(h)) return "Saddle";
  if (/seatpost|seat\s*post/.test(h)) return "Seatpost";
  if (/\bbar(s)?\b|handlebar/.test(h)) return "Bars";
  if (/\bstem\b/.test(h)) return "Stem";
  return "";
}
