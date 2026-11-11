"use client";

import { BrandAutocomplete } from "@/components/forms/BrandAutocomplete";
import type { ItemCategory } from "@/lib/data/categories";
import {
  DISCIPLINES,
  type Discipline,
} from "@/lib/garage/disciplines";
import {
  CONDITION_HELP,
  CONDITIONS,
  type FormCondition,
} from "@/lib/garage/mapAiCategory";
import {
  garageItemField,
  garageItemLabel,
  garageItemSelectField,
} from "./formStyles";

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  manufacturer: string;
  onManufacturerChange: (v: string) => void;
  modelName: string;
  onModelNameChange: (v: string) => void;
  category: ItemCategory;
  onCategoryChange: (v: ItemCategory) => void;
  /** Categories shown in the radiogroup (type-constrained). */
  categoryOptions: readonly ItemCategory[];
  discipline: Discipline | "";
  onDisciplineChange: (v: Discipline | "") => void;
  showDiscipline: boolean;
  aiDisciplineHint: Discipline | "";
  onAcceptDisciplineHint: () => void;
  onDismissDisciplineHint: () => void;
  year: string;
  onYearChange: (v: string) => void;
  size: string;
  onSizeChange: (v: string) => void;
  showSize: boolean;
  condition: FormCondition | "";
  onConditionChange: (v: FormCondition | "") => void;
  aiConditionHint: FormCondition | "";
  onAcceptConditionHint: () => void;
  onDismissConditionHint: () => void;
  titlePlaceholder?: string;
  modelPlaceholder?: string;
};

export function GarageItemDetailsSection({
  title,
  onTitleChange,
  manufacturer,
  onManufacturerChange,
  modelName,
  onModelNameChange,
  category,
  onCategoryChange,
  categoryOptions,
  discipline,
  onDisciplineChange,
  showDiscipline,
  aiDisciplineHint,
  onAcceptDisciplineHint,
  onDismissDisciplineHint,
  year,
  onYearChange,
  size,
  onSizeChange,
  showSize,
  condition,
  onConditionChange,
  aiConditionHint,
  onAcceptConditionHint,
  onDismissConditionHint,
  titlePlaceholder = "e.g. 1984 Colnago Super, Saronni red, 56 cm",
  modelPlaceholder = "e.g. Super",
}: Props) {
  const label = garageItemLabel;
  const field = garageItemField;
  const selectField = garageItemSelectField;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="section-title m-0 text-[20px]">What it is</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">
          How it should appear in your garage.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="flex flex-col gap-2 sm:col-span-2">
          <fieldset className="m-0 border-0 p-0">
            <legend className={label}>Category</legend>
            <div
              role="radiogroup"
              aria-label="Category"
              className="mt-2 flex flex-wrap gap-2"
            >
              {categoryOptions.map((c) => {
                const on = category === c;
                return (
                  <label
                    key={c}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-medium ${
                      on
                        ? "border-ink bg-ink text-white"
                        : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={on}
                      onChange={() => onCategoryChange(c)}
                      className="sr-only"
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        {showDiscipline ? (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <fieldset className="m-0 border-0 p-0">
              <legend className={label}>
                Discipline{" "}
                <span className="font-normal text-muted">(optional)</span>
              </legend>
              <p className="mt-1 mb-2 m-0 text-[13px] text-muted-2">
                Choose how this bike rides — nothing is selected until you pick one.
                Tap again to clear.
              </p>
              {aiDisciplineHint && discipline !== aiDisciplineHint ? (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[12px] border border-accent-soft-border bg-accent-soft px-3 py-2.5">
                  <p className="m-0 flex-1 text-[13px] text-ink">
                    Photos suggest <strong>{aiDisciplineHint}</strong> — confirm if that
                    looks right.
                  </p>
                  <button
                    type="button"
                    onClick={onAcceptDisciplineHint}
                    className="inline-flex h-9 items-center rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-white hover:bg-accent-hover"
                  >
                    Use {aiDisciplineHint}
                  </button>
                  <button
                    type="button"
                    onClick={onDismissDisciplineHint}
                    className="inline-flex h-9 items-center rounded-[8px] px-2 text-[13px] font-semibold text-muted-2 hover:text-ink"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              <div
                role="group"
                aria-label="Discipline"
                className="flex flex-wrap gap-2"
              >
                {DISCIPLINES.map((d) => {
                  const on = discipline === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const next = discipline === d ? "" : d;
                        onDisciplineChange(next);
                        if (next === aiDisciplineHint) onDismissDisciplineHint();
                      }}
                      className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                        on
                          ? "border-ink bg-ink text-white"
                          : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <label htmlFor="item-year" className={label}>
            Year <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="item-year"
            inputMode="numeric"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            placeholder="e.g. 1984"
            className={`${field} placeholder:text-meta`}
          />
        </div>
        {showSize ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="item-size" className={label}>
              Size <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="item-size"
              value={size}
              onChange={(e) => onSizeChange(e.target.value)}
              placeholder="e.g. 56 cm"
              className={`${field} placeholder:text-meta`}
              autoComplete="off"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="item-cond" className={label}>
            Condition
          </label>
          {aiConditionHint && !condition ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-accent-soft-border bg-accent-soft px-3 py-2.5">
              <p className="m-0 flex-1 text-[13px] text-ink">
                Photos suggest <strong>{aiConditionHint}</strong> — confirm if that
                matches what you see.
              </p>
              <button
                type="button"
                onClick={onAcceptConditionHint}
                className="inline-flex h-9 items-center rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-white hover:bg-accent-hover"
              >
                Use {aiConditionHint}
              </button>
              <button
                type="button"
                onClick={onDismissConditionHint}
                className="inline-flex h-9 items-center rounded-[8px] px-2 text-[13px] font-semibold text-muted-2 hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <select
            id="item-cond"
            value={condition}
            required
            onChange={(e) => {
              const next = (e.target.value || "") as FormCondition | "";
              onConditionChange(next);
              if (next) onDismissConditionHint();
            }}
            className={selectField}
          >
            <option value="">Select condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {condition ? (
            <p className="m-0 text-[13px] text-muted-2">{CONDITION_HELP[condition]}</p>
          ) : (
            <p className="m-0 text-[13px] text-muted-2">
              Required — pick the level that best matches how you’d describe it to a buyer.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
