import {
  ITEM_CATEGORIES,
  normalizeItemCategory,
  type ItemCategory,
} from "@/lib/data/categories";

/** Top-level Add-to-garage type (UI/routing). Stored category remains ItemCategory. */
export type GarageItemType = "bike" | "part" | "gear";

export const GARAGE_ITEM_TYPES: GarageItemType[] = ["bike", "part", "gear"];

const BIKE_CATEGORIES: ItemCategory[] = ["Complete bikes", "Framesets"];
const PART_CATEGORIES: ItemCategory[] = ["Components", "Wheels"];
const GEAR_CATEGORIES: ItemCategory[] = ["Accessories", "Tools", "Other"];

export function isGarageItemType(value: string | null | undefined): value is GarageItemType {
  return value === "bike" || value === "part" || value === "gear";
}

export function parseTypeQuery(raw: string | null | undefined): GarageItemType | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "bike" || v === "part" || v === "gear") return v;
  return null;
}

export function categoriesForType(type: GarageItemType): ItemCategory[] {
  if (type === "bike") return BIKE_CATEGORIES;
  if (type === "part") return PART_CATEGORIES;
  return GEAR_CATEGORIES;
}

export function defaultCategoryForType(type: GarageItemType): ItemCategory {
  return categoriesForType(type)[0]!;
}

export function typeFromCategory(category: string): GarageItemType {
  const cat = normalizeItemCategory(category);
  if (BIKE_CATEGORIES.includes(cat)) return "bike";
  if (PART_CATEGORIES.includes(cat)) return "part";
  if (GEAR_CATEGORIES.includes(cat)) return "gear";
  return "gear";
}

/** Constrain a category to the allowed set for a type (fallback to type default). */
export function clampCategoryToType(
  category: string,
  type: GarageItemType,
): ItemCategory {
  const cat = normalizeItemCategory(category);
  const allowed = categoriesForType(type);
  if (allowed.includes(cat)) return cat;
  // AI may return a category outside the locked type — keep type, pick best fit.
  if (type === "bike") {
    if (cat === "Framesets") return "Framesets";
    return "Complete bikes";
  }
  if (type === "part") {
    if (cat === "Wheels") return "Wheels";
    return "Components";
  }
  if (allowed.includes(cat)) return cat;
  if (ITEM_CATEGORIES.includes(cat)) {
    // Prefer Other for unmatched gear-ish labels.
    return allowed.includes("Other") ? "Other" : allowed[0]!;
  }
  return defaultCategoryForType(type);
}

export function showSizeForCategory(category: ItemCategory): boolean {
  return category === "Complete bikes" || category === "Framesets";
}

export function showComponentsForCategory(category: ItemCategory): boolean {
  return category === "Complete bikes" || category === "Framesets";
}

export function showDisciplineForCategory(category: ItemCategory): boolean {
  return (
    category === "Complete bikes" ||
    category === "Framesets" ||
    category === "Wheels"
  );
}

export function garageNewHref(opts: {
  type?: GarageItemType | null;
  status?: string | null;
  photo?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.type) params.set("type", opts.type);
  if (opts.status) params.set("status", opts.status);
  if (opts.photo) params.set("photo", "1");
  const q = params.toString();
  return q ? `/garage/new?${q}` : "/garage/new";
}
