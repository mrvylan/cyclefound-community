"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { getDirectoryHandleForUserId } from "@/lib/community/directory-cache";
import { handlePublicLabel } from "@/lib/community/handleRules";
import { profileService } from "@/lib/profile/profileService";
import {
  getGarageCoverItemId,
  getSessionHandle,
  migrateSessionHandle,
  saveProfilePatch,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

/**
 * Keep the local session handle aligned with profiles.handle.
 * Public label is always @handle — never full_name / display_name.
 */
export function AuthSessionSync() {
  const { ready, profile, user, handleResolved } = useAuth();

  useEffect(() => {
    if (!ready || !handleResolved) return;

    let cancelled = false;

    function apply(handle: string, avatarUrl = "", garageCoverItemId = "") {
      if (cancelled) return;
      if (!profile || !handle) {
        if (!profile && getSessionHandle()) setSessionHandle("");
        return;
      }
      const prev = getSessionHandle();
      if (prev !== handle) {
        if (prev) migrateSessionHandle(prev, handle);
        else setSessionHandle(handle);
      }

      const cover =
        garageCoverItemId || getGarageCoverItemId(handle) || undefined;

      saveProfilePatch(handle, {
        name: handlePublicLabel(handle),
        claimedHandle: handle,
        bg: profile.avatarColor,
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(cover ? { garageCoverItemId: cover } : {}),
      });
    }

    async function loadRemote() {
      if (!profile) {
        apply("");
        return;
      }
      const coverFromMeta = String(
        user?.user_metadata?.garage_cover_item_id || "",
      ).trim();
      try {
        const row = await profileService.getMyProfile();
        if (cancelled) return;
        const handle =
          String(row?.handle || profile.handle || "").trim().toLowerCase() ||
          getDirectoryHandleForUserId(profile.id) ||
          "";
        apply(handle, row?.avatarUrl || profile.avatarUrl || "", coverFromMeta);
      } catch {
        if (!cancelled) {
          const handle =
            profile.handle || getDirectoryHandleForUserId(profile.id) || "";
          apply(handle, profile.avatarUrl || "", coverFromMeta);
        }
      }
    }

    void loadRemote();

    return subscribeStore(() => {
      if (cancelled || !profile) return;
      const fromDir = getDirectoryHandleForUserId(profile.id);
      if (!fromDir) return;
      const prev = getSessionHandle();
      if (prev !== fromDir) migrateSessionHandle(prev || fromDir, fromDir);
    });
  }, [ready, handleResolved, profile, user]);

  return null;
}
