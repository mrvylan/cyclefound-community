"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { profileService } from "@/lib/profile/profileService";
import {
  getSessionHandle,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";

/**
 * Keep the local session handle aligned with the signed-in Supabase user.
 * Handle matches the public community directory.
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

        if (getSessionHandle() !== next) setSessionHandle(next);
        return;
      }

      if (getSessionHandle()) setSessionHandle("");
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [ready, profile]);

  return null;
}
