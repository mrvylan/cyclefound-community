"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { handleFromAuthProfile, isDemoSessionEnabled } from "@/lib/demo-session";
import {
  getSessionHandle,
  isDefaultSeedHandle,
  isMockDataEnabled,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";

/**
 * Keep the local session handle aligned with auth when mock/demo actor switching
 * is not in play. Logged-out + no mock → no session (no profiles in directories).
 */
export function AuthSessionSync() {
  const { ready, profile } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (profile) {
      const next = handleFromAuthProfile(profile);
      const name = profile.displayName || profile.fullName;
      saveProfilePatch(next, {
        name,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      });

      const demo = isDemoSessionEnabled();
      const current = getSessionHandle();
      if (demo && (isMockDataEnabled() || isDefaultSeedHandle(current))) {
        // Let SessionPicker switch between Dylan and the mock partner for messaging tests.
        if (!current) setSessionHandle(next);
        return;
      }

      if (current !== next) setSessionHandle(next);
      return;
    }

    if (!isMockDataEnabled() && getSessionHandle()) {
      setSessionHandle("");
    }
  }, [ready, profile]);

  return null;
}
