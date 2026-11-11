"use client";

import { PART_TYPES, type PartType } from "@/lib/garage/part-types";
import { garageItemLabel } from "./formStyles";

type Props = {
  partType: PartType | "";
  onPartTypeChange: (v: PartType) => void;
  hidden?: boolean;
};

/** Pill chips for part subtype — matches category chip styling. */
export function GarageItemPartTypeFields({
  partType,
  onPartTypeChange,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <fieldset className="m-0 border-0 p-0">
        <legend className={garageItemLabel}>Part type</legend>
        <div
          role="radiogroup"
          aria-label="Part type"
          className="mt-2 flex flex-wrap gap-2"
        >
          {PART_TYPES.map((opt) => {
            const selected = partType === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPartTypeChange(opt)}
                className={`inline-flex h-10 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
                  selected
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
