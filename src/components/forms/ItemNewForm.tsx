"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeBrandLabel } from "./BrandAutocomplete";
import { bikeComponentsForSave } from "./BikeComponentsEditor";
import { GarageItemAiTypeHint } from "./garage-item/GarageItemAiTypeHint";
import { GarageItemAvailabilitySection } from "./garage-item/GarageItemAvailabilitySection";
import { GarageItemCategoryDisciplineFields } from "./garage-item/GarageItemCategoryDisciplineFields";
import { GarageItemComponentsSection } from "./garage-item/GarageItemComponentsSection";
import { GarageItemConditionFields } from "./garage-item/GarageItemConditionFields";
import { GarageItemDescriptionSection } from "./garage-item/GarageItemDescriptionSection";
import { GarageItemFormFooter } from "./garage-item/GarageItemFormFooter";
import { GarageItemFormHeader } from "./garage-item/GarageItemFormHeader";
import { GarageItemGearTypeFields } from "./garage-item/GarageItemGearTypeFields";
import { GarageItemIdentityFields } from "./garage-item/GarageItemIdentityFields";
import {
  PHOTO_FIRST_STASH_KEY,
  type PhotoFirstStash,
} from "./garage-item/GarageItemPhotoFirst";
import { GarageItemPartLocationSection } from "./garage-item/GarageItemPartLocationSection";
import {
  GarageItemPartSpecFields,
  type PartCompatibility,
} from "./garage-item/GarageItemPartSpecFields";
import { GarageItemPartTypeFields } from "./garage-item/GarageItemPartTypeFields";
import { GarageItemPhotosSection } from "./garage-item/GarageItemPhotosSection";
import { GarageItemQuantityField } from "./garage-item/GarageItemQuantityField";
import { GarageItemWhatItIsSection } from "./garage-item/GarageItemWhatItIsSection";
import { GarageItemYearSizeFields } from "./garage-item/GarageItemYearSizeFields";
import { useAuth } from "@/components/auth/AuthProvider";
import type { BikeComponent } from "@/lib/garage/bike-components";
import {
  componentHasDetails,
  mergeComponentsWithTemplate,
  normalizeBikeComponents,
  parseComponentsBlurb,
} from "@/lib/garage/bike-components";
import {
  clearItemDraft,
  readItemDraft,
  saveItemDraft,
} from "@/lib/auth/drafts";
import { authHref } from "@/lib/auth/redirects";
import type { ItemCategory } from "@/lib/data/categories";
import { upsertCommunityGarageItem } from "@/lib/community/directory-cache";
import { getGarageItemsFor, getSessionHandle } from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";
import {
  categoryFromGearType,
  inferGearTypeFromAi,
  type GearType,
} from "@/lib/garage/gear-types";
import { createRemoteGarageItem } from "@/lib/garage/garageRemote";
import {
  type Discipline,
  normalizeDiscipline,
} from "@/lib/garage/disciplines";
import {
  identifyGarageItemFromPhotos,
  type IdentifySuggestion,
} from "@/lib/garage/identifyClient";
import {
  clampItemDescription,
  composeItemTitle,
  descriptionPriceMismatch,
  ITEM_DESCRIPTION_MAX,
} from "@/lib/garage/itemFields";
import {
  bikeStateFromCategory,
  categoriesForType,
  clampCategoryToType,
  defaultCategoryForType,
  garageNewHref,
  showComponentsForCategory,
  showDisciplineForCategory,
  showSizeForCategory,
  typeFromCategory,
  type GarageItemType,
} from "@/lib/garage/item-types";
import {
  categoryFromPartType,
  inferPartTypeFromAi,
  type PartType,
} from "@/lib/garage/part-types";
import {
  CONDITIONS,
  mapAiCondition,
  mapAiToGarageCategory,
  type FormCondition,
} from "@/lib/garage/mapAiCategory";

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "Open to offers",
  "For sale",
  "Trade only",
];

const EMPTY_COMPAT: PartCompatibility = { speeds: "", mount: "", axle: "" };

function statusFromQuery(raw: string | null): ItemStatus | null {
  if (!raw) return null;
  return (STATUSES as readonly string[]).includes(raw) ? (raw as ItemStatus) : null;
}

function hintDetailForSuggestion(
  type: GarageItemType,
  category: ItemCategory,
): string {
  if (type === "bike") {
    return category === "Framesets" ? "a frameset" : "a complete bike";
  }
  if (type === "part") return "a part or wheel";
  return "gear";
}

const TYPE_COPY: Record<
  GarageItemType,
  { eyebrow: string; blurb: string; photoTip: string; titlePh: string; modelPh: string }
> = {
  bike: {
    eyebrow: "Bike",
    blurb:
      "Photos, identity, and history for what you own. Availability is optional — this is not a marketplace listing wizard.",
    photoTip: "Drive side, non-drive, and a close-up of markings work best.",
    titlePh: "e.g. 1984 Colnago Super, Saronni red, 56 cm",
    modelPh: "e.g. Super",
  },
  part: {
    eyebrow: "Parts & wheels",
    blurb: "Document components or wheelsets in your garage — brand, condition, and notes.",
    photoTip: "Clear shots of logos, drive side, and any wear help identification.",
    titlePh: "e.g. Shimano Ultegra R8000 rear derailleur",
    modelPh: "e.g. RD-R8000",
  },
  gear: {
    eyebrow: "Gear",
    blurb: "Accessories, tools, apparel, and other garage gear.",
    photoTip: "A clear product shot plus any labels or size marks works best.",
    titlePh: "e.g. Park Tool PCS-10.3 repair stand",
    modelPh: "e.g. PCS-10.3",
  },
};

type Props = {
  /** Locked add path from /garage/new?type= */
  itemType: GarageItemType;
};

/**
 * Garage documentation form — catalog what you own.
 * Field set varies by itemType (bike | part | gear); state/validation stay here.
 */
export function ItemNewForm({ itemType }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, configured, user } = useAuth();
  const copy = TYPE_COPY[itemType];
  const categoryOptions = categoriesForType(itemType);
  const isBike = itemType === "bike";
  const isPart = itemType === "part";
  const isGear = itemType === "gear";

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState<ItemCategory>(() =>
    defaultCategoryForType(itemType),
  );
  const [partType, setPartType] = useState<PartType | "">("");
  const [gearType, setGearType] = useState<GearType | "">("");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [year, setYear] = useState("");
  const [size, setSize] = useState("");
  const [compatibility, setCompatibility] = useState<PartCompatibility>(EMPTY_COMPAT);
  const [quantity, setQuantity] = useState("1");
  const [partLocation, setPartLocation] = useState<"installed" | "spare">("spare");
  const [installedOnBikeId, setInstalledOnBikeId] = useState("");
  const [condition, setCondition] = useState<FormCondition | "">("");
  const [status, setStatus] = useState<ItemStatus>(
    () => statusFromQuery(searchParams.get("status")) || "Not for sale",
  );
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
  const [aiDisciplineHint, setAiDisciplineHint] = useState<Discipline | "">("");
  const [aiConditionHint, setAiConditionHint] = useState<FormCondition | "">("");
  /** Soft type mismatch from AI — never auto-applied. */
  const [aiSuggestedType, setAiSuggestedType] = useState<GarageItemType | null>(null);
  const [aiTypeHintDetail, setAiTypeHintDetail] = useState("");
  const lastAiDescriptionRef = useRef("");
  const descriptionTouchedRef = useRef(false);
  const photoStashAppliedRef = useRef(false);

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = isBike && showSizeForCategory(category);
  const showComponents = isBike && showComponentsForCategory(category);
  const showDiscipline = isBike && showDisciplineForCategory(category);
  const sessionHandle = getSessionHandle();
  const sessionOk = Boolean(sessionHandle) || Boolean(user);
  const needsAuth = ready && configured && !sessionOk;
  const canIdentify = photos.length > 0 && !identifying;
  const returnPath = garageNewHref({
    type: itemType,
    status: searchParams.get("status"),
  });

  const bikeOptions = useMemo(() => {
    if (!isPart || !sessionHandle) return [];
    return getGarageItemsFor(sessionHandle)
      .filter((item) => {
        if (item.archived) return false;
        if (item.itemType === "bike") return true;
        return (
          item.catShort === "Complete bikes" || item.catShort === "Framesets"
        );
      })
      .map((item) => ({ id: item.id, name: item.name }));
  }, [isPart, sessionHandle]);

  function resetForm(nextStatus: ItemStatus = "Not for sale") {
    setPhotos([]);
    setTitle("");
    setManufacturer("");
    setModelName("");
    setCategory(defaultCategoryForType(itemType));
    setPartType("");
    setGearType("");
    setDiscipline("");
    setYear("");
    setSize("");
    setCompatibility(EMPTY_COMPAT);
    setQuantity("1");
    setPartLocation("spare");
    setInstalledOnBikeId("");
    setCondition("");
    setStatus(nextStatus);
    setAskingPrice("");
    setDescription("");
    setNotes("");
    setProvenance("");
    setBikeComponents([]);
    setError("");
    setIdentifyError("");
    setAiApplied(false);
    setAiDisciplineHint("");
    setAiConditionHint("");
    setAiSuggestedType(null);
    setAiTypeHintDetail("");
    lastAiDescriptionRef.current = "";
    descriptionTouchedRef.current = false;
  }

  function onPartTypeChange(next: PartType) {
    setPartType(next);
    setCategory(categoryFromPartType(next));
  }

  function onGearTypeChange(next: GearType) {
    setGearType(next);
    setCategory(categoryFromGearType(next));
  }

  function applySuggestion(s: IdentifySuggestion) {
    if (s.title) setTitle(s.title);
    if (s.manufacturer) setManufacturer(normalizeBrandLabel(s.manufacturer));
    if (s.model) setModelName(s.model);

    const mappedCat = mapAiToGarageCategory({
      subjectKind: s.subjectKind,
      category: s.category,
      partCategory: s.partCategory,
    });
    const suggestedType = typeFromCategory(mappedCat);

    // Soft type mismatch only — never auto-switch paths.
    if (suggestedType !== itemType) {
      setAiSuggestedType(suggestedType);
      setAiTypeHintDetail(hintDetailForSuggestion(suggestedType, mappedCat));
    } else {
      setAiSuggestedType(null);
      setAiTypeHintDetail("");
    }

    if (isPart) {
      const inferredPart = inferPartTypeFromAi(
        [s.partCategory, s.category, s.title, s.model, s.description]
          .filter(Boolean)
          .join(" "),
      );
      if (inferredPart) {
        setPartType(inferredPart);
        setCategory(categoryFromPartType(inferredPart));
      } else {
        setCategory(clampCategoryToType(mappedCat, itemType));
      }
    } else if (isGear) {
      const inferredGear = inferGearTypeFromAi(
        [s.partCategory, s.category, s.title, s.model, s.description]
          .filter(Boolean)
          .join(" "),
      );
      if (inferredGear) {
        setGearType(inferredGear);
        setCategory(categoryFromGearType(inferredGear));
      } else {
        setCategory(clampCategoryToType(mappedCat, itemType));
      }
    } else {
      setCategory(clampCategoryToType(mappedCat, itemType));
    }

    if (s.year && s.year !== "Unknown") {
      setYear(s.year.replace(/[^\d]/g, "").slice(0, 4) || s.year);
    }

    const mappedCondition =
      mapAiCondition(s.condition) ||
      ((CONDITIONS as readonly string[]).includes(s.condition)
        ? (s.condition as FormCondition)
        : "");
    if (mappedCondition) setAiConditionHint(mappedCondition);
    else setAiConditionHint("");

    if (isBike) {
      const inferred = normalizeDiscipline(
        [s.description, s.title, s.manufacturer, s.model, s.category]
          .filter(Boolean)
          .join(" "),
      );
      if (inferred && inferred !== "Other") setAiDisciplineHint(inferred);
      else setAiDisciplineHint("");
    }

    const nextDesc = clampItemDescription(s.description || "");
    if (nextDesc) {
      setDescription((cur) => {
        if (
          !cur ||
          !descriptionTouchedRef.current ||
          cur === lastAiDescriptionRef.current
        ) {
          lastAiDescriptionRef.current = nextDesc;
          descriptionTouchedRef.current = false;
          return nextDesc;
        }
        return cur;
      });
    }

    if (isBike && showComponentsForCategory(clampCategoryToType(mappedCat, itemType))) {
      const fromList = normalizeBikeComponents(s.componentList);
      const fromBlurb =
        fromList.length === 0 && s.components
          ? parseComponentsBlurb(s.components)
          : [];
      const nextComponents = fromList.length ? fromList : fromBlurb;
      if (nextComponents.length) {
        setBikeComponents((cur) => {
          const hasOwnerEdits = cur.some(componentHasDetails);
          const base = hasOwnerEdits ? cur : nextComponents;
          const merged = hasOwnerEdits
            ? [
                ...cur,
                ...nextComponents.filter(
                  (n) =>
                    !cur.some((c) => c.slot === n.slot && componentHasDetails(c)),
                ),
              ]
            : base;
          return mergeComponentsWithTemplate(merged, {
            discipline: discipline || null,
            category: clampCategoryToType(mappedCat, itemType),
          });
        });
      }
    }
    setAiApplied(true);
  }

  useEffect(() => {
    const fromQuery = statusFromQuery(searchParams.get("status"));
    if (fromQuery) setStatus(fromQuery);

    if (!photoStashAppliedRef.current) {
      photoStashAppliedRef.current = true;
      try {
        const raw = sessionStorage.getItem(PHOTO_FIRST_STASH_KEY);
        if (raw) {
          sessionStorage.removeItem(PHOTO_FIRST_STASH_KEY);
          const stash = JSON.parse(raw) as PhotoFirstStash;
          if (stash.photos?.length) setPhotos(stash.photos);
          if (stash.suggestion) applySuggestion(stash.suggestion);
          clearItemDraft();
          return;
        }
      } catch {
        /* ignore */
      }
    }

    const draft = readItemDraft();
    if (!draft) return;
    setTitle(draft.title || "");
    if (draft.category) {
      setCategory(clampCategoryToType(draft.category, itemType));
    }
    setYear(draft.year || "");
    if (draft.condition && (CONDITIONS as readonly string[]).includes(draft.condition)) {
      setCondition(draft.condition as FormCondition);
    }
    if (draft.status) setStatus(draft.status as ItemStatus);
    setAskingPrice(draft.askingPrice || "");
    setDescription(draft.description || "");
    setNotes(draft.notes || "");
    setProvenance(draft.provenance || "");
    descriptionTouchedRef.current = Boolean(draft.description);
    clearItemDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once per mount/type
  }, [searchParams, itemType]);

  async function runIdentify() {
    setIdentifyError("");
    setAiApplied(false);
    setAiSuggestedType(null);
    if (!photos.length) {
      setIdentifyError("Add a photo first.");
      return;
    }
    setIdentifying(true);
    try {
      const result = await identifyGarageItemFromPhotos(photos);
      applySuggestion(result.suggestion);
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Identify failed.");
    } finally {
      setIdentifying(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsAuth) {
      saveItemDraft({
        title,
        category,
        year,
        condition: condition || "Good",
        status,
        askingPrice,
        description,
        notes,
        provenance,
      });
      router.push(authHref("join", returnPath));
      return;
    }
    if (!photos.length) {
      setError(
        showPrice
          ? "Add at least one photo before listing For sale or Open to offers."
          : "Add at least one photo so others can recognize the item.",
      );
      return;
    }
    if (!title.trim() && !manufacturer.trim() && !modelName.trim()) {
      setError("Add a title, or brand + model — AI can fill these from photos.");
      return;
    }
    if (isPart && !partType) {
      setError("Choose a part type.");
      return;
    }
    if (isGear && !gearType) {
      setError("Choose a gear type.");
      return;
    }
    if (!condition) {
      setError("Choose a condition.");
      return;
    }
    if (isPart && partLocation === "installed" && !installedOnBikeId) {
      setError("Select which bike this part is installed on, or mark it as spare.");
      return;
    }
    if (description.length > ITEM_DESCRIPTION_MAX) {
      setError(`Description must be ${ITEM_DESCRIPTION_MAX} characters or fewer.`);
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

    const qty = Math.max(1, Math.round(Number(quantity) || 1));
    const sizeValue = isBike
      ? showSize
        ? size.trim()
        : ""
      : isPart
        ? size.trim()
        : "";

    setError("");
    setSaving(true);
    const brand = normalizeBrandLabel(manufacturer);
    const composedTitle = composeItemTitle({
      title,
      year,
      manufacturer: brand,
      modelName,
    });
    try {
      const item = await createRemoteGarageItem({
        title: composedTitle,
        category,
        year: year.trim() || "—",
        size: sizeValue,
        discipline: showDiscipline && discipline ? discipline : "",
        manufacturer: brand,
        condition,
        status,
        askingPrice: showPrice ? askingPrice : "",
        description: clampItemDescription(description),
        notes: notes.trim(),
        provenance: isGear ? "" : provenance.trim(),
        photos,
        bikeComponents: showComponents ? bikeComponentsForSave(bikeComponents) : [],
        itemType,
        bikeState: isBike ? bikeStateFromCategory(category) : null,
        installedOnBikeId:
          isPart && partLocation === "installed" ? installedOnBikeId || null : null,
        partType: isPart ? partType || undefined : undefined,
        gearType: isGear ? gearType || undefined : undefined,
        quantity: isPart ? qty : undefined,
        compatibility: isPart
          ? {
              speeds: compatibility.speeds,
              mount: compatibility.mount,
              axle: compatibility.axle,
            }
          : undefined,
      });
      upsertCommunityGarageItem(item);
      const handle = getSessionHandle() || sessionHandle || item.ownerHandle;
      resetForm(statusFromQuery(searchParams.get("status")) || "Not for sale");
      router.push(handle ? `/u/${handle}/garage?added=${item.id}` : `/i/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to your garage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <GarageItemFormHeader
        eyebrow={copy.eyebrow}
        blurb={copy.blurb}
        needsAuth={needsAuth}
        joinHref={authHref("join", returnPath)}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <GarageItemPhotosSection
          photos={photos}
          onChange={setPhotos}
          identifying={identifying}
          canIdentify={canIdentify}
          aiApplied={aiApplied}
          identifyError={identifyError}
          onIdentify={() => void runIdentify()}
          tip={copy.photoTip}
        />

        {aiSuggestedType ? (
          <GarageItemAiTypeHint
            suggestedType={aiSuggestedType}
            status={searchParams.get("status")}
            detail={aiTypeHintDetail}
            onDismiss={() => {
              setAiSuggestedType(null);
              setAiTypeHintDetail("");
            }}
          />
        ) : null}

        <GarageItemWhatItIsSection>
          {isPart ? (
            <GarageItemPartTypeFields
              partType={partType}
              onPartTypeChange={onPartTypeChange}
            />
          ) : null}
          {isGear ? (
            <GarageItemGearTypeFields
              gearType={gearType}
              onGearTypeChange={onGearTypeChange}
            />
          ) : null}

          <GarageItemIdentityFields
            title={title}
            onTitleChange={setTitle}
            titlePlaceholder={copy.titlePh}
            manufacturer={manufacturer}
            onManufacturerChange={setManufacturer}
            modelName={modelName}
            onModelNameChange={setModelName}
            modelPlaceholder={copy.modelPh}
          />

          {isBike ? (
            <>
              <GarageItemCategoryDisciplineFields
                category={category}
                onCategoryChange={setCategory}
                categoryOptions={categoryOptions}
                discipline={discipline}
                onDisciplineChange={setDiscipline}
                showDiscipline={showDiscipline}
                aiDisciplineHint={aiDisciplineHint}
                onClearDisciplineHint={() => setAiDisciplineHint("")}
              />
              <GarageItemYearSizeFields
                year={year}
                onYearChange={setYear}
                size={size}
                onSizeChange={setSize}
                showSize={showSize}
              />
            </>
          ) : null}

          {isPart ? (
            <GarageItemPartSpecFields
              partType={partType}
              year={year}
              onYearChange={setYear}
              sizeSpec={size}
              onSizeSpecChange={setSize}
              compatibility={compatibility}
              onCompatibilityChange={setCompatibility}
            />
          ) : null}

          <GarageItemConditionFields
            condition={condition}
            onConditionChange={setCondition}
            aiConditionHint={aiConditionHint}
            onClearConditionHint={() => setAiConditionHint("")}
          />
          {isPart ? (
            <GarageItemQuantityField
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          ) : null}
        </GarageItemWhatItIsSection>

        {isBike ? (
          <GarageItemComponentsSection
            value={bikeComponents}
            onChange={setBikeComponents}
            discipline={discipline}
            category={category}
            hidden={!showComponents}
          />
        ) : null}

        {isPart ? (
          <GarageItemPartLocationSection
            mode={partLocation}
            onModeChange={(mode) => {
              setPartLocation(mode);
              if (mode === "spare") setInstalledOnBikeId("");
            }}
            installedOnBikeId={installedOnBikeId}
            onInstalledOnBikeIdChange={setInstalledOnBikeId}
            bikes={bikeOptions}
          />
        ) : null}

        <GarageItemDescriptionSection
          description={description}
          onDescriptionChange={setDescription}
          onDescriptionTouch={() => {
            descriptionTouchedRef.current = true;
          }}
          notes={notes}
          onNotesChange={setNotes}
          provenance={provenance}
          onProvenanceChange={setProvenance}
          showProvenance={!isGear}
          blurb={
            isGear
              ? "A short public note helps others know what you have."
              : undefined
          }
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

        <GarageItemFormFooter
          needsAuth={needsAuth}
          saving={saving}
          error={error}
          cancelHref={sessionHandle ? `/u/${sessionHandle}/garage` : "/"}
        />
      </form>
    </div>
  );
}
