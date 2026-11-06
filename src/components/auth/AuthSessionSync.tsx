"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { handleFromAuthProfile } from "@/lib/demo-session";
import {
  getSessionHandle,
  isMockDataEnabled,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";

/**
 * Keep the local session handle aligned with auth when mock data is off.
 * Logged-out + no mock → no session (no profiles in directories).
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
      if (getSessionHandle() !== next) setSessionHandle(next);
      return;
    }

    if (!isMockDataEnabled() && getSessionHandle()) {
      setSessionHandle("");
    }
  }, [ready, profile]);

  return null;
}
