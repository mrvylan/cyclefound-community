"use client";

import { useEffect, useState } from "react";
import {
  getFoundingAssignedCount,
  hydrateCommunityDirectory,
  isCommunityDirectoryReady,
} from "@/lib/community/directory-cache";
import {
  FOUNDING_MEMBER_CAP,
  foundingSpotsLeft,
} from "@/lib/community/memberDisplay";

/** Shows remaining founding spots while under the cap. */
export function HomeFoundingSpots() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    function sync() {
      if (!isCommunityDirectoryReady()) return;
      setLeft(foundingSpotsLeft(getFoundingAssignedCount()));
    }
    void hydrateCommunityDirectory().then(sync);
    sync();
    // directory-cache notifies via cf-store
    const onStore = () => sync();
    window.addEventListener("cf-store", onStore);
    return () => window.removeEventListener("cf-store", onStore);
  }, []);

  if (left == null || left <= 0) return null;

  return (
    <p className="m-0 text-center font-mono text-[12px] tracking-wide text-meta uppercase">
      {left} of {FOUNDING_MEMBER_CAP} founding spots left
    </p>
  );
}
