"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeBrandLabel } from "./BrandAutocomplete";
import { bikeComponentsForSave } from "./BikeComponentsEditor";
import { GarageItemAvailabilitySection } from "./garage-item/GarageItemAvailabilitySection";
import { GarageItemCategoryDisciplineFields } from "./garage-item/GarageItemCategoryDisciplineFields";
import { GarageItemComponentsSection } from "./garage-item/GarageItemComponentsSection";
import { GarageItemConditionFields } from "./garage-item/GarageItemConditionFields";
import { GarageItemDescriptionSection } from "./garage-item/GarageItemDescriptionSection";
import { GarageItemFormFooter } from "./garage-item/GarageItemFormFooter";
import { GarageItemFormHeader } from "./garage-item/GarageItemFormHeader";
import { GarageItemIdentityFields } from "./garage-item/GarageItemIdentityFields";
import { GarageItemPhotosSection } from "./garage-item/GarageItemPhotosSection";
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
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/data/categories";
import { upsertCommunityGarageItem } from "@/lib/community/directory-cache";
import { getSessionHandle } from "@/lib/data/local-store";
import type { ItemStatus } from "@/lib/data/seed";
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

function statusFromQuery(raw: string | null): ItemStatus | null {
  if (!raw) return null;
  return (STATUSES as readonly string[]).includes(raw) ? (raw as ItemStatus) : null;
}

/**
 * Garage documentation form — catalog what you own.
 * Not a marketplace listing wizard (cyclefound.com sell flow stays separate).
 */
export function ItemNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, configured, user } = useAuth();

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Complete bikes");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [year, setYear] = useState("");
  const [size, setSize] = useState("");
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
  /** Soft AI hints — never auto-applied; owner confirms. */
  const [aiDisciplineHint, setAiDisciplineHint] = useState<Discipline | "">("");
  const [aiConditionHint, setAiConditionHint] = useState<FormCondition | "">("");
  /** Last description written by AI — re-identify replaces unless the owner edited it. */
  const lastAiDescriptionRef = useRef("");
  const descriptionTouchedRef = useRef(false);

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = category === "Complete bikes" || category === "Framesets";
  const showComponents = category === "Complete bikes" || category === "Framesets";
  const showDiscipline =
    category === "Complete bikes" || category === "Framesets" || category === "Wheels";
  const sessionHandle = getSessionHandle();
  const sessionOk = Boolean(sessionHandle) || Boolean(user);
  const needsAuth = ready && configured && !sessionOk;
  const canIdentify = photos.length > 0 && !identifying;

  function resetForm(nextStatus: ItemStatus = "Not for sale") {
    setPhotos([]);
    setTitle("");
    setManufacturer("");
    setModelName("");
    setCategory("Complete bikes");
    setDiscipline("");
    setYear("");
    setSize("");
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
    lastAiDescriptionRef.current = "";
    descriptionTouchedRef.current = false;
  }

  useEffect(() => {
    const fromQuery = statusFromQuery(searchParams.get("status"));
    if (fromQuery) setStatus(fromQuery);
    const draft = readItemDraft();
    if (!draft) return;
    setTitle(draft.title || "");
    if (draft.category) {
      const match = ITEM_CATEGORIES.find(
        (c) => c.toLowerCase() === draft.category.toLowerCase(),
      );
      if (match) setCategory(match);
      else if (/groupset/i.test(draft.category)) setCategory("Components");
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
  }, [searchParams]);

  function applySuggestion(s: IdentifySuggestion) {
    if (s.title) setTitle(s.title);
    if (s.manufacturer) setManufacturer(normalizeBrandLabel(s.manufacturer));
    if (s.model) setModelName(s.model);
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
    if (mappedCondition) setAiConditionHint(mappedCondition);
    else setAiConditionHint("");
    const inferred = normalizeDiscipline(
      [s.description, s.title, s.manufacturer, s.model, s.category]
        .filter(Boolean)
        .join(" "),
    );
    if (inferred && inferred !== "Other") setAiDisciplineHint(inferred);
    else setAiDisciplineHint("");
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
    const fromList = normalizeBikeComponents(s.componentList);
    const fromBlurb =
      fromList.length === 0 && s.components ? parseComponentsBlurb(s.components) : [];
    const nextComponents = fromList.length ? fromList : fromBlurb;
    if (nextComponents.length) {
      setBikeComponents((cur) => {
        const hasOwnerEdits = cur.some(componentHasDetails);
        const base = hasOwnerEdits ? cur : nextComponents;
        const merged = hasOwnerEdits
          ? [
              ...cur,
              ...nextComponents.filter(
                (n) => !cur.some((c) => c.slot === n.slot && componentHasDetails(c)),
              ),
            ]
          : base;
        return mergeComponentsWithTemplate(merged, {
          discipline: discipline || null,
          category,
        });
      });
    }
    setAiApplied(true);
  }

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
      router.push(authHref("join", "/item/new"));
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
    if (!condition) {
      setError("Choose a condition.");
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
        size: showSize ? size.trim() : "",
        discipline: showDiscipline && discipline ? discipline : "",
        manufacturer: brand,
        condition,
        status,
        askingPrice: showPrice ? askingPrice : "",
        description: clampItemDescription(description),
        notes: notes.trim(),
        provenance: provenance.trim(),
        photos,
        bikeComponents: showComponents ? bikeComponentsForSave(bikeComponents) : [],
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
        needsAuth={needsAuth}
        joinHref={authHref("join", "/item/new")}
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
        />

        <GarageItemWhatItIsSection>
          <GarageItemIdentityFields
            title={title}
            onTitleChange={setTitle}
            manufacturer={manufacturer}
            onManufacturerChange={setManufacturer}
            modelName={modelName}
            onModelNameChange={setModelName}
          />
          <GarageItemCategoryDisciplineFields
            category={category}
            onCategoryChange={setCategory}
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
          <GarageItemConditionFields
            condition={condition}
            onConditionChange={setCondition}
            aiConditionHint={aiConditionHint}
            onClearConditionHint={() => setAiConditionHint("")}
          />
        </GarageItemWhatItIsSection>

        <GarageItemComponentsSection
          value={bikeComponents}
          onChange={setBikeComponents}
          discipline={discipline}
          category={category}
          hidden={!showComponents}
        />

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
