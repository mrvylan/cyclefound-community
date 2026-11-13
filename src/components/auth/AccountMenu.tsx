"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, MessageSquare } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { MemberAvatar } from "@/components/ui";
import { getMemberName } from "@/lib/community/memberDisplay";
import {
  subscribeMessages,
  unreadMessageCount,
} from "@/lib/messaging/garageMessagingService";
import {
  unreadNotificationCount,
  subscribeNotifications,
} from "@/lib/notifications/store";
import {
  getMergedPerson,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";

function MenuLink({
  href,
  children,
  onClick,
  trailing,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px] font-medium text-ink no-underline hover:bg-ground"
      onClick={onClick}
    >
      <span>{children}</span>
      {trailing}
    </Link>
  );
}

function MenuDivider() {
  return <div className="my-1.5 border-t border-line-soft" role="separator" />;
}

export function AccountMenu({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { ready, profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [localAvatar, setLocalAvatar] = useState<string | undefined>();
  const [localName, setLocalName] = useState("");
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

  useEffect(() => {
    function syncLocal() {
      // Prefer session handle — profile photos are saved under the local actor
      // (e.g. dsimpson), which can differ from the auth-email handle.
      const session = getSessionHandle();
      const fromAuth = profile ? handleFromAuthProfile(profile) : "";
      const person =
        (session ? getMergedPerson(session) : undefined) ||
        (fromAuth ? getMergedPerson(fromAuth) : undefined);
      setLocalAvatar(person?.avatarUrl);
      setLocalName(person?.name || "");
    }
    syncLocal();
    return subscribeStore(syncLocal);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const handle = handleFromAuthProfile(profile);
    const viewer = { id: user?.id || handle, handle };
    const syncNotifs = () => setUnreadNotifs(unreadNotificationCount());
    const syncMsgs = () => setUnreadMsgs(unreadMessageCount(viewer));
    syncNotifs();
    syncMsgs();
    const unsubN = subscribeNotifications(syncNotifs);
    const unsubM = subscribeMessages(syncMsgs);
    return () => {
      unsubN();
      unsubM();
    };
  }, [profile, user?.id]);

  if (!ready) {
    // Static placeholder (no pulse) — avoids a flashing pill in the header while auth resolves.
    return (
      <div
        className="size-9 rounded-full bg-line-soft/60 lg:h-[42px] lg:w-[7.5rem] lg:rounded-[10px]"
        aria-hidden
      />
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={authHref("login", nextPath)}
          className="px-1 text-[14px] font-semibold text-ink no-underline hover:text-accent"
        >
          Log in
        </Link>
        <Link
          href={authHref("join", nextPath)}
          className="inline-flex h-10 items-center rounded-[10px] bg-accent px-3.5 text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white lg:h-[42px] lg:px-4"
        >
          Join
        </Link>
      </div>
    );
  }

  const handle = handleFromAuthProfile(profile);
  const person = handle ? getMergedPerson(handle) : undefined;
  const shortName =
    getMemberName({
      displayName: person?.displayName,
      handle: person?.publicHandle || profile.handle || handle,
      name: localName || person?.name,
    }) || "";
  const displayName = shortName || "Account";
  const avatarSrc = localAvatar || person?.avatarUrl || profile.avatarUrl || null;
  const close = () => setOpen(false);

  const totalUnread = unreadMsgs + unreadNotifs;

  return (
    <div className="flex items-center gap-1.5">
      {/* Desktop: messages + notifications as icon buttons. Mobile: in the account menu. */}
      <Link
        href="/messages"
        className="relative hidden size-[42px] items-center justify-center rounded-[10px] border border-line bg-white text-ink no-underline hover:bg-ground lg:inline-flex"
        aria-label={
          unreadMsgs
            ? `Messages, ${unreadMsgs} unread`
            : "Messages"
        }
      >
        <MessageSquare className="size-[18px]" aria-hidden />
        {unreadMsgs > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold leading-[18px] text-white">
            {unreadMsgs > 9 ? "9+" : unreadMsgs}
          </span>
        ) : null}
      </Link>
      <Link
        href="/notifications"
        className="relative hidden size-[42px] items-center justify-center rounded-[10px] border border-line bg-white text-ink no-underline hover:bg-ground lg:inline-flex"
        aria-label={
          unreadNotifs ? `Notifications, ${unreadNotifs} unread` : "Notifications"
        }
      >
        <Bell className="size-[18px]" aria-hidden />
        {unreadNotifs > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" aria-hidden />
        ) : null}
      </Link>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          className="relative inline-flex items-center gap-1.5 rounded-[10px] p-0.5 text-left hover:bg-ground sm:gap-2 sm:py-1 sm:pl-1 sm:pr-2"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Account menu, ${displayName}`}
          onClick={() => setOpen((v) => !v)}
        >
          <MemberAvatar
            userId={profile.id}
            handle={person?.publicHandle || profile.handle || handle}
            displayName={person?.displayName}
            name={person?.name || localName}
            src={avatarSrc}
            size={36}
            label={displayName}
          />
          {/* Mobile unread dot when messages/notifs are collapsed into this menu */}
          {totalUnread > 0 ? (
            <span
              className="absolute top-0.5 right-0.5 size-2 rounded-full bg-accent lg:hidden"
              aria-hidden
            />
          ) : null}
          {shortName ? (
            <span className="hidden max-w-[7rem] truncate text-[14px] font-semibold text-ink lg:inline">
              {shortName}
            </span>
          ) : null}
          <ChevronDown className="hidden size-4 text-muted lg:inline" aria-hidden />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,260px)] overflow-hidden rounded-[12px] border border-line bg-white py-1.5 shadow-[0_12px_32px_rgba(16,23,27,0.12)]"
          >
            {/* Identity */}
            <div className="px-3.5 py-2.5">
              <p className="truncate text-[14px] font-semibold text-ink">{shortName}</p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[12px] text-muted">{profile.email}</p>
                <Link
                  href={`/u/${handle}`}
                  className="shrink-0 text-[12px] font-semibold text-accent no-underline hover:text-accent-hover"
                  onClick={close}
                >
                  View profile →
                </Link>
              </div>
            </div>

            <MenuDivider />

            {/* My stuff */}
            <MenuLink href={`/u/${handle}/garage`} onClick={close}>
              My garage
            </MenuLink>
            <MenuLink href={`/u/${handle}?tab=Answers`} onClick={close}>
              My questions & answers
            </MenuLink>
            <MenuLink
              href="/messages"
              onClick={close}
              trailing={
                unreadMsgs > 0 ? (
                  <span className="font-mono text-[12px] tabular-nums text-muted">
                    {unreadMsgs}
                  </span>
                ) : null
              }
            >
              Messages
            </MenuLink>
            <MenuLink
              href="/notifications"
              onClick={close}
              trailing={
                unreadNotifs > 0 ? (
                  <span className="font-mono text-[12px] tabular-nums text-muted">
                    {unreadNotifs}
                  </span>
                ) : null
              }
            >
              Notifications
            </MenuLink>

            <MenuDivider />

            {/* Actions */}
            <MenuLink href="/garage/new" onClick={close}>
              Add to garage
            </MenuLink>

            <MenuDivider />

            {/* Settings */}
            <MenuLink href="/settings/profile" onClick={close}>
              Public profile
            </MenuLink>
            <MenuLink href="/account" onClick={close}>
              Account settings
            </MenuLink>

            <MenuDivider />

            <button
              type="button"
              role="menuitem"
              className="block w-full px-3.5 py-2.5 text-left text-[14px] font-medium text-ink hover:bg-ground"
              onClick={async () => {
                close();
                await signOut();
                router.replace("/");
              }}
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
