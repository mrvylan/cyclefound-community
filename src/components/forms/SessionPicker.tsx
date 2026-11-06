"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  handleFromAuthProfile,
  isDemoSessionEnabled,
} from "@/lib/demo-session";
import {
  getSessionHandle,
  listMembers,
  saveProfilePatch,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

/**
 * Demo mode: pick which mock member you’re acting as.
 * Live mode: hide the picker; sync session to the signed-in user when present.
 */
export function SessionPicker({ className = "" }: { className?: string }) {
  const demo = isDemoSessionEnabled();
  const { ready, profile } = useAuth();
  const [handle, setHandle] = useState("ben_carver");
  const members = listMembers();

  useEffect(() => {
    if (!ready) return;

    if (demo) {
      setHandle(getSessionHandle());
      return subscribeStore(() => setHandle(getSessionHandle()));
    }

    if (profile) {
      const next = handleFromAuthProfile(profile);
      const name = profile.displayName || profile.fullName;
      saveProfilePatch(next, {
        name,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      });
      if (getSessionHandle() !== next) setSessionHandle(next);
      setHandle(next);
      return;
    }

    setHandle(getSessionHandle());
  }, [demo, profile, ready]);

  if (!demo) {
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

  return (
    <label
      className={`inline-flex flex-wrap items-center gap-2 text-[13px] text-muted ${className}`}
    >
      Posting as
      <select
        value={handle}
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
