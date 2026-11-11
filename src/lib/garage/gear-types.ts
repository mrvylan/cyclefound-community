import type { ItemCategory } from "@/lib/data/categories";

/** Gear subtype picker for the Gear add path. */
export const GEAR_TYPES = ["Accessory", "Tool", "Apparel", "Other"] as const;

export type GearType = (typeof GEAR_TYPES)[number];

export function isGearType(value: string | null | undefined): value is GearType {
  return (GEAR_TYPES as readonly string[]).includes(String(value || ""));
}

export function categoryFromGearType(gearType: GearType): ItemCategory {
  if (gearType === "Accessory") return "Accessories";
  if (gearType === "Tool") return "Tools";
  return "Other";
}

export function inferGearTypeFromAi(hay: string): GearType | "" {
  const h = hay.toLowerCase();
  if (/tool|stand|torque|wrench|bleed|truing/.test(h)) return "Tool";
  if (/jersey|kit|apparel|shoe|glove|helmet|bib|short/.test(h)) return "Apparel";
  if (
    /accessor|light|lamp|computer|gps|bottle|cage|bag|pannier|rack|lock|pump|fender|bell|mirror/.test(
      h,
    )
  ) {
    return "Accessory";
  }
  if (/other|misc/.test(h)) return "Other";
  return "";
}
