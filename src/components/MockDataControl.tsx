"use client";

import { useEffect, useState } from "react";
import {
  clearMockData,
  insertMockData,
  isMockDataEnabled,
  subscribeStore,
} from "@/lib/data/local-store";
import { showMockDataControls } from "@/lib/demo-session";
import { ensureDemoNotifications } from "@/lib/notifications/store";

/** Load or clear seed/mock community data for UI demos (demo/env gated). */
export function MockDataControl({
  variant = "header",
}: {
  variant?: "header" | "banner";
}) {
  // Env-based — safe on first paint (avoids banner pill pop-in after mount).
  const visible = showMockDataControls();
  // localStorage — wait until mount so SSR/client HTML matches.
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isMockDataEnabled());
    setReady(true);
    return subscribeStore(() => setEnabled(isMockDataEnabled()));
  }, []);

  if (!visible) return null;

  const className =
    variant === "banner"
      ? "inline-flex h-8 shrink-0 items-center rounded-[8px] border border-accent-soft-border bg-white px-2.5 text-[12px] font-semibold text-ink hover:bg-ground"
      : "hidden h-[42px] shrink-0 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground sm:inline-flex";

  // Reserve the same footprint before localStorage is known — no layout jump / flash.
  if (!ready) {
    return (
      <span className={`${className} pointer-events-none invisible`} aria-hidden>
        Clear mock data
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (enabled) clearMockData();
        else {
          insertMockData();
          ensureDemoNotifications();
        }
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
