"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { isDemoSessionEnabled } from "@/lib/demo-session";
import { profileService } from "@/lib/profile/profileService";
import {
  getSessionHandle,
  isDefaultSeedHandle,
  isMockDataEnabled,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";

/**
 * Keep the local session handle aligned with auth when mock/demo actor switching
 * is not in play. Handle matches the public Supabase directory.
 */
export function AuthSessionSync() {
  const { ready, profile } = useAuth();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function sync() {
      if (profile) {
        let name = profile.displayName || profile.fullName || profile.email.split("@")[0] || "";
        let avatarUrl = profile.avatarUrl || "";
        try {
          const row = await profileService.getMyProfile();
          if (row?.displayName) name = row.displayName;
          if (row?.avatarUrl) avatarUrl = row.avatarUrl;
          if (row && !name) name = row.fullName || name;
        } catch {
          /* directory still works from auth metadata */
        }
        if (cancelled) return;

        const next = communityHandleFromProfile(profile.id, name);
        saveProfilePatch(next, {
          name,
          ...(avatarUrl ? { avatarUrl } : {}),
        });

        const demo = isDemoSessionEnabled();
        const current = getSessionHandle();
        if (demo && (isMockDataEnabled() || isDefaultSeedHandle(current))) {
          if (!current) setSessionHandle(next);
          return;
        }

        if (current !== next) setSessionHandle(next);
        return;
      }

      if (!isMockDataEnabled() && getSessionHandle()) {
        setSessionHandle("");
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [ready, profile]);

  return null;
}
