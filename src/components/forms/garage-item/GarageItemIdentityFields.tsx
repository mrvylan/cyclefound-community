"use client";

import { BrandAutocomplete } from "@/components/forms/BrandAutocomplete";
import { garageItemField, garageItemLabel } from "./formStyles";

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  manufacturer: string;
  onManufacturerChange: (v: string) => void;
  modelName: string;
  onModelNameChange: (v: string) => void;
  titlePlaceholder?: string;
  modelPlaceholder?: string;
  /** Hide this block entirely (later item types). */
  hidden?: boolean;
};

/** Title / brand / model — grid cells only (lives inside the What it is section). */
export function GarageItemIdentityFields({
  title,
  onTitleChange,
  manufacturer,
  onManufacturerChange,
  modelName,
  onModelNameChange,
  titlePlaceholder = "e.g. 1984 Colnago Super, Saronni red, 56 cm",
  modelPlaceholder = "e.g. Super",
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;
  const field = garageItemField;

  return (
    <>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label htmlFor="item-title" className={label}>
          Title
        </label>
        <input
          id="item-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className={`${field} placeholder:text-meta`}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="item-brand" className={label}>
          Brand <span className="font-normal text-muted">(optional)</span>
        </label>
        <BrandAutocomplete
          id="item-brand"
          value={manufacturer}
          onChange={onManufacturerChange}
          className={`${field} placeholder:text-meta`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="item-model" className={label}>
          Model <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="item-model"
          value={modelName}
          onChange={(e) => onModelNameChange(e.target.value)}
          placeholder={modelPlaceholder}
          className={`${field} placeholder:text-meta`}
        />
      </div>
    </>
  );
}
