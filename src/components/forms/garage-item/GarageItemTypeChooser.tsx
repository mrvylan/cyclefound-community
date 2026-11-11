"use client";

import Link from "next/link";
import { Bike, Package, Shirt } from "lucide-react";
import { garageNewHref, type GarageItemType } from "@/lib/garage/item-types";

const OPTIONS: {
  type: GarageItemType;
  title: string;
  blurb: string;
  icon: typeof Bike;
}[] = [
  {
    type: "bike",
    title: "Bike",
    blurb: "Complete bikes or framesets / builds",
    icon: Bike,
  },
  {
    type: "part",
    title: "Parts & wheels",
    blurb: "Components, groupsets, wheelsets",
    icon: Package,
  },
  {
    type: "gear",
    title: "Gear",
    blurb: "Accessories, tools, apparel, other",
    icon: Shirt,
  },
];

type Props = {
  status?: string | null;
  /** Compact layout inside a modal / bottom sheet. */
  compact?: boolean;
  /** Called after a type (or photo) link is activated — close dialog. */
  onNavigate?: () => void;
};

/**
 * Three type cards + secondary photo link.
 * Used as the /garage/new page chooser and inside AddToGarageChooserDialog.
 */
export function GarageItemTypeChooser({ status, compact = false, onNavigate }: Props) {
  return (
    <div className={compact ? "" : "mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8"}>
      {compact ? (
        <p className="mb-4 m-0 text-[14px] leading-[1.5] text-muted-2">
          Choose what you’re documenting — bikes, parts, or gear.
        </p>
      ) : (
        <div className="mb-8">
          <p className="eyebrow m-0">Your garage</p>
          <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">Add to garage</h1>
          <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
            Choose what you’re documenting. You’ll get the right fields for bikes, parts, or
            gear — or start from a photo if you’re not sure.
          </p>
        </div>
      )}

      <ul
        className={
          compact
            ? "m-0 grid list-none grid-cols-1 gap-2.5 p-0"
            : "m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3"
        }
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <li key={opt.type}>
              <Link
                href={garageNewHref({ type: opt.type, status })}
                onClick={onNavigate}
                className="flex min-h-[6.5rem] flex-col gap-2 rounded-[14px] border border-line bg-surface p-5 text-ink no-underline transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-ground text-ink">
                  <Icon className="size-5" aria-hidden strokeWidth={1.75} />
                </span>
                <span className="text-[17px] font-semibold">{opt.title}</span>
                <span className="text-[14px] leading-snug text-muted-2">{opt.blurb}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className={`m-0 ${compact ? "mt-4 text-center" : "mt-5 text-center sm:text-left"}`}>
        <Link
          href={garageNewHref({ photo: true, status })}
          onClick={onNavigate}
          className="text-[14px] font-semibold text-accent-hover no-underline hover:underline"
        >
          Not sure? Start with a photo
        </Link>
      </p>
    </div>
  );
}
