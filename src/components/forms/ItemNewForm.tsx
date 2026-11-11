"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeBrandLabel } from "./BrandAutocomplete";
import { bikeComponentsForSave } from "./BikeComponentsEditor";
import { GarageItemAvailabilitySection } from "./garage-item/GarageItemAvailabilitySection";
import { GarageItemComponentsSection } from "./garage-item/GarageItemComponentsSection";
import { GarageItemDescriptionSection } from "./garage-item/GarageItemDescriptionSection";
import { GarageItemDetailsSection } from "./garage-item/GarageItemDetailsSection";
import {
  PHOTO_FIRST_STASH_KEY,
  type PhotoFirstStash,
} from "./garage-item/GarageItemPhotoFirst";
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
  clearItemDraft,
  readItemDraft,
  saveItemDraft,
} from "@/lib/auth/drafts";
import { authHref } from "@/lib/auth/redirects";
import type { ItemCategory } from "@/lib/data/categories";
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
  mapAiToGarageCategory,
  type FormCondition,
} from "@/lib/garage/mapAiCategory";
import {
  categoriesForType,
  clampCategoryToType,
  defaultCategoryForType,
  garageNewHref,
  showComponentsForCategory,
  showDisciplineForCategory,
  showSizeForCategory,
  type GarageItemType,
} from "@/lib/garage/item-types";

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

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState<ItemCategory>(() =>
    defaultCategoryForType(itemType),
  );
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
  const [aiDisciplineHint, setAiDisciplineHint] = useState<Discipline | "">("");
  const [aiConditionHint, setAiConditionHint] = useState<FormCondition | "">("");
  const lastAiDescriptionRef = useRef("");
  const descriptionTouchedRef = useRef(false);
  const photoStashAppliedRef = useRef(false);

  const showPrice = status === "For sale" || status === "Open to offers";
  const showSize = showSizeForCategory(category);
  const showComponents = showComponentsForCategory(category);
  const showDiscipline = showDisciplineForCategory(category);
  const sessionHandle = getSessionHandle();
  const sessionOk = Boolean(sessionHandle) || Boolean(user);
  const needsAuth = ready && configured && !sessionOk;
  const canIdentify = photos.length > 0 && !identifying;
  const returnPath = garageNewHref({
    type: itemType,
    status: searchParams.get("status"),
  });

  function resetForm(nextStatus: ItemStatus = "Not for sale") {
    setPhotos([]);
    setTitle("");
    setManufacturer("");
    setModelName("");
    setCategory(defaultCategoryForType(itemType));
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

  function applySuggestion(s: IdentifySuggestion) {
    if (s.title) setTitle(s.title);
    if (s.manufacturer) setManufacturer(normalizeBrandLabel(s.manufacturer));
    if (s.model) setModelName(s.model);
    const mappedCat = mapAiToGarageCategory({
      subjectKind: s.subjectKind,
      category: s.category,
      partCategory: s.partCategory,
    });
    setCategory(clampCategoryToType(mappedCat, itemType));
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
    if (showComponentsForCategory(clampCategoryToType(mappedCat, itemType))) {
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

    // Photo-first stash wins over draft once.
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow m-0">{copy.eyebrow}</p>
          <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">Add to garage</h1>
          <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
            {copy.blurb}
          </p>
          <p className="mt-2 m-0">
            <Link
              href={garageNewHref({ status: searchParams.get("status") })}
              className="text-[13px] font-semibold text-accent no-underline hover:text-accent-hover"
            >
              Change item type
            </Link>
          </p>
        </div>
        {needsAuth ? (
          <p className="m-0 max-w-[18rem] rounded-[10px] border border-line bg-ground px-3 py-2 text-[13px] text-muted-2 sm:text-right">
            Join to save to your garage — draft is kept.{" "}
            <Link href={authHref("join", returnPath)} className="font-semibold text-accent">
              Join
            </Link>
          </p>
        ) : null}
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
          tip={copy.photoTip}
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
          titlePlaceholder={copy.titlePh}
          modelPlaceholder={copy.modelPh}
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

        {error ? (
          <p className="m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-[10px] bg-accent px-6 text-[16px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {needsAuth
              ? "Join & add to garage"
              : saving
                ? "Saving to your account…"
                : "Add to garage"}
          </button>
          <Link
            href={sessionHandle ? `/u/${sessionHandle}/garage` : "/"}
            className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
