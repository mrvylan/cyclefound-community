"use client";

import { useEffect, useState } from "react";
import {
  clearMockData,
  insertMockData,
  isMockDataEnabled,
  subscribeStore,
} from "@/lib/data/local-store";

/** Load or clear seed/mock community data for UI demos. */
export function MockDataControl({
  variant = "header",
}: {
  variant?: "header" | "banner";
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isMockDataEnabled());
    return subscribeStore(() => setEnabled(isMockDataEnabled()));
  }, []);

  const className =
    variant === "banner"
      ? "inline-flex h-8 shrink-0 items-center rounded-[8px] border border-accent-soft-border bg-white px-2.5 text-[12px] font-semibold text-ink hover:bg-ground"
      : "hidden h-[42px] shrink-0 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground sm:inline-flex";

  return (
    <button
      type="button"
      onClick={() => {
        if (enabled) clearMockData();
        else insertMockData();
      }}
      className={className}
      title={
        enabled
          ? "Hide seed members, questions, and garage items"
          : "Load seed members, questions, and garage items for demos"
      }
    >
      {enabled ? "Clear mock data" : "Insert Mock Data"}
    </button>
  );
}
