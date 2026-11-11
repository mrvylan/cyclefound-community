"use client";

import Link from "next/link";
import { X } from "lucide-react";
import {
  garageNewHref,
  type GarageItemType,
} from "@/lib/garage/item-types";

const TYPE_LABEL: Record<GarageItemType, string> = {
  bike: "Bike",
  part: "Parts & wheels",
  gear: "Gear",
};

type Props = {
  suggestedType: GarageItemType;
  status?: string | null;
  detail?: string;
  onDismiss: () => void;
};

/**
 * Soft AI hint when photo analysis suggests a different top-level type.
 * Never auto-switches — owner chooses via the link or dismisses.
 */
export function GarageItemAiTypeHint({
  suggestedType,
  status,
  detail,
  onDismiss,
}: Props) {
  const label = TYPE_LABEL[suggestedType];
  const lookLike =
    detail?.trim() ||
    (suggestedType === "bike"
      ? "a bike or frameset"
      : suggestedType === "part"
        ? "a part or wheel"
        : "gear");

  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-3 rounded-[12px] border border-accent-soft-border bg-accent-soft px-4 py-3"
    >
      <p className="m-0 min-w-0 flex-1 text-[14px] leading-snug text-ink">
        This looks like {lookLike}.{" "}
        <Link
          href={garageNewHref({ type: suggestedType, status })}
          className="font-semibold text-accent-hover no-underline hover:underline"
        >
          Switch to {label}?
        </Link>
      </p>
      <button
        type="button"
        aria-label="Dismiss type hint"
        onClick={onDismiss}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] text-ink hover:bg-white/70"
      >
        <X className="size-4" aria-hidden strokeWidth={1.75} />
      </button>
    </div>
  );
}
