"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeBrandLabel } from "./BrandAutocomplete";
import { bikeComponentsForSave } from "./BikeComponentsEditor";
import { GarageItemAvailabilitySection } from "./garage-item/GarageItemAvailabilitySection";
import { GarageItemComponentsSection } from "./garage-item/GarageItemComponentsSection";
import { GarageItemDescriptionSection } from "./garage-item/GarageItemDescriptionSection";
import { GarageItemDetailsSection } from "./garage-item/GarageItemDetailsSection";
import { GarageItemPhotosSection } from "./garage-item/GarageItemPhotosSection";
import { useAuth } from "@/components/auth/AuthProvider";
import type { BikeComponent } from "@/lib/garage/bike-components";
import {
  componentHasDetails,
  mergeComponentsWithTemplate,
  normalizeBikeComponents,
  parseComponentsBlurb,
} from "@/lib/garage/bike-components";
import {
  ITEM_CATEGORIES,
  type ItemCategory,
  normalizeItemCategory,
} from "@/lib/data/categories";
import {
  getCommunityGarageItem,
  getMarketplaceItem,
  hydrateCommunityDirectory,
  upsertCommunityGarageItem,
} from "@/lib/community/directory-cache";
import {
  canManageGarageItem,
  getItemLocal,
  getItemPhotoUrls,
  getItemPrivateMeta,
  getSessionHandle,
  isMarketplaceListingItem,
  subscribeStore,
  updateGarageItem,
} from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";
import { updateRemoteGarageItem } from "@/lib/garage/garageRemote";
import { readCfPayload } from "@/lib/garage/garageMap";
import {
  categoriesForType,
  showComponentsForCategory,
  showDisciplineForCategory,
  showSizeForCategory,
  typeFromCategory,
} from "@/lib/garage/item-types";
import { updateRemoteMarketplaceListing } from "@/lib/marketplace/listingRemote";
import { isListingUuid } from "@/lib/messaging";
import { createClient } from "@/lib/supabase/client";
import {
  DISCIPLINES,
  type Discipline,
  normalizeDiscipline,
} from "@/lib/garage/disciplines";
import { identifyGarageItemFromPhotos } from "@/lib/garage/identifyClient";
import {
  clampItemDescription,
  composeItemTitle,
  descriptionPriceMismatch,
  ITEM_DESCRIPTION_MAX,
} from "@/lib/garage/itemFields";
import {
  CONDITIONS,
  mapAiCondition,
  type FormCondition,
} from "@/lib/garage/mapAiCategory";

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "Open to offers",
  "For sale",
  "Trade only",
];

export function ItemEditForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: authReady, profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Complete bikes");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [year, setYear] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<FormCondition | "">("");
  const [status, setStatus] = useState<ItemStatus>("Not for sale");
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [provenance, setProvenance] = useState("");
  const [bikeComponents, setBikeComponents] = useState<BikeComponent[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  /** Soft AI hints — never auto-applied; owner confirms. */
  const [aiDisciplineHint, setAiDisciplineHint] = useState<Discipline | "">("");
  const [aiConditionHint, setAiConditionHint] = useState<FormCondition | "">("");

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = showSizeForCategory(category);
  const showComponents = showComponentsForCategory(category);
  const showDiscipline = showDisciplineForCategory(category);
  const categoryOptions = categoriesForType(typeFromCategory(category));
  const sessionHandle = getSessionHandle();
  const canIdentify = photos.length > 0 && !identifying;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const item = getItemLocal(itemId);
      if (!item) {
        setMissing(true);
        setReady(true);
        return;
      }
      const me = getSessionHandle();
      if (!canManageGarageItem(item, me, profile?.id)) {
        setForbidden(true);
        setReady(true);
        return;
      }
      setTitle(item.name);
      setManufacturer(item.manufacturer || "");
      setCategory(normalizeItemCategory(item.catShort));
      setYear(item.year === "—" ? "" : item.year);
      setSize(item.size || "");
      const d =
        normalizeDiscipline(item.discipline) ||
        (item.discipline && (DISCIPLINES as readonly string[]).includes(item.discipline)
          ? (item.discipline as Discipline)
          : "");
      setDiscipline(d || "");
      if ((CONDITIONS as readonly string[]).includes(item.cond)) {
        setCondition(item.cond as FormCondition);
      } else {
        setCondition("");
      }
      const statusFromUrl = searchParams.get("status");
      const nextStatus =
        statusFromUrl && (STATUSES as readonly string[]).includes(statusFromUrl)
          ? (statusFromUrl as ItemStatus)
          : item.status;
      setStatus(nextStatus);
      setAskingPrice(item.ask === "—" ? "" : item.ask);
      setDescription(item.description || "");
      setBikeComponents(item.bikeComponents || []);
      setPhotos(getItemPhotoUrls(item));
      const remote = getCommunityGarageItem(itemId);
      const meta = getItemPrivateMeta(itemId);
      let notesValue = remote?.notes || meta.notes;
      let provenanceValue = remote?.provenance || meta.provenance;
      if (isListingUuid(itemId)) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("garage_bikes")
            .select("notes, ai_identification")
            .eq("id", itemId)
            .maybeSingle();
          if (data) {
            const cf = readCfPayload(data as Record<string, unknown>);
            notesValue = String(data.notes || notesValue || "");
            provenanceValue = String(cf?.provenance || provenanceValue || "");
          }
        } catch {
          /* keep cached meta */
        }
      }
      if (cancelled) return;
      setNotes(notesValue);
      setProvenance(provenanceValue);
      setMissing(false);
      setForbidden(false);
      setReady(true);
    }
    void load();
    const unsub = subscribeStore(() => {
      void load();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [itemId, searchParams, profile?.id]);

  async function runIdentify() {
    setIdentifyError("");
    setAiApplied(false);
    if (!photos.length) {
      setIdentifyError("Add a photo first.");
      return;
    }
    setIdentifying(true);
    try {
      const result = await identifyGarageItemFromPhotos(photos);
      const s = result.suggestion;
      if (s.title) setTitle(s.title);
      if (s.manufacturer) setManufacturer(normalizeBrandLabel(s.manufacturer));
      if (ITEM_CATEGORIES.includes(s.category as ItemCategory)) {
        setCategory(s.category as ItemCategory);
      }
      if (s.year && s.year !== "Unknown") {
        setYear(s.year.replace(/[^\d]/g, "").slice(0, 4) || s.year);
      }
      // Never auto-select discipline or condition — offer confirmable hints only.
      const mappedCondition =
        mapAiCondition(s.condition) ||
        ((CONDITIONS as readonly string[]).includes(s.condition)
          ? (s.condition as FormCondition)
          : "");
      if (mappedCondition && mappedCondition !== condition) {
        setAiConditionHint(mappedCondition);
      } else {
        setAiConditionHint("");
      }
      const inferred = normalizeDiscipline(
        [s.description, s.title, s.manufacturer, s.model, s.category]
          .filter(Boolean)
          .join(" "),
      );
      if (inferred && inferred !== "Other" && inferred !== discipline) {
        setAiDisciplineHint(inferred);
      } else {
        setAiDisciplineHint("");
      }
      const nextDesc = clampItemDescription(s.description || "");
      if (nextDesc) setDescription((cur) => cur || nextDesc);
      const fromList = normalizeBikeComponents(s.componentList);
      const fromBlurb =
        fromList.length === 0 && s.components
          ? parseComponentsBlurb(s.components)
          : [];
      const nextComponents = fromList.length ? fromList : fromBlurb;
      if (nextComponents.length) {
        setBikeComponents((cur) => {
          const hasOwnerEdits = cur.some(componentHasDetails);
          const merged = hasOwnerEdits
            ? [
                ...cur,
                ...nextComponents.filter(
                  (n) => !cur.some((c) => c.slot === n.slot && componentHasDetails(c)),
                ),
              ]
            : nextComponents;
          return mergeComponentsWithTemplate(merged, {
            discipline: discipline || null,
            category,
          });
        });
      }
      setAiApplied(true);
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Identify failed.");
    } finally {
      setIdentifying(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the item a title.");
      return;
    }
    if (!condition) {
      setError("Choose a condition.");
      return;
    }
    if (showPrice && !photos.length) {
      setError(`Add at least one photo to list ${status}.`);
      return;
    }
    if (showPrice && !askingPrice.trim()) {
      setError(
        status === "For sale"
          ? "Add an asking price to list For sale."
          : "Add an asking price (or a starting ask) for Open to offers.",
      );
      return;
    }
    if (description.length > ITEM_DESCRIPTION_MAX) {
      setError(`Description must be ${ITEM_DESCRIPTION_MAX} characters or fewer.`);
      return;
    }
    const priceClash =
      showPrice && askingPrice.trim()
        ? descriptionPriceMismatch(description, askingPrice)
        : null;
    if (priceClash != null) {
      setError(
        `Description mentions $${priceClash.toLocaleString("en-US")} but Asking is different — keep the price only in Asking, or match the amounts.`,
      );
      return;
    }
    setError("");
    setSaving(true);
    const brand = normalizeBrandLabel(manufacturer);
    const payload = {
      title: composeItemTitle({
        title,
        year,
        manufacturer: brand,
        modelName,
      }),
      category,
      year: year.trim() || "—",
      size: showSize ? size.trim() : "",
      discipline: showDiscipline && discipline ? discipline : "",
      manufacturer: brand,
      condition,
      status,
      askingPrice: showPrice ? askingPrice : "",
      description: clampItemDescription(description),
      notes,
      provenance,
      photos,
      bikeComponents: showComponents ? bikeComponentsForSave(bikeComponents) : [],
    };
    try {
      const existing = getItemLocal(itemId);
      const marketplace =
        Boolean(getMarketplaceItem(itemId)) ||
        (existing ? isMarketplaceListingItem(existing) : false);
      const communityGarage = Boolean(getCommunityGarageItem(itemId));

      if (marketplace) {
        const listingId =
          getMarketplaceItem(itemId)?.listingId ||
          (existing as { listingId?: string } | undefined)?.listingId ||
          itemId;
        await updateRemoteMarketplaceListing(listingId, payload);
        await hydrateCommunityDirectory({ force: true }).catch(() => undefined);
        const handle =
          getMarketplaceItem(listingId)?.ownerHandle ||
          existing?.ownerHandle ||
          sessionHandle;
        router.push(handle ? `/u/${handle}/garage` : `/i/${listingId}`);
        return;
      }

      if (communityGarage || isListingUuid(itemId)) {
        const updated = await updateRemoteGarageItem(itemId, payload);
        upsertCommunityGarageItem(updated);
        router.push(
          updated.ownerHandle
            ? `/u/${updated.ownerHandle}/garage`
            : `/i/${itemId}`,
        );
        return;
      }

      const updated = updateGarageItem(itemId, {
        ...payload,
        ownerEstValue: "",
        photoDataUrls: photos,
      });
      const handle = updated?.ownerHandle || sessionHandle;
      router.push(handle ? `/u/${handle}/garage` : `/i/${itemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !authReady) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 text-[15px] text-muted sm:px-8">
        Loading item…
      </div>
    );
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 sm:px-8">
        <h1 className="section-title m-0 text-[36px]">Item not found</h1>
        <p className="mt-2 text-[15px] text-muted-2">It may have been deleted.</p>
        <Link href="/" className="mt-4 inline-flex font-semibold text-accent">
          Back home
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-[920px] px-5 py-16 sm:px-8">
        <h1 className="section-title m-0 text-[36px]">Can&apos;t edit this item</h1>
        <p className="mt-2 text-[15px] text-muted-2">
          Only the owner can edit garage items.
        </p>
        <Link href={`/i/${itemId}`} className="mt-4 inline-flex font-semibold text-accent">
          View item
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <div className="mb-8">
        <p className="eyebrow m-0">
          {getMarketplaceItem(itemId) ? "Your Market listing" : "Your garage"}
        </p>
        <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">Edit item</h1>
        <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
          {getMarketplaceItem(itemId)
            ? "Update details or availability. Saving writes directly to your Market listing."
            : "Update photos, details, or availability. Changes stay in your garage."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <GarageItemPhotosSection
          photos={photos}
          onChange={setPhotos}
          identifying={identifying}
          canIdentify={canIdentify}
          aiApplied={aiApplied}
          identifyError={identifyError}
          onIdentify={() => void runIdentify()}
        />

        <GarageItemDetailsSection
          title={title}
          onTitleChange={setTitle}
          manufacturer={manufacturer}
          onManufacturerChange={setManufacturer}
          modelName={modelName}
          onModelNameChange={setModelName}
          category={category}
          onCategoryChange={setCategory}
          categoryOptions={categoryOptions}
          discipline={discipline}
          onDisciplineChange={setDiscipline}
          showDiscipline={showDiscipline}
          aiDisciplineHint={aiDisciplineHint}
          onAcceptDisciplineHint={() => {
            setDiscipline(aiDisciplineHint);
            setAiDisciplineHint("");
          }}
          onDismissDisciplineHint={() => setAiDisciplineHint("")}
          year={year}
          onYearChange={setYear}
          size={size}
          onSizeChange={setSize}
          showSize={showSize}
          condition={condition}
          onConditionChange={setCondition}
          aiConditionHint={aiConditionHint}
          onAcceptConditionHint={() => {
            setCondition(aiConditionHint);
            setAiConditionHint("");
          }}
          onDismissConditionHint={() => setAiConditionHint("")}
        />

        {showComponents ? (
          <GarageItemComponentsSection
            value={bikeComponents}
            onChange={setBikeComponents}
            discipline={discipline}
            category={category}
          />
        ) : null}

        <GarageItemDescriptionSection
          description={description}
          onDescriptionChange={setDescription}
          onDescriptionTouch={() => undefined}
          notes={notes}
          onNotesChange={setNotes}
          provenance={provenance}
          onProvenanceChange={setProvenance}
        />

        <GarageItemAvailabilitySection
          status={status}
          onStatusChange={setStatus}
          askingPrice={askingPrice}
          onAskingPriceChange={setAskingPrice}
          showPrice={showPrice}
          photosCount={photos.length}
          description={description}
        />

        {error ? (
          <p className="m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-[10px] bg-accent px-6 text-[16px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link
            href={sessionHandle ? `/u/${sessionHandle}/garage` : `/i/${itemId}`}
            className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
