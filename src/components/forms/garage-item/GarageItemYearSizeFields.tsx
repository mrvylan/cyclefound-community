"use client";

import { garageItemField, garageItemLabel } from "./formStyles";

type Props = {
  year: string;
  onYearChange: (v: string) => void;
  size: string;
  onSizeChange: (v: string) => void;
  showSize: boolean;
  hidden?: boolean;
};

/** Year + optional size — grid cells for the What it is section. */
export function GarageItemYearSizeFields({
  year,
  onYearChange,
  size,
  onSizeChange,
  showSize,
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;
  const field = garageItemField;

  return (
    <>
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
    </>
  );
}
