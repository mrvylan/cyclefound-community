"use client";

import { garageItemField, garageItemLabel } from "./formStyles";

type Props = {
  quantity: string;
  onQuantityChange: (v: string) => void;
  hidden?: boolean;
};

export function GarageItemQuantityField({
  quantity,
  onQuantityChange,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="part-quantity" className={garageItemLabel}>
        Quantity
      </label>
      <input
        id="part-quantity"
        type="number"
        min={1}
        step={1}
        value={quantity}
        onChange={(e) => onQuantityChange(e.target.value)}
        className={garageItemField}
      />
    </div>
  );
}
