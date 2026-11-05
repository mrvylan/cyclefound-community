"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import { Avatar } from "@/components/ui";

export function AccountMenu({ nextPath }: { nextPath: string }) {
  const { ready, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!ready) {
    return <div className="h-10 w-[7.5rem] animate-pulse rounded-[10px] bg-line-soft" aria-hidden />;
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/settings/profile"
          className="hidden px-1 text-[14px] font-semibold text-ink no-underline hover:text-accent sm:inline"
        >
          Profile
        </Link>
        <Link
          href={authHref("login", nextPath)}
          className="px-1 text-[14px] font-semibold text-ink no-underline hover:text-accent"
        >
          Log in
        </Link>
        <Link
          href={authHref("join", nextPath)}
          className="inline-flex h-[42px] items-center rounded-[10px] border border-accent bg-white px-4 text-[14px] font-bold text-accent no-underline hover:bg-accent-soft hover:text-accent-hover"
        >
          Join
        </Link>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-[10px] py-1 pl-1 pr-2 text-left hover:bg-ground"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu, ${profile.displayName}`}
        onClick={() => setOpen((v) => !v)}
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <Avatar init={profile.initials} bg={profile.avatarColor} size={40} />
        )}
        <span className="hidden max-w-[7rem] truncate text-[14px] font-semibold text-ink sm:inline">
          {profile.displayName}
        </span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[200px] overflow-hidden rounded-[12px] border border-line bg-white py-1.5 shadow-[0_12px_32px_rgba(16,23,27,0.12)]"
        >
          <div className="border-b border-line-soft px-3.5 py-2.5">
            <p className="truncate text-[14px] font-semibold text-ink">{profile.displayName}</p>
            <p className="truncate text-[12px] text-muted">{profile.email}</p>
          </div>
          <Link
            role="menuitem"
            href="/"
            className="block px-3.5 py-2.5 text-[14px] font-medium text-ink no-underline hover:bg-ground"
            onClick={() => setOpen(false)}
          >
            Community home
          </Link>
          <Link
            role="menuitem"
            href="/settings/profile"
            className="block px-3.5 py-2.5 text-[14px] font-medium text-ink no-underline hover:bg-ground"
            onClick={() => setOpen(false)}
          >
            Edit profile
          </Link>
          <Link
            role="menuitem"
            href="/item/new"
            className="block px-3.5 py-2.5 text-[14px] font-medium text-ink no-underline hover:bg-ground"
            onClick={() => setOpen(false)}
          >
            Add garage item
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-ink hover:bg-ground"
            onClick={async () => {
              setOpen(false);
              await signOut();
              window.location.assign("/");
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
