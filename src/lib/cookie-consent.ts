export type AnalyticsPreference = "granted" | "denied";

export const COOKIE_CONSENT_KEY = "cf_analytics_consent";

export function readAnalyticsPreference(): AnalyticsPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw === "granted" || raw === "denied") return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeAnalyticsPreference(value: AnalyticsPreference) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("cf:analytics-preference", { detail: { value } }),
  );
}

/** Honor Global Privacy Control when present (matches cyclefound.com Privacy Policy). */
export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean(
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl,
  );
}

export function effectiveAnalyticsAllowed(
  preference: AnalyticsPreference | null,
): boolean {
  if (hasGlobalPrivacyControl()) return false;
  return preference === "granted";
}

export const COOKIE_SETTINGS_EVENT = "cf:open-cookie-settings";

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
