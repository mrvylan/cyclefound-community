"use client";

export type NotificationKind = "answer" | "message" | "accepted";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

const KEY = "cf_notifications_v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

/** Legacy demo hrefs → real seed question ids. */
const HREF_FIXES: Record<string, string> = {
  "/q/q1": "/q/dylan-bottom-bracket",
  "/q/q2": "/q/seized-seatpost",
};

function normalizeHref(href: string) {
  return HREF_FIXES[href] || href;
}

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return [];
    let dirty = false;
    const next = parsed.map((n) => {
      const href = normalizeHref(n.href);
      if (href !== n.href) dirty = true;
      return href === n.href ? n : { ...n, href };
    });
    if (dirty) writeAll(next);
    return next;
  } catch {
    return [];
  }
}

function writeAll(items: AppNotification[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  emit();
}

export function listNotifications() {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function unreadNotificationCount() {
  return readAll().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string) {
  const next = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
  writeAll(next);
}

export function markAllNotificationsRead() {
  writeAll(readAll().map((n) => ({ ...n, read: true })));
}

export function pushNotification(
  input: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string },
) {
  const item: AppNotification = {
    id: input.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeAll([item, ...readAll()].slice(0, 50));
  return item;
}

/** Demo notification seeding is retired with mock data. */
export function ensureDemoNotifications() {
  // Clear leftover demo rows from older clients.
  const all = readAll();
  const next = all.filter((n) => !String(n.id || "").startsWith("n_demo_"));
  if (next.length !== all.length) writeAll(next);
}

export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
