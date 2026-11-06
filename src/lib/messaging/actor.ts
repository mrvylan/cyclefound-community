import type { User } from "@supabase/supabase-js";
import type { AuthProfile } from "@/lib/auth/user";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { getMergedPerson } from "@/lib/data/local-store";
import type { GarageActor } from "./garageMessagingService";

/**
 * Build the messaging actor from auth + local session handle.
 * In demo mode, switching SessionPicker to another default-seed member uses a
 * distinct handle-based id so threads between Dylan and the mock partner stay clean.
 */
export function buildGarageActor(
  user: User | null,
  profile: AuthProfile | null,
  sessionHandle: string,
): GarageActor | null {
  if (user && profile) {
    const authHandle = handleFromAuthProfile(profile);
    if (sessionHandle && sessionHandle !== authHandle) {
      const person = getMergedPerson(sessionHandle);
      return {
        id: `handle:${sessionHandle}`,
        name: person?.name || sessionHandle,
        handle: sessionHandle,
        emailVerified: true,
      };
    }
    return {
      id: user.id,
      name: profile.displayName,
      handle: sessionHandle || authHandle,
      emailVerified: Boolean(user.email_confirmed_at),
    };
  }
  if (sessionHandle) {
    const person = getMergedPerson(sessionHandle);
    return {
      id: `handle:${sessionHandle}`,
      name: person?.name || sessionHandle,
      handle: sessionHandle,
      emailVerified: true,
    };
  }
  return null;
}
