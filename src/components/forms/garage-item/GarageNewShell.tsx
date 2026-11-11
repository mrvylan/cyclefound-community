"use client";

import { useSearchParams } from "next/navigation";
import { ItemNewForm } from "@/components/forms/ItemNewForm";
import { GarageItemPhotoFirst } from "./GarageItemPhotoFirst";
import { GarageItemTypeChooser } from "./GarageItemTypeChooser";
import { parseTypeQuery } from "@/lib/garage/item-types";

/**
 * /garage/new shell: chooser → photo-first → typed form.
 */
export function GarageNewShell() {
  const searchParams = useSearchParams();
  const type = parseTypeQuery(searchParams.get("type"));
  const photoFirst = searchParams.get("photo") === "1";
  const status = searchParams.get("status");

  if (photoFirst && !type) {
    return <GarageItemPhotoFirst status={status} />;
  }

  if (!type) {
    return <GarageItemTypeChooser status={status} />;
  }

  return <ItemNewForm key={type} itemType={type} />;
}
