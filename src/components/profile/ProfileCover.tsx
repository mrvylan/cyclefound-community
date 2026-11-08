"use client";

import { useEffect, useState } from "react";
import { resolvePerson, subscribeStore } from "@/lib/data/local-store";
import { seedGarageCover } from "@/lib/data/seed";

export function ProfileCover({
  handle,
  fallbackLabel,
}: {
  handle: string;
  fallbackLabel: string;
}) {
  const [coverUrl, setCoverUrl] = useState<string | undefined>();

  useEffect(() => {
    function sync() {
      setCoverUrl(resolvePerson(handle)?.coverUrl);
    }
    sync();
    return subscribeStore(sync);
  }, [handle]);

  const src = coverUrl || seedGarageCover;

  return (
    <div className="relative h-[200px] w-full overflow-hidden bg-ink-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
      {!coverUrl ? (
        <span className="absolute bottom-3 left-3 rounded-md bg-white/95 px-2 py-1 font-mono text-[12px] text-ink">
          {fallbackLabel}
        </span>
      ) : null}
    </div>
  );
}
