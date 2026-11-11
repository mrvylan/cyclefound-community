"use client";

import Link from "next/link";
import type { GarageItem } from "@/lib/data/seed";
import { PlaceholderPhoto } from "@/components/ui";

type Props = {
  parts: GarageItem[];
  isOwner?: boolean;
};

/**
 * Parts installed on a bike — shown on the bike detail page.
 */
export function InstalledPartsSection({ parts, isOwner = false }: Props) {
  if (!parts.length) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="section-title mb-2 mt-0 text-[20px]">Installed parts</h2>
        <p className="m-0 text-[14px] text-muted-2">
          {isOwner
            ? "No parts linked to this bike yet. When you add a part, choose “Installed on a bike”."
            : "No installed parts listed for this bike."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="section-title mb-1 mt-0 text-[20px]">Installed parts</h2>
      <p className="mb-4 mt-0 text-[14px] text-muted-2">
        Parts documented as installed on this bike.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {parts.map((part) => {
          const thumb = part.photo;
          return (
            <li key={part.id}>
              <Link
                href={`/i/${part.id}`}
                className="flex items-center gap-3 rounded-[12px] border border-line bg-white p-2.5 text-ink no-underline hover:border-ink hover:text-ink"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <PlaceholderPhoto className="size-14 shrink-0 rounded-lg" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {part.name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[12px] text-muted">
                    {part.catShort}
                    {part.cond && part.cond !== "—" ? ` · ${part.cond}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
