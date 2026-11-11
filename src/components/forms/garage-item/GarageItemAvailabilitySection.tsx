"use client";

import type { ItemStatus } from "@/lib/data/seed";
import { descriptionPriceMismatch } from "@/lib/garage/itemFields";
import { garageItemField, garageItemLabel } from "./formStyles";

const STATUSES: ItemStatus[] = [
  "Not for sale",
  "Open to offers",
  "For sale",
  "Trade only",
];

type Props = {
  status: ItemStatus;
  onStatusChange: (v: ItemStatus) => void;
  askingPrice: string;
  onAskingPriceChange: (v: string) => void;
  showPrice: boolean;
  photosCount: number;
  description: string;
};

export function GarageItemAvailabilitySection({
  status,
  onStatusChange,
  askingPrice,
  onAskingPriceChange,
  showPrice,
  photosCount,
  description,
}: Props) {
  const label = garageItemLabel;
  const field = garageItemField;

  return (
    <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
      <div>
        <h2 className="m-0 text-[15px] font-bold">Availability</h2>
        <p className="mt-1 m-0 text-[13px] text-muted-2">
          Defaults to in your garage only. Change this if someone could ask about buying or
          trading it.
        </p>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="sr-only">Status</legend>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {STATUSES.map((s) => (
            <label
              key={s}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border px-3 text-center text-[13px] font-medium sm:text-[14px] ${
                status === s
                  ? "border-ink bg-ink text-white"
                  : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => onStatusChange(s)}
                className="sr-only"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      {showPrice ? (
        <div className="flex max-w-xs flex-col gap-2">
          <label htmlFor="item-ask" className={label}>
            Asking price <span className="font-normal text-muted">(required)</span>
          </label>
          <input
            id="item-ask"
            value={askingPrice}
            onChange={(e) => onAskingPriceChange(e.target.value)}
            placeholder="$3,000"
            required
            className={field}
          />
          {!photosCount ? (
            <p className="m-0 text-[13px] text-[#9B2C2C]">
              Add at least one photo to list {status}.
            </p>
          ) : null}
          {descriptionPriceMismatch(description, askingPrice) != null ? (
            <p className="m-0 text-[13px] text-[#9B2C2C]">
              Description quotes a different dollar amount — keep price only in Asking.
            </p>
          ) : (
            <p className="m-0 text-[12px] text-meta">
              Keep the price here, not in the description. Photo + asking price required
              for {status}.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
