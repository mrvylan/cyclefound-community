"use client";

import Link from "next/link";
import { Bike, Package, Shirt, Sparkles } from "lucide-react";
import { garageNewHref, type GarageItemType } from "@/lib/garage/item-types";

const OPTIONS: {
  type: GarageItemType | "photo";
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
  {
    type: "photo",
    title: "Not sure? Start with a photo",
    blurb: "AI suggests a type — you confirm before continuing",
    icon: Sparkles,
  },
];

type Props = {
  status?: string | null;
};

export function GarageItemTypeChooser({ status }: Props) {
  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 pb-8 sm:px-8">
      <div className="mb-8">
        <p className="eyebrow m-0">Your garage</p>
        <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">Add to garage</h1>
        <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
          Choose what you’re documenting. You’ll get the right fields for bikes, parts, or
          gear — or start from a photo if you’re not sure.
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const href =
            opt.type === "photo"
              ? garageNewHref({ photo: true, status })
              : garageNewHref({ type: opt.type, status });
          return (
            <li key={opt.type}>
              <Link
                href={href}
                className="flex min-h-[7.5rem] flex-col gap-2 rounded-[14px] border border-line bg-surface p-5 text-ink no-underline hover:border-ink"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-ground text-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-[17px] font-semibold">{opt.title}</span>
                <span className="text-[14px] leading-snug text-muted-2">{opt.blurb}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
