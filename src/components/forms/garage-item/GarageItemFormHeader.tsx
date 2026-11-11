"use client";

import Link from "next/link";

type Props = {
  eyebrow?: string;
  title?: string;
  blurb?: string;
  needsAuth?: boolean;
  joinHref?: string;
};

/** Page chrome above the Add form — copy matches the original ItemNewForm header. */
export function GarageItemFormHeader({
  eyebrow = "Your garage",
  title = "Add to garage",
  blurb = "Photos, identity, and history for what you own. Availability is optional — this is not a marketplace listing wizard.",
  needsAuth = false,
  joinHref = "/auth?mode=join&next=/item/new",
}: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="eyebrow m-0">{eyebrow}</p>
        <h1 className="section-title m-0 text-[clamp(32px,6vw,48px)]">{title}</h1>
        <p className="mt-2 m-0 max-w-[40rem] text-[15px] leading-[1.5] text-muted-2">
          {blurb}
        </p>
      </div>
      {needsAuth ? (
        <p className="m-0 max-w-[18rem] rounded-[10px] border border-line bg-ground px-3 py-2 text-[13px] text-muted-2 sm:text-right">
          Join to save to your garage — draft is kept.{" "}
          <Link href={joinHref} className="font-semibold text-accent">
            Join
          </Link>
        </p>
      ) : null}
    </div>
  );
}
