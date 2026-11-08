import type { AuthProfile } from "@/lib/auth/user";

/**
 * Option A: one app, two modes.
 * - On (local default / NEXT_PUBLIC_DEMO_SESSION=1): SessionPicker mock actors
 * - Off (production default): signed-in user; no picker
 *
 * Override with NEXT_PUBLIC_DEMO_SESSION=0|1|true|false
 */
export function isDemoSessionEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_SESSION?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  if (v === "1" || v === "true" || v === "on") return true;
  return process.env.NODE_ENV === "development";
}

/**
 * Show Insert Mock Data in the Pre-Alpha banner.
 * Default on for Pre-Alpha (local + community.cyclefound.com). Opt out with
 * NEXT_PUBLIC_SHOW_MOCK_CONTROLS=0 when you no longer want testers seeding mock data.
 */
export function showMockDataControls(): boolean {
  const v = process.env.NEXT_PUBLIC_SHOW_MOCK_CONTROLS?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  if (v === "1" || v === "true" || v === "on") return true;
  return true;
}

/**
 * Actor switcher (“Posting as”) — admin/dev seeding only.
 * Real beta testers must never see the cast switcher.
 * Opt in with NEXT_PUBLIC_ADMIN_SESSION_SWITCH=1 (or mock controls in development).
 */
export function canUseAdminSessionSwitch(): boolean {
  const v = process.env.NEXT_PUBLIC_ADMIN_SESSION_SWITCH?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return process.env.NODE_ENV === "development" && showMockDataControls();
}

/** Stable local-store handle when posting as a real Supabase user. */
export function handleFromAuthProfile(profile: AuthProfile): string {
  const local = profile.email.split("@")[0] || "";
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  if (cleaned) return cleaned;
  return `user_${profile.id.replace(/-/g, "").slice(0, 10)}`;
}
