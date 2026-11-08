"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessionHandle, getWantedLines, subscribeStore } from "@/lib/data/local-store";
import { viewerRoleForHandle } from "@/lib/viewer-role";

export function WantedList({
  handle,
  previewVisitor = false,
}: {
  handle: string;
  /** Owner previewing their page as a visitor would see it. */
  previewVisitor?: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [role, setRole] = useState<"loggedOut" | "member" | "owner">("loggedOut");

  useEffect(() => {
    const sync = () => {
      setLines(getWantedLines(handle));
      setRole(viewerRoleForHandle(handle, getSessionHandle()));
    };
    sync();
    return subscribeStore(sync);
  }, [handle]);

  const isOwner = role === "owner" && !previewVisitor;

  return (
    <section className="rounded-2xl border border-accent-soft-border bg-accent-soft p-[22px]">
      <h2 className="section-title mb-1 mt-0 text-[20px]">Wanted</h2>
      <p className="mb-3 mt-0 text-[13px] text-[#3d5f24]">
        {isOwner
          ? "Parts you’re looking for — shown on your garage."
          : "Plain-text parts this member is looking for."}
      </p>
      {lines.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {lines.map((line) => (
            <li
              key={line}
              className="rounded-[10px] border border-accent-soft-border bg-white px-3.5 py-3 text-[14px] leading-snug text-ink"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : isOwner ? (
        <p className="m-0 text-[14px] text-muted-2">
          Nothing on your wanted list yet.{" "}
          <Link href="/settings/profile" className="font-semibold">
            Edit profile
          </Link>{" "}
          to add lines.
        </p>
      ) : (
        <p className="m-0 text-[14px] text-muted-2">
          Nothing on this wanted list yet.
        </p>
      )}
    </section>
  );
}
