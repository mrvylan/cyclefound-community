"use client";

import {
  sizeLabelForPartType,
  sizePlaceholderForPartType,
  type PartType,
} from "@/lib/garage/part-types";
import { garageItemField, garageItemLabel } from "./formStyles";

export type PartCompatibility = {
  speeds: string;
  mount: string;
  axle: string;
};

type Props = {
  partType: PartType | "";
  year: string;
  onYearChange: (v: string) => void;
  sizeSpec: string;
  onSizeSpecChange: (v: string) => void;
  compatibility: PartCompatibility;
  onCompatibilityChange: (v: PartCompatibility) => void;
  hidden?: boolean;
};

/** Year + dynamic size/spec + optional compatibility row for parts. */
export function GarageItemPartSpecFields({
  partType,
  year,
  onYearChange,
  sizeSpec,
  onSizeSpecChange,
  compatibility,
  onCompatibilityChange,
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;
  const field = garageItemField;
  const sizeLabel = sizeLabelForPartType(partType);

  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="part-year" className={label}>
          Year <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="part-year"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          placeholder="e.g. 2019"
          inputMode="numeric"
          autoComplete="off"
          className={`${field} placeholder:text-meta`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="part-size-spec" className={label}>
          {sizeLabel} <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="part-size-spec"
          value={sizeSpec}
          onChange={(e) => onSizeSpecChange(e.target.value)}
          placeholder={sizePlaceholderForPartType(partType)}
          autoComplete="off"
          className={`${field} placeholder:text-meta`}
        />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <p className={`${label} m-0`}>
          Compatibility <span className="font-normal text-muted">(optional)</span>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="part-speeds" className="text-[12px] font-medium text-muted-2">
              Speeds
            </label>
            <input
              id="part-speeds"
              value={compatibility.speeds}
              onChange={(e) =>
                onCompatibilityChange({ ...compatibility, speeds: e.target.value })
              }
              placeholder="e.g. 11-speed"
              className={`${field} placeholder:text-meta`}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="part-mount" className="text-[12px] font-medium text-muted-2">
              Standard / mount
            </label>
            <input
              id="part-mount"
              value={compatibility.mount}
              onChange={(e) =>
                onCompatibilityChange({ ...compatibility, mount: e.target.value })
              }
              placeholder="e.g. Flat mount"
              className={`${field} placeholder:text-meta`}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="part-axle" className="text-[12px] font-medium text-muted-2">
              Axle
            </label>
            <input
              id="part-axle"
              value={compatibility.axle}
              onChange={(e) =>
                onCompatibilityChange({ ...compatibility, axle: e.target.value })
              }
              placeholder="e.g. 12×142"
              className={`${field} placeholder:text-meta`}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </>
  );
}
