"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  blurb?: string;
  hidden?: boolean;
  children: ReactNode;
};

/**
 * Outer “What it is” section shell — keeps one section + grid so spacing matches
 * the original form when Identity / Category / Year / Condition fields compose inside.
 */
export function GarageItemWhatItIsSection({
  title = "What it is",
  blurb = "How it should appear in your garage.",
  hidden = false,
  children,
}: Props) {
  if (hidden) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="section-title m-0 text-[20px]">{title}</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">{blurb}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
