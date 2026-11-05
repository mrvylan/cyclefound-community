/** Soft client-side gate — not real security; password is visible in the bundle. */

export const SITE_GATE_STORAGE_KEY = "cf_prealpha_unlocked";

export function getSiteGatePassword(): string {
  return (process.env.NEXT_PUBLIC_SITE_GATE_PASSWORD || "").trim();
}

/** Gate is on when a password is configured (set on Vercel for the public demo). */
export function isSiteGateEnabled(): boolean {
  const forced = process.env.NEXT_PUBLIC_SITE_GATE?.trim().toLowerCase();
  if (forced === "0" || forced === "false" || forced === "off") return false;
  if (forced === "1" || forced === "true" || forced === "on") {
    return Boolean(getSiteGatePassword());
  }
  return Boolean(getSiteGatePassword());
}
