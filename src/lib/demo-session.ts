import type { AuthProfile } from "@/lib/auth/user";
import { communityHandleFromProfile } from "@/lib/community/handles";

/**
 * Demo session / mock actors are retired. Always use the signed-in user.
 * Opt in only with an explicit NEXT_PUBLIC_DEMO_SESSION=1 for emergency debugging.
 */
export function isDemoSessionEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_SESSION?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

/** Insert Mock Data control — permanently hidden. */
export function showMockDataControls(): boolean {
  return false;
}

/**
 * Actor switcher (“Posting as”) — admin only via explicit env flag.
 */
export function canUseAdminSessionSwitch(): boolean {
  const v = process.env.NEXT_PUBLIC_ADMIN_SESSION_SWITCH?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

/** Stable local-store handle when posting as a real Supabase user. */
export function handleFromAuthProfile(profile: AuthProfile): string {
  const name = profile.displayName || profile.fullName || profile.email.split("@")[0] || "";
  return communityHandleFromProfile(profile.id, name);
}
