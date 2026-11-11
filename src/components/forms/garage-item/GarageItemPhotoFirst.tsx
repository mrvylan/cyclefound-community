"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PhotoPicker } from "@/components/forms/PhotoPicker";
import { normalizeBrandLabel } from "@/components/forms/BrandAutocomplete";
import {
  clampItemDescription,
  composeItemTitle,
} from "@/lib/garage/itemFields";
import {
  identifyGarageItemFromPhotos,
  type IdentifySuggestion,
} from "@/lib/garage/identifyClient";
import { mapAiToGarageCategory } from "@/lib/garage/mapAiCategory";
import {
  garageNewHref,
  typeFromCategory,
  type GarageItemType,
} from "@/lib/garage/item-types";

const TYPE_LABEL: Record<GarageItemType, string> = {
  bike: "Bike",
  part: "Parts & wheels",
  gear: "Gear",
};

/** Stash AI suggestion for the typed form to pick up once. */
export const PHOTO_FIRST_STASH_KEY = "cf_garage_photo_first_v1";

export type PhotoFirstStash = {
  photos: string[];
  suggestion: IdentifySuggestion;
  suggestedType: GarageItemType;
};

type Props = {
  status?: string | null;
};

export function GarageItemPhotoFirst({ status }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<IdentifySuggestion | null>(null);
  const [suggestedType, setSuggestedType] = useState<GarageItemType | null>(null);

  async function runIdentify() {
    setError("");
    setSuggestion(null);
    setSuggestedType(null);
    if (!photos.length) {
      setError("Add a photo first.");
      return;
    }
    setIdentifying(true);
    try {
      const result = await identifyGarageItemFromPhotos(photos);
      const s = result.suggestion;
      const category = mapAiToGarageCategory({
        subjectKind: s.subjectKind,
        category: s.category,
        partCategory: s.partCategory,
      });
      const type = typeFromCategory(category);
      setSuggestion({ ...s, category });
      setSuggestedType(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identify failed.");
    } finally {
      setIdentifying(false);
    }
  }

  function continueWithType(type: GarageItemType) {
    if (!suggestion) return;
    const stash: PhotoFirstStash = {
      photos,
      suggestion,
      suggestedType: type,
    };
    try {
      sessionStorage.setItem(PHOTO_FIRST_STASH_KEY, JSON.stringify(stash));
    } catch {
      /* ignore quota */
    }
    router.push(garageNewHref({ type, status }));
  }

  const previewTitle = suggestion
    ? composeItemTitle({
        title: suggestion.title,
        year: suggestion.year,
        manufacturer: normalizeBrandLabel(suggestion.manufacturer),
        modelName: suggestion.model,
      })
    : "";

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <div className="mb-8">
        <p className="eyebrow m-0">Your garage</p>
        <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">
          Start with a photo
        </h1>
        <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
          We’ll suggest whether this looks like a bike, part, or gear. You confirm the type,
          then finish the details.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <PhotoPicker photos={photos} onChange={setPhotos} max={8} reorder />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!photos.length || identifying}
            onClick={() => void runIdentify()}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-accent-soft-border bg-accent-soft px-4 text-[14px] font-semibold text-accent-hover hover:bg-[#e4edd9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-4" aria-hidden />
            {identifying ? "Reading photos…" : "Suggest type from photos"}
          </button>
          <Link
            href={garageNewHref({ status })}
            className="inline-flex h-11 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
          >
            Back to chooser
          </Link>
        </div>

        {error ? (
          <p className="m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
            {error}
          </p>
        ) : null}

        {suggestion && suggestedType ? (
          <div className="rounded-[14px] border border-line bg-surface p-5">
            <p className="eyebrow m-0 text-accent-hover">Suggested</p>
            <h2 className="section-title m-0 mt-1 text-[22px]">
              {TYPE_LABEL[suggestedType]}
            </h2>
            {previewTitle ? (
              <p className="mt-2 m-0 text-[15px] text-muted-2">
                Looks like: <span className="font-medium text-ink">{previewTitle}</span>
              </p>
            ) : null}
            {suggestion.description ? (
              <p className="mt-2 m-0 line-clamp-3 text-[14px] text-muted-2">
                {clampItemDescription(suggestion.description)}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => continueWithType(suggestedType)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover"
              >
                Continue as {TYPE_LABEL[suggestedType]}
              </button>
              {(["bike", "part", "gear"] as GarageItemType[])
                .filter((t) => t !== suggestedType)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => continueWithType(t)}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ground"
                  >
                    Use {TYPE_LABEL[t]} instead
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
