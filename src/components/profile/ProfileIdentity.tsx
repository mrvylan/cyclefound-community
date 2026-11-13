"use client";

import { useEffect, useState } from "react";
import { MemberAvatar } from "@/components/ui";
import {
  getMemberName,
  getMemberSecondary,
} from "@/lib/community/memberDisplay";
import { resolvePerson, subscribeStore } from "@/lib/data/local-store";

type Identity = {
  name: string;
  init: string;
  bg: string;
  avatarUrl?: string;
  displayName?: string;
  userId?: string;
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
      const merged = resolvePerson(handle);
      if (!merged) return;
      setIdentity({
        name: merged.name,
        init: merged.init,
        bg: merged.bg,
        avatarUrl: merged.avatarUrl,
        displayName: merged.displayName,
        userId: merged.userId,
      });
    }
    sync();
    return subscribeStore(sync);
  }, [handle]);

  /* ~5% of 148px circle overlaps the cover (~7–8px). */
  return (
    <span className="-mt-2 inline-flex shrink-0 rounded-full border-[6px] border-ink">
      <MemberAvatar
        userId={identity.userId}
        handle={handle}
        displayName={identity.displayName}
        name={identity.name}
        src={identity.avatarUrl}
        size={148}
        label={getMemberName({
          displayName: identity.displayName,
          handle,
          name: identity.name,
        })}
      />
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
  const [secondary, setSecondary] = useState("");

  useEffect(() => {
    function sync() {
      const merged = resolvePerson(handle);
      if (!merged) return;
      setName(
        getMemberName({
          displayName: merged.displayName,
          handle: merged.publicHandle || merged.handle,
          name: merged.name,
        }) || fallback,
      );
      setSecondary(
        getMemberSecondary({
          displayName: merged.displayName,
          handle: merged.publicHandle || merged.handle,
          loc: merged.loc,
        }),
      );
    }
    sync();
    return subscribeStore(sync);
  }, [handle, fallback]);

  return (
    <div>
      <h1 className={className}>{name}</h1>
      {secondary ? (
        <p className="m-0 mt-1 text-[14px] text-on-dark-muted">{secondary}</p>
      ) : null}
    </div>
  );
}
