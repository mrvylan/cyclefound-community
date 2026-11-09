"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { getDirectoryHandleForUserId } from "@/lib/community/directory-cache";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { profileService } from "@/lib/profile/profileService";
import {
  getSessionHandle,
  migrateSessionHandle,
  saveProfilePatch,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

function canonicalHandle(userId: string, displayName: string) {
  return (
    getDirectoryHandleForUserId(userId) ||
    communityHandleFromProfile(userId, displayName)
  );
}

/**
 * Keep the local session handle aligned with the signed-in Supabase user.
 * Prefer the community directory handle for this user id so garage cards
 * don't split into a "You" stub + a separate marketplace row.
 */
export function AuthSessionSync() {
  const { ready, profile } = useAuth();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let displayName = profile
      ? profile.displayName || profile.fullName || profile.email.split("@")[0] || ""
      : "";

    function apply(avatarUrl = "") {
      if (cancelled) return;
      if (!profile) {
        if (getSessionHandle()) setSessionHandle("");
        return;
      }
      const name =
        displayName ||
        profile.displayName ||
        profile.fullName ||
        profile.email.split("@")[0] ||
        "";
      const next = canonicalHandle(profile.id, name);
      const prev = getSessionHandle();

      if (prev !== next) {
        if (prev) migrateSessionHandle(prev, next);
        else setSessionHandle(next);
      }

      saveProfilePatch(next, {
        name,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
    }

    async function loadRemote() {
      if (!profile) {
        apply();
        return;
      }
      try {
        const row = await profileService.getMyProfile();
        if (cancelled) return;
        if (row?.displayName) displayName = row.displayName;
        else if (row?.fullName) displayName = row.fullName;
        apply(row?.avatarUrl || profile.avatarUrl || "");
      } catch {
        if (!cancelled) apply(profile.avatarUrl || "");
      }
    }

    void loadRemote();

    // When directory hydrates, rematch session handle to the directory row for this user.
    return subscribeStore(() => {
      if (cancelled || !profile) return;
      const fromDir = getDirectoryHandleForUserId(profile.id);
      if (!fromDir) return;
      const prev = getSessionHandle();
      if (prev !== fromDir) migrateSessionHandle(prev || fromDir, fromDir);
    });
  }, [ready, profile]);

  return null;
}
