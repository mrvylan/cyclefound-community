"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { getDirectoryHandleForUserId } from "@/lib/community/directory-cache";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { profileService } from "@/lib/profile/profileService";
import {
  getGarageCoverItemId,
  getSessionHandle,
  migrateSessionHandle,
  saveProfilePatch,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

function canonicalHandle(userId: string, displayName: string) {
  // Directory handle wins once hydrated — keeps slug drift from creating a second "You" card.
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
  const { ready, profile, user } = useAuth();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let displayName = profile
      ? profile.displayName || profile.fullName || profile.email.split("@")[0] || ""
      : "";

    function apply(avatarUrl = "", garageCoverItemId = "") {
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

      // Don't clobber a local cover choice with empty remote metadata.
      const cover =
        garageCoverItemId || getGarageCoverItemId(next) || undefined;

      saveProfilePatch(next, {
        name,
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(cover ? { garageCoverItemId: cover } : {}),
      });
    }

    async function loadRemote() {
      if (!profile) {
        apply();
        return;
      }
      const coverFromMeta = String(
        user?.user_metadata?.garage_cover_item_id || "",
      ).trim();
      try {
        const row = await profileService.getMyProfile();
        if (cancelled) return;
        if (row?.displayName) displayName = row.displayName;
        else if (row?.fullName) displayName = row.fullName;
        apply(row?.avatarUrl || profile.avatarUrl || "", coverFromMeta);
      } catch {
        if (!cancelled) apply(profile.avatarUrl || "", coverFromMeta);
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
  }, [ready, profile, user]);

  return null;
}
