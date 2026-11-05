"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWantedLines, subscribeStore } from "@/lib/data/local-store";

export function WantedList({ handle }: { handle: string }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    setLines(getWantedLines(handle));
    return subscribeStore(() => setLines(getWantedLines(handle)));
  }, [handle]);

  return (
    <section className="rounded-2xl border border-accent-soft-border bg-accent-soft p-[22px]">
      <h2 className="font-display mb-1 mt-0 text-[22px]">Wanted</h2>
      <p className="mb-3 mt-0 text-[13px] text-[#3d5f24]">
        Plain-text parts this member is looking for.
      </p>
      {lines.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {lines.map((line) => (
            <li
              key={line}
              className="rounded-[10px] border border-accent-soft-border bg-white px-3.5 py-3 text-[14px] leading-snug text-ink"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[14px] text-muted-2">
          Nothing on the wanted list yet.{" "}
          <Link href="/settings/profile" className="font-semibold">
            Edit profile
          </Link>
        </p>
      )}
    </section>
  );
}
