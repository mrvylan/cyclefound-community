"use client";

import { garageItemLabel, garageItemSelectField } from "./formStyles";

export type PartLocationMode = "installed" | "spare";

export type BikeOption = {
  id: string;
  name: string;
};

type Props = {
  mode: PartLocationMode;
  onModeChange: (m: PartLocationMode) => void;
  installedOnBikeId: string;
  onInstalledOnBikeIdChange: (id: string) => void;
  bikes: BikeOption[];
  hidden?: boolean;
};

/** Where is it? — installed on a garage bike, or spare in the parts bin. */
export function GarageItemPartLocationSection({
  mode,
  onModeChange,
  installedOnBikeId,
  onInstalledOnBikeIdChange,
  bikes,
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="section-title m-0 text-[20px]">Where is it?</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">
          Track whether this part is on a bike or waiting in the parts bin.
        </p>
      </div>
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Part location</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "installed"}
            onClick={() => onModeChange("installed")}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-semibold ${
              mode === "installed"
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:border-ink"
            }`}
          >
            Installed on a bike
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "spare"}
            onClick={() => onModeChange("spare")}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-semibold ${
              mode === "spare"
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:border-ink"
            }`}
          >
            Spare (parts bin)
          </button>
        </div>
      </fieldset>

      {mode === "installed" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="part-installed-bike" className={label}>
            Bike
          </label>
          {bikes.length ? (
            <select
              id="part-installed-bike"
              value={installedOnBikeId}
              onChange={(e) => onInstalledOnBikeIdChange(e.target.value)}
              className={garageItemSelectField}
            >
              <option value="">Select a bike…</option>
              {bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="m-0 rounded-[10px] border border-line bg-ground px-3.5 py-3 text-[14px] text-muted-2">
              No bikes in your garage yet — add a bike first, or mark this as spare.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
