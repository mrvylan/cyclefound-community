import { normalizeItemCategory } from "@/lib/data/categories";
import type { GarageItem, ItemStatus } from "@/lib/data/seed";
import {
  normalizeBikeComponents,
  type BikeComponent,
} from "@/lib/garage/bike-components";
import {
  resolveItemTyping,
  type BikeState,
  type GarageItemType,
} from "@/lib/garage/item-types";

export type RemoteGarageItem = GarageItem & {
  ownerId: string;
  photoUrls: string[];
  source: "garage";
  /** Owner-only when present on detail payloads */
  notes?: string;
  provenance?: string;
};

export type CfPayload = {
  v: 1;
  title: string;
  category: string;
  discipline?: string;
  description?: string;
  provenance?: string;
  status: ItemStatus;
  asking_price_cents: number | null;
  bike_components?: BikeComponent[];
  archived?: boolean;
  /** Community typing — optional on legacy payloads; category stays authoritative for display. */
  item_type?: GarageItemType;
  bike_state?: BikeState | null;
  installed_on_bike_id?: string | null;
  category_needs_review?: boolean;
  /** Parts & gear subtype fields (cf-only; category still preserved). */
  part_type?: string;
  gear_type?: string;
  quantity?: number;
  compatibility?: {
    speeds?: string;
    mount?: string;
    axle?: string;
  };
};

export const STATUS_TO_DB: Record<ItemStatus, string> = {
  "Not for sale": "not_for_sale",
  "Open to offers": "open_to_offers",
  "For sale": "for_sale",
  "Trade only": "trade_only",
};

export const DB_TO_STATUS: Record<string, ItemStatus> = {
  not_for_sale: "Not for sale",
  open_to_offers: "Open to offers",
  for_sale: "For sale",
  trade_only: "Trade only",
};

export function formatUsdFromCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  const n = Number(cents) / 100;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function readCfPayload(row: Record<string, unknown>): CfPayload | null {
  const ai = row.ai_identification;
  if (!ai || typeof ai !== "object") return null;
  const cf = (ai as { cf?: CfPayload }).cf;
  return cf && typeof cf === "object" ? cf : null;
}

export function mapGarageBikeRow(
  row: Record<string, unknown>,
  ownerHandle: string,
  photoUrls: string[] = [],
): RemoteGarageItem {
  const cfRaw = readCfPayload(row);

  const statusFromCol = row.status != null ? DB_TO_STATUS[String(row.status)] : undefined;
  const status =
    statusFromCol ||
    cfRaw?.status ||
    (row.open_to_offers ? "Open to offers" : "Not for sale");

  const askCents =
    (typeof row.asking_price_cents === "number" ? row.asking_price_cents : null) ??
    cfRaw?.asking_price_cents ??
    (typeof row.purchase_price_cents === "number" ? row.purchase_price_cents : null);

  const title =
    String(row.title || cfRaw?.title || "").trim() ||
    [row.manufacturer_name, row.model_name].filter(Boolean).join(" ").trim() ||
    "Item";

  const category = normalizeItemCategory(
    String(row.category || cfRaw?.category || row.part_category || "Complete bikes"),
  );

  const typing = resolveItemTyping({
    category,
    itemType:
      (row.community_item_type as string | undefined) || cfRaw?.item_type || null,
    bikeState: (row.bike_state as string | undefined) || cfRaw?.bike_state || null,
    installedOnBikeId:
      (row.installed_on_bike_id as string | undefined) ||
      cfRaw?.installed_on_bike_id ||
      null,
    categoryNeedsReview:
      typeof row.category_needs_review === "boolean"
        ? row.category_needs_review
        : cfRaw?.category_needs_review,
  });

  const components = normalizeBikeComponents(
    row.bike_components ?? cfRaw?.bike_components ?? [],
  );

  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    ownerHandle,
    catShort: category,
    cat: category.toUpperCase(),
    year: String(row.approximate_year || "—"),
    name: title,
    cond: String(row.condition || "—"),
    mkt: "—",
    ask: formatUsdFromCents(askCents),
    status,
    links: "Garage",
    trend: "Flat",
    photo: photoUrls[0],
    photoUrls,
    source: "garage",
    description:
      String(row.description || cfRaw?.description || row.modifications || "").trim() ||
      undefined,
    manufacturer: String(row.manufacturer_name || "").trim() || undefined,
    size: String(row.frame_size_label || "").trim() || undefined,
    discipline:
      String(row.discipline || cfRaw?.discipline || row.bike_type || "").trim() ||
      undefined,
    archived: Boolean(row.archived ?? cfRaw?.archived),
    bikeComponents: components.length ? components : undefined,
    notes: String(row.notes || "").trim() || undefined,
    provenance: String(cfRaw?.provenance || "").trim() || undefined,
    itemType: typing.itemType,
    bikeState: typing.bikeState,
    installedOnBikeId: typing.installedOnBikeId,
    categoryNeedsReview: typing.categoryNeedsReview,
  };
}
