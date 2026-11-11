"use client";

import { createClient } from "@/lib/supabase/client";
import { normalizeItemCategory } from "@/lib/data/categories";
import type { ItemStatus } from "@/lib/data/seed";
import {
  normalizeBikeComponents,
  type BikeComponent,
} from "@/lib/garage/bike-components";
import {
  mapGarageBikeRow,
  type CfPayload,
  type RemoteGarageItem,
} from "@/lib/garage/garageMap";
import { askAmount, normalizeAskInput } from "@/lib/garage/itemFields";
import {
  typingFieldsForSave,
  type BikeState,
  type GarageItemType,
} from "@/lib/garage/item-types";
import { communityHandleFromProfile } from "@/lib/community/handles";

export type { RemoteGarageItem };

const BUCKET = "garage-photos";
const PHOTO_SELECT =
  "id, bike_id, storage_path, sort_order, is_cover, width, height, content_type, byte_size";

export type GarageItemInput = {
  title: string;
  category: string;
  year: string;
  size?: string;
  discipline?: string;
  manufacturer?: string;
  condition: string;
  status: ItemStatus;
  askingPrice: string;
  description: string;
  notes: string;
  provenance: string;
  /** data: URLs for new uploads; https URLs for photos already on the server */
  photos: string[];
  bikeComponents?: BikeComponent[];
  archived?: boolean;
  /** Optional — derived from category when omitted. */
  itemType?: GarageItemType;
  bikeState?: BikeState | null;
  installedOnBikeId?: string | null;
  partType?: string;
  gearType?: string;
  quantity?: number;
  compatibility?: {
    speeds?: string;
    mount?: string;
    axle?: string;
  };
};

function dollarsToCents(ask: string): number | null {
  const n = askAmount(ask);
  return n == null ? null : n * 100;
}

function categoryToKind(category: string): "bike" | "part" {
  const cat = normalizeItemCategory(category);
  return cat === "Complete bikes" || cat === "Framesets" ? "bike" : "part";
}

function splitTitle(title: string, manufacturer?: string) {
  const brand = String(manufacturer || "").trim();
  const clean = String(title || "").trim();
  if (brand && clean) {
    const without = clean
      .replace(new RegExp(`^${brand}\\b[\\s\\-–—:]*`, "i"), "")
      .trim();
    return {
      manufacturer_name: brand,
      model_name: without || clean || "Item",
    };
  }
  if (brand) return { manufacturer_name: brand, model_name: clean || "Item" };
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return {
      manufacturer_name: parts[0]!,
      model_name: parts.slice(1).join(" ") || "Item",
    };
  }
  return { manufacturer_name: clean || "Unknown", model_name: clean || "Item" };
}

function buildCfPayload(input: GarageItemInput): CfPayload {
  const askCents = dollarsToCents(normalizeAskInput(input.askingPrice) || "");
  const typing = typingFieldsForSave({
    category: input.category,
    itemType: input.itemType,
    bikeState: input.bikeState,
    installedOnBikeId: input.installedOnBikeId,
  });
  return {
    v: 1,
    title: input.title.trim(),
    category: typing.category,
    discipline: input.discipline?.trim() || undefined,
    description: input.description.trim() || undefined,
    provenance: input.provenance.trim() || undefined,
    status: input.status,
    asking_price_cents:
      input.status === "Not for sale" || input.status === "Trade only"
        ? null
        : askCents,
    bike_components: input.bikeComponents?.length
      ? normalizeBikeComponents(input.bikeComponents)
      : undefined,
    archived: Boolean(input.archived),
    item_type: typing.itemType,
    bike_state: typing.bikeState,
    installed_on_bike_id: typing.installedOnBikeId,
    category_needs_review: typing.categoryNeedsReview,
    part_type: input.partType?.trim() || undefined,
    gear_type: input.gearType?.trim() || undefined,
    quantity:
      typeof input.quantity === "number" && Number.isFinite(input.quantity)
        ? Math.max(1, Math.round(input.quantity))
        : undefined,
    compatibility: input.compatibility
      ? {
          speeds: input.compatibility.speeds?.trim() || undefined,
          mount: input.compatibility.mount?.trim() || undefined,
          axle: input.compatibility.axle?.trim() || undefined,
        }
      : undefined,
  };
}

function rowPayload(input: GarageItemInput, ownerId: string) {
  const cf = buildCfPayload(input);
  const names = splitTitle(cf.title, input.manufacturer);
  const kind = categoryToKind(cf.category);
  return {
    owner_id: ownerId,
    manufacturer_name: names.manufacturer_name,
    model_name: names.model_name,
    approximate_year:
      input.year.trim() && input.year.trim() !== "—" ? input.year.trim() : null,
    bike_type: kind === "bike" ? input.discipline?.trim() || null : null,
    frame_size_label: kind === "bike" ? input.size?.trim() || null : null,
    condition: input.condition.trim() || null,
    notes: input.notes.trim(),
    modifications: input.description.trim() || null,
    item_kind: kind,
    part_category: kind === "part" ? cf.category : null,
    open_to_offers: input.status === "Open to offers",
    purchase_price_cents: cf.asking_price_cents,
    community_item_type: cf.item_type,
    bike_state: cf.bike_state,
    installed_on_bike_id: cf.installed_on_bike_id,
    category_needs_review: Boolean(cf.category_needs_review),
    ai_identification: { cf },
  };
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Sign in to save garage items to your account.");
  return { supabase, user };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error("Could not read a photo for upload.");
  return res.blob();
}

async function uploadPhotoRows(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  bikeId: string,
  photos: string[],
) {
  const { data: existing } = await supabase
    .from("garage_bike_photos")
    .select("id, storage_path")
    .eq("bike_id", bikeId);
  const paths = (existing || [])
    .map((p) => String(p.storage_path || ""))
    .filter((p) => p.startsWith(`${userId}/`));
  if (existing?.length) {
    await supabase.from("garage_bike_photos").delete().eq("bike_id", bikeId);
  }
  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const uploaded: string[] = [];
  for (let i = 0; i < photos.length; i += 1) {
    const src = photos[i]!;
    let blob: Blob;
    if (src.startsWith("data:")) {
      blob = await dataUrlToBlob(src);
    } else if (src.startsWith("http")) {
      const res = await fetch(src);
      if (!res.ok) continue;
      blob = await res.blob();
    } else {
      continue;
    }

    const photoId = crypto.randomUUID();
    const storagePath = `${userId}/${bikeId}/${photoId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadError) throw new Error(uploadError.message || "Photo upload failed.");

    const { error: rowError } = await supabase.from("garage_bike_photos").insert({
      bike_id: bikeId,
      storage_path: storagePath,
      sort_order: i,
      is_cover: i === 0,
      content_type: "image/jpeg",
      byte_size: blob.size,
    });
    if (rowError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw new Error(rowError.message || "Could not save photo metadata.");
    }
    uploaded.push(storagePath);
  }
  return uploaded;
}

async function signPaths(
  supabase: ReturnType<typeof createClient>,
  paths: string[],
): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60 * 6);
  if (error) return [];
  return (data || []).map((d) => d.signedUrl || "").filter(Boolean);
}

function handleForUser(user: { id: string; user_metadata?: Record<string, unknown>; email?: string }) {
  return communityHandleFromProfile(
    user.id,
    String(user.user_metadata?.display_name || user.email || "Member"),
  );
}

export async function createRemoteGarageItem(
  input: GarageItemInput,
): Promise<RemoteGarageItem> {
  const { supabase, user } = await requireUser();
  if (!input.photos.length) throw new Error("Add at least one photo.");

  const payload = rowPayload(input, user.id);
  const { data, error } = await supabase
    .from("garage_bikes")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Could not create garage item.");

  const bikeId = String(data.id);
  try {
    const paths = await uploadPhotoRows(supabase, user.id, bikeId, input.photos);
    const photoUrls = await signPaths(supabase, paths);
    return mapGarageBikeRow(
      data as Record<string, unknown>,
      handleForUser(user),
      photoUrls,
    );
  } catch (err) {
    await supabase.from("garage_bikes").delete().eq("id", bikeId).eq("owner_id", user.id);
    throw err;
  }
}

export async function updateRemoteGarageItem(
  id: string,
  input: GarageItemInput,
): Promise<RemoteGarageItem> {
  const { supabase, user } = await requireUser();
  const payload = rowPayload(input, user.id);
  const { owner_id: _owner, ...update } = payload;

  const { data, error } = await supabase
    .from("garage_bikes")
    .update(update)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not update garage item.");
  if (!data) throw new Error("Item not found or you do not own it.");

  if (input.photos.length) {
    await uploadPhotoRows(supabase, user.id, id, input.photos);
  } else {
    const { data: existing } = await supabase
      .from("garage_bike_photos")
      .select("storage_path")
      .eq("bike_id", id);
    const paths = (existing || [])
      .map((p) => String(p.storage_path || ""))
      .filter((p) => p.startsWith(`${user.id}/`));
    await supabase.from("garage_bike_photos").delete().eq("bike_id", id);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  }

  const { data: photoRows } = await supabase
    .from("garage_bike_photos")
    .select(PHOTO_SELECT)
    .eq("bike_id", id)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true });
  const paths = (photoRows || []).map((p) => String(p.storage_path));
  const photoUrls = await signPaths(supabase, paths);
  return mapGarageBikeRow(
    data as Record<string, unknown>,
    handleForUser(user),
    photoUrls,
  );
}

export async function setRemoteGarageArchived(id: string, archived: boolean) {
  const { supabase, user } = await requireUser();
  const { data: existing, error: loadError } = await supabase
    .from("garage_bikes")
    .select("ai_identification")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Item not found.");

  const prev =
    existing.ai_identification && typeof existing.ai_identification === "object"
      ? (existing.ai_identification as Record<string, unknown>)
      : {};
  const cf =
    prev.cf && typeof prev.cf === "object"
      ? { ...(prev.cf as Record<string, unknown>), archived }
      : { v: 1, archived };

  const { error } = await supabase
    .from("garage_bikes")
    .update({ ai_identification: { ...prev, cf } })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);
}

export async function deleteRemoteGarageItem(id: string) {
  const { supabase, user } = await requireUser();
  const { data: photos } = await supabase
    .from("garage_bike_photos")
    .select("storage_path")
    .eq("bike_id", id);
  const paths = (photos || [])
    .map((p) => String(p.storage_path || ""))
    .filter((p) => p.startsWith(`${user.id}/`));

  const { error } = await supabase
    .from("garage_bikes")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
