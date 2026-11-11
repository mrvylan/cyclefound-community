"use client";

import { GEAR_TYPES, type GearType } from "@/lib/garage/gear-types";
import { garageItemLabel } from "./formStyles";

type Props = {
  gearType: GearType | "";
  onGearTypeChange: (v: GearType) => void;
  hidden?: boolean;
};

export function GarageItemGearTypeFields({
  gearType,
  onGearTypeChange,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <fieldset className="m-0 border-0 p-0">
        <legend className={garageItemLabel}>Gear type</legend>
        <div
          role="radiogroup"
          aria-label="Gear type"
          className="mt-2 flex flex-wrap gap-2"
        >
          {GEAR_TYPES.map((opt) => {
            const selected = gearType === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onGearTypeChange(opt)}
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
