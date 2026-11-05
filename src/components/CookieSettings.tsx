"use client";

import { useEffect, useState } from "react";
import {
  COOKIE_SETTINGS_EVENT,
  effectiveAnalyticsAllowed,
  hasGlobalPrivacyControl,
  openCookieSettings,
  readAnalyticsPreference,
  writeAnalyticsPreference,
  type AnalyticsPreference,
} from "@/lib/cookie-consent";
import { LEGAL } from "@/lib/legal";

export { openCookieSettings };

/**
 * Non-blocking cookie / analytics notice (mirrors cyclefound.com Privacy Policy §7).
 * Footer “Cookie settings” reopens this panel.
 */
export function CookieSettings() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<AnalyticsPreference | null>(null);
  const gpc = hasGlobalPrivacyControl();

  useEffect(() => {
    const stored = readAnalyticsPreference();
    setPreference(stored);
    setReady(true);
    // First visit (no choice yet) — show notice unless GPC already opts out.
    if (!stored && !gpc) setOpen(true);
    if (gpc && stored !== "denied") {
      writeAnalyticsPreference("denied");
      setPreference("denied");
    }
  }, [gpc]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  function choose(value: AnalyticsPreference) {
    writeAnalyticsPreference(value);
    setPreference(value);
    setOpen(false);
  }

  if (!ready || !open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-settings-title"
      aria-describedby="cookie-settings-desc"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-5"
    >
      <div className="mx-auto flex max-w-[720px] flex-col gap-3 rounded-[14px] border border-line bg-surface p-4 shadow-[0_-8px_32px_rgba(16,23,27,0.12)] sm:p-5">
        <div className="flex flex-col gap-1.5">
          <h2
            id="cookie-settings-title"
            className="m-0 text-[16px] font-semibold text-ink"
          >
            Cookie settings
          </h2>
          <p
            id="cookie-settings-desc"
            className="m-0 text-[14px] leading-[1.5] text-muted-2"
          >
            We use essential cookies and browser storage for sign-in and Community
            features. Optional analytics (Google Analytics) help us understand usage —
            only if you allow it.{" "}
            <a
              href={LEGAL.privacy}
              className="font-semibold text-accent-hover underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
            {gpc ? (
              <>
                {" "}
                Your browser sent a Global Privacy Control signal, so analytics stay off
                unless you change that below.
              </>
            ) : null}
          </p>
          {preference ? (
            <p className="m-0 font-mono text-[12px] text-muted">
              Current choice: {preference === "granted" ? "analytics on" : "analytics off"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("granted")}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover"
          >
            OK — allow analytics
          </button>
          <button
            type="button"
            onClick={() => choose("denied")}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[14px] font-semibold text-ink"
          >
            Turn off analytics
          </button>
        </div>
      </div>
    </div>
  );
}

/** Loads GA only when consent is granted and a measurement ID is configured. */
export function AnalyticsLoader() {
  const [allowed, setAllowed] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    function sync() {
      setAllowed(
        effectiveAnalyticsAllowed(readAnalyticsPreference()) && Boolean(measurementId),
      );
    }
    sync();
    window.addEventListener("cf:analytics-preference", sync);
    return () => window.removeEventListener("cf:analytics-preference", sync);
  }, [measurementId]);

  useEffect(() => {
    if (!allowed || !measurementId) return;
    if (document.getElementById("cf-ga-script")) return;

    const script = document.createElement("script");
    script.id = "cf-ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.id = "cf-ga-inline";
    inline.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', { anonymize_ip: true });
    `;
    document.head.appendChild(inline);

    return () => {
      document.getElementById("cf-ga-script")?.remove();
      document.getElementById("cf-ga-inline")?.remove();
    };
  }, [allowed, measurementId]);

  return null;
}
