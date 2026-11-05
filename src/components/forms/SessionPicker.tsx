"use client";

import { useEffect, useState } from "react";
import {
  getSessionHandle,
  listMembers,
  setSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

/** Beta-only: pick which mock member you’re acting as (until real auth owns the session). */
export function SessionPicker({ className = "" }: { className?: string }) {
  const [handle, setHandle] = useState("ben_carver");
  const members = listMembers();

  useEffect(() => {
    setHandle(getSessionHandle());
    return subscribeStore(() => setHandle(getSessionHandle()));
  }, []);

  return (
    <label
      className={`inline-flex flex-wrap items-center gap-2 text-[13px] text-muted ${className}`}
    >
      Posting as
      <select
        value={handle}
        onChange={(e) => setSessionHandle(e.target.value)}
        className="h-10 min-w-[10rem] rounded-[10px] border border-[#D4D3CD] bg-white px-2.5 text-[14px] text-ink"
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
