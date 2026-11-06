"use client";

import { useEffect, useState } from "react";
import { getMergedPerson, subscribeStore } from "@/lib/data/local-store";

type Identity = {
  name: string;
  init: string;
  bg: string;
  avatarUrl?: string;
};

/** Overlays local profile patches (display name + photo) on the profile hero. */
export function ProfileIdentity({
  handle,
  fallback,
}: {
  handle: string;
  fallback: Identity;
}) {
  const [identity, setIdentity] = useState<Identity>(fallback);

  useEffect(() => {
    function sync() {
      const merged = getMergedPerson(handle);
      if (!merged) return;
      setIdentity({
        name: merged.name,
        init: merged.init,
        bg: merged.bg,
        avatarUrl: merged.avatarUrl,
      });
    }
    sync();
    return subscribeStore(sync);
  }, [handle]);

  if (identity.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={identity.avatarUrl}
        alt=""
        width={148}
        height={148}
        className="-mt-[74px] size-[148px] shrink-0 rounded-full border-[6px] border-ink object-cover"
      />
    );
  }

  return (
    <span
      className="font-display -mt-[74px] inline-flex size-[148px] shrink-0 items-center justify-center rounded-full border-[6px] border-ink text-[52px] text-white"
      style={{ background: identity.bg }}
      aria-hidden
    >
      {identity.init}
    </span>
  );
}

export function ProfileDisplayName({
  handle,
  fallback,
  className,
}: {
  handle: string;
  fallback: string;
  className?: string;
}) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    function sync() {
      const merged = getMergedPerson(handle);
      if (merged?.name) setName(merged.name);
    }
    sync();
    return subscribeStore(sync);
  }, [handle]);

  return <h1 className={className}>{name}</h1>;
}
