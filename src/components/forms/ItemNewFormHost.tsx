"use client";

import { useState } from "react";
import { ItemNewForm } from "./ItemNewForm";
import type { GarageItemType } from "@/lib/garage/item-types";

/** Fresh form instance each time you open Add — avoids leftover AI/manual notes. */
export function ItemNewFormHost({ itemType }: { itemType: GarageItemType }) {
  const [mountId] = useState(() => `item-new-${Date.now()}`);
  return <ItemNewForm key={`${mountId}-${itemType}`} itemType={itemType} />;
}
