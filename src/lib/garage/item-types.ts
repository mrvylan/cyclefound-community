import {
  ITEM_CATEGORIES,
  normalizeItemCategory,
  type ItemCategory,
} from "@/lib/data/categories";

/** Top-level Add-to-garage type (UI/routing + Community metadata). */
export type GarageItemType = "bike" | "part" | "gear";

/** Bike subtype — only meaningful when itemType is bike. */
export type BikeState = "complete" | "frameset";

export const GARAGE_ITEM_TYPES: GarageItemType[] = ["bike", "part", "gear"];

const BIKE_CATEGORIES: ItemCategory[] = ["Complete bikes", "Framesets"];
const PART_CATEGORIES: ItemCategory[] = ["Components", "Wheels"];
const GEAR_CATEGORIES: ItemCategory[] = ["Accessories", "Tools", "Other"];

export type ResolvedItemTyping = {
  itemType: GarageItemType;
  bikeState: BikeState | null;
  installedOnBikeId: string | null;
  /** True when category was Other (or explicitly flagged) — keep original category. */
  categoryNeedsReview: boolean;
  /** Original / normalized ItemCategory — never rewritten by typing. */
  category: ItemCategory;
};

export function isGarageItemType(value: string | null | undefined): value is GarageItemType {
  return value === "bike" || value === "part" || value === "gear";
}

export function isBikeState(value: string | null | undefined): value is BikeState {
  return value === "complete" || value === "frameset";
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

/** Read-time / write-time map from legacy category → type (category value kept as-is). */
export function typeFromCategory(category: string): GarageItemType {
  const cat = normalizeItemCategory(category);
  if (BIKE_CATEGORIES.includes(cat)) return "bike";
  if (PART_CATEGORIES.includes(cat)) return "part";
  if (GEAR_CATEGORIES.includes(cat)) return "gear";
  return "gear";
}

export function bikeStateFromCategory(category: string): BikeState | null {
  const cat = normalizeItemCategory(category);
  if (cat === "Complete bikes") return "complete";
  if (cat === "Framesets") return "frameset";
  return null;
}

export function categoryNeedsReviewFromCategory(category: string): boolean {
  return normalizeItemCategory(category) === "Other";
}

/**
 * Prefer stored typing fields; fall back from category for older rows.
 * Always preserves the original category string (normalized to ItemCategory).
 */
export function resolveItemTyping(opts: {
  category: string;
  itemType?: string | null;
  bikeState?: string | null;
  installedOnBikeId?: string | null;
  categoryNeedsReview?: boolean | null;
}): ResolvedItemTyping {
  const category = normalizeItemCategory(opts.category);
  const itemType = isGarageItemType(opts.itemType)
    ? opts.itemType
    : typeFromCategory(category);
  const bikeState =
    itemType === "bike"
      ? isBikeState(opts.bikeState)
        ? opts.bikeState
        : bikeStateFromCategory(category)
      : null;
  const installedOnBikeId =
    itemType === "part" && opts.installedOnBikeId
      ? String(opts.installedOnBikeId)
      : null;
  const categoryNeedsReview =
    typeof opts.categoryNeedsReview === "boolean"
      ? opts.categoryNeedsReview
      : categoryNeedsReviewFromCategory(category);

  return {
    itemType,
    bikeState,
    installedOnBikeId,
    categoryNeedsReview,
    category,
  };
}

/** Fields to persist alongside category (never replaces category). */
export function typingFieldsForSave(opts: {
  category: string;
  itemType?: GarageItemType | null;
  bikeState?: BikeState | null;
  installedOnBikeId?: string | null;
}): Pick<
  ResolvedItemTyping,
  "itemType" | "bikeState" | "installedOnBikeId" | "categoryNeedsReview" | "category"
> {
  const category = normalizeItemCategory(opts.category);
  const itemType = opts.itemType ?? typeFromCategory(category);
  const bikeState =
    itemType === "bike"
      ? opts.bikeState ?? bikeStateFromCategory(category)
      : null;
  return {
    category,
    itemType,
    bikeState,
    installedOnBikeId: itemType === "part" ? opts.installedOnBikeId || null : null,
    categoryNeedsReview: categoryNeedsReviewFromCategory(category),
  };
}

/** Constrain a category to the allowed set for a type (fallback to type default). */
export function clampCategoryToType(
  category: string,
  type: GarageItemType,
): ItemCategory {
  const cat = normalizeItemCategory(category);
  const allowed = categoriesForType(type);
  if (allowed.includes(cat)) return cat;
  if (type === "bike") {
    if (cat === "Framesets") return "Framesets";
    return "Complete bikes";
  }
  if (type === "part") {
    if (cat === "Wheels") return "Wheels";
    return "Components";
  }
  if (ITEM_CATEGORIES.includes(cat) && allowed.includes(cat)) return cat;
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

/** Prefer stored itemType; fall back to Step 2 category mapping for older rows. */
export function resolvedItemType(item: {
  itemType?: GarageItemType | null;
  catShort?: string;
  category?: string;
}): GarageItemType {
  if (isGarageItemType(item.itemType)) return item.itemType;
  return typeFromCategory(item.catShort || item.category || "Other");
}

export function isBikeItem(item: {
  itemType?: GarageItemType | null;
  catShort?: string;
  category?: string;
}): boolean {
  return resolvedItemType(item) === "bike";
}

/** Parts & gear tab — everything that isn’t a bike. */
export function isPartsOrGearItem(item: {
  itemType?: GarageItemType | null;
  catShort?: string;
  category?: string;
}): boolean {
  return resolvedItemType(item) !== "bike";
}

export function categoriesForGarageTab(
  tab: "bikes" | "parts",
): ItemCategory[] {
  return tab === "bikes" ? BIKE_CATEGORIES : [...PART_CATEGORIES, ...GEAR_CATEGORIES];
}
