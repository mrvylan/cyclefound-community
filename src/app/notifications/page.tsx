"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, MessageSquare, BadgeCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import {
  ensureDemoNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type AppNotification,
} from "@/lib/notifications/store";
import { getSessionHandle, subscribeStore } from "@/lib/data/local-store";

function kindIcon(kind: AppNotification["kind"]) {
  if (kind === "message") return MessageSquare;
  if (kind === "accepted") return BadgeCheck;
  return Bell;
}

export default function NotificationsPage() {
  const { ready, profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const sync = () => {
      setHasSession(Boolean(profile) || Boolean(getSessionHandle()));
      ensureDemoNotifications();
      setItems(listNotifications());
    };
    sync();
    const unsubN = subscribeNotifications(sync);
    const unsubS = subscribeStore(sync);
    return () => {
      unsubN();
      unsubS();
    };
  }, [profile]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16 text-[15px] text-muted">
        Loading…
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="mx-auto max-w-[520px] px-8 py-16 text-center">
        <h1 className="section-title m-0 text-[40px]">Notifications</h1>
        <p className="mt-3 text-[15px] text-muted-2">
          Sign in to see answers on your questions and new messages.
        </p>
        <Link
          href={authHref("login", "/notifications")}
          className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-8 py-10 pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow m-0">Inbox</p>
          <h1 className="section-title m-0 text-[clamp(36px,5vw,52px)]">Notifications</h1>
        </div>
        {items.some((n) => !n.read) ? (
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground"
          >
            <CheckCheck className="size-4" aria-hidden />
            Mark all read
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-8 text-center">
          <p className="m-0 text-[16px] font-semibold">You&apos;re caught up</p>
          <p className="mt-2 text-[14px] text-muted-2">
            Answers, accepted solutions, and messages will show up here.
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((n) => {
            const Icon = kindIcon(n.kind);
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => markNotificationRead(n.id)}
                  className={`flex gap-3 rounded-[14px] border px-4 py-3.5 no-underline ${
                    n.read
                      ? "border-line bg-surface text-ink"
                      : "border-accent-soft-border bg-accent-soft text-ink"
                  }`}
                >
                  <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{n.title}</span>
                    <span className="mt-0.5 block text-[14px] text-meta">{n.body}</span>
                    <span className="mt-1 block font-mono text-[11px] text-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </span>
                  {!n.read ? (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
