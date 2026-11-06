"use client";

import { useEffect, useState } from "react";
import {
  clearMockData,
  insertMockData,
  isMockDataEnabled,
  subscribeStore,
} from "@/lib/data/local-store";

/** Header control to load or clear seed/mock community data for UI demos. */
export function MockDataControl() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isMockDataEnabled());
    return subscribeStore(() => setEnabled(isMockDataEnabled()));
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (enabled) clearMockData();
        else insertMockData();
      }}
      className="hidden h-[42px] shrink-0 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground sm:inline-flex"
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
