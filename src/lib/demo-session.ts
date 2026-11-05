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
