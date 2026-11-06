"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  handleFromAuthProfile,
  isDemoSessionEnabled,
} from "@/lib/demo-session";
import {
  getSessionHandle,
  isMockDataEnabled,
  listMembers,
  saveProfilePatch,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

/**
 * Demo mode: pick which member you’re acting as (full mock cast, or Dylan ↔ partner).
 * Otherwise sync to the signed-in user (or hide when logged out).
 */
export function SessionPicker({ className = "" }: { className?: string }) {
  const demo = isDemoSessionEnabled();
  const { ready, profile } = useAuth();
  const [handle, setHandle] = useState("");
  const [mock, setMock] = useState(false);
  const [members, setMembers] = useState(listMembers());

  useEffect(() => {
    function syncMembers() {
      setMock(isMockDataEnabled());
      setMembers(listMembers());
      setHandle(getSessionHandle());
    }
    syncMembers();
    return subscribeStore(syncMembers);
  }, []);

  const canSwitchActors = demo && members.length > 1;

  useEffect(() => {
    if (!ready) return;

    if (profile) {
      const next = handleFromAuthProfile(profile);
      const name = profile.displayName || profile.fullName;
      saveProfilePatch(next, {
        name,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      });
    }

    if (canSwitchActors) {
      if (!getSessionHandle() && profile) {
        setSessionHandle(handleFromAuthProfile(profile));
      }
      setHandle(getSessionHandle());
      return;
    }

    if (profile) {
      const next = handleFromAuthProfile(profile);
      if (getSessionHandle() !== next) setSessionHandle(next);
      setHandle(next);
      return;
    }

    setHandle(getSessionHandle());
  }, [canSwitchActors, demo, mock, profile, ready]);

  if (!canSwitchActors) {
    if (!ready || !profile) return null;
    return (
      <p className={`m-0 text-[13px] text-muted ${className}`}>
        Posting as{" "}
        <span className="font-semibold text-ink">
          {profile.displayName || profile.fullName}
        </span>
      </p>
    );
  }

  if (!members.length) return null;

  return (
    <label
      className={`inline-flex flex-wrap items-center gap-2 text-[13px] text-muted ${className}`}
    >
      Posting as
      <select
        value={handle || members[0]!.handle}
        onChange={(e) => setSessionHandle(e.target.value)}
        className="cf-select h-10 min-w-[10rem] rounded-[10px] border border-[#D4D3CD] bg-white pl-2.5 text-[14px] text-ink"
      >
        {members.map((m) => (
          <option key={m.handle} value={m.handle}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
