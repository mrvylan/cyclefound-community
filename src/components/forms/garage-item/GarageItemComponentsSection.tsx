"use client";

import { BikeComponentsEditor } from "@/components/forms/BikeComponentsEditor";
import type { BikeComponent } from "@/lib/garage/bike-components";
import type { ItemCategory } from "@/lib/data/categories";
import type { Discipline } from "@/lib/garage/disciplines";

type Props = {
  value: BikeComponent[];
  onChange: (next: BikeComponent[]) => void;
  discipline: Discipline | "";
  category: ItemCategory;
  hidden?: boolean;
};

export function GarageItemComponentsSection({
  value,
  onChange,
  discipline,
  category,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <section className="flex flex-col gap-4">
      <BikeComponentsEditor
        value={value}
        onChange={onChange}
        discipline={discipline}
        category={category}
      />
    </section>
  );
}
