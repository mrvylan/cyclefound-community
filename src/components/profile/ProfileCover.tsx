"use client";

import { useEffect, useState } from "react";
import { PlaceholderPhoto } from "@/components/ui";
import { resolvePerson, subscribeStore } from "@/lib/data/local-store";

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

  if (coverUrl) {
    return (
      <div className="relative h-[200px] w-full overflow-hidden bg-ink-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <PlaceholderPhoto dark label={fallbackLabel} className="h-[200px] justify-end" />
  );
}
