/** Shared garage / market item categories (Groupset folds into Components). */
export const ITEM_CATEGORIES = [
  "Complete bikes",
  "Framesets",
  "Components",
  "Wheels",
  "Accessories",
  "Tools",
  "Other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export function isItemCategory(value: string): value is ItemCategory {
  return (ITEM_CATEGORIES as readonly string[]).includes(value);
}

/** Map older or singular labels onto the canonical set. */
export function normalizeItemCategory(raw: string): ItemCategory {
  const v = raw.trim().toLowerCase();
  if (v === "complete bike" || v === "complete bikes") return "Complete bikes";
  if (v === "frameset" || v === "framesets") return "Framesets";
  if (
    v === "groupset" ||
    v === "groupsets" ||
    v === "component" ||
    v === "components"
  ) {
    return "Components";
  }
  if (v === "wheel" || v === "wheels" || v === "wheelset" || v === "wheelsets") {
    return "Wheels";
  }
  if (v === "accessory" || v === "accessories") return "Accessories";
  if (v === "tool" || v === "tools") return "Tools";
  if (v === "other" || v === "misc" || v === "miscellaneous") return "Other";
  return "Other";
}
