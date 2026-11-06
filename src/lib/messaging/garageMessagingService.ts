/**
 * Community garage / member messaging — same UX rules as Cycle Found listing
 * messaging (min length, threads, Messages inbox). Pre-Alpha store is local until
 * community garage items share listing UUIDs / merged tables with marketplace.
 */
import type { ThreadDetail, ThreadListItem, ThreadMessage } from "./types";

const STORAGE_KEY = "cf_messages_v1";

export type GarageThreadRecord = {
  id: string;
  kind: "garage" | "member";
  itemId: string | null;
  itemTitle: string;
  itemHref: string;
  priceLabel: string;
  ownerHandle: string;
  ownerName: string;
  buyerId: string;
  buyerName: string;
  /** Present when the buyer has a community handle (demo / signed-in). */
  buyerHandle?: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  /** ISO timestamps keyed by participant id */
  readAtBy: Record<string, string>;
};

type Store = { threads: GarageThreadRecord[] };

function emptyStore(): Store {
  return { threads: [] };
}

function readStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    return { threads: Array.isArray(parsed.threads) ? parsed.threads : [] };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("cf-messages"));
}

export function subscribeMessages(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("cf-messages", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("cf-messages", handler);
  };
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function lastBody(thread: GarageThreadRecord) {
  const last = thread.messages[thread.messages.length - 1];
  return last ? last.body.slice(0, 160) : "";
}

function isUnread(thread: GarageThreadRecord, viewerId: string) {
  const last = thread.messages[thread.messages.length - 1];
  if (!last || last.sender_id === viewerId) return false;
  const readAt = thread.readAtBy[viewerId];
  if (!readAt) return true;
  return new Date(last.created_at).getTime() > new Date(readAt).getTime();
}

function participates(thread: GarageThreadRecord, viewer: { id: string; handle?: string }) {
  if (thread.buyerId === viewer.id) return true;
  if (viewer.handle && thread.ownerHandle === viewer.handle) return true;
  if (thread.ownerHandle === viewer.id) return true;
  return false;
}

function roleFor(
  thread: GarageThreadRecord,
  viewer: { id: string; handle?: string },
): "buyer" | "seller" {
  if (thread.buyerId === viewer.id) return "buyer";
  return "seller";
}

export type GarageActor = {
  id: string;
  name: string;
  handle?: string;
  emailVerified?: boolean;
};

export const garageMessagingService = {
  async startThread({
    actor,
    message,
    itemId,
    itemTitle,
    itemHref,
    priceLabel,
    ownerHandle,
    ownerName,
    kind = "garage",
  }: {
    actor: GarageActor;
    message: string;
    itemId: string | null;
    itemTitle: string;
    itemHref: string;
    priceLabel?: string;
    ownerHandle: string;
    ownerName: string;
    kind?: "garage" | "member";
  }) {
    const body = String(message || "").trim();
    if (body.length < 20) throw new Error("Message must be at least 20 characters.");
    if (body.length > 2000) throw new Error("Message must be 2000 characters or fewer.");
    if (!actor?.id) throw new Error("Sign in to message the owner.");
    if (actor.emailVerified === false) {
      throw new Error("Verify your email before messaging members.");
    }

    const isOwner =
      (actor.handle && actor.handle === ownerHandle) || actor.id === ownerHandle;
    if (isOwner) throw new Error("You can’t message your own item.");

    const store = readStore();
    const existing = store.threads.find(
      (t) =>
        t.buyerId === actor.id &&
        t.ownerHandle === ownerHandle &&
        (kind === "member"
          ? t.kind === "member"
          : t.kind === "garage" && t.itemId === itemId),
    );

    const now = new Date().toISOString();
    const msg: ThreadMessage = {
      id: newId(),
      sender_id: actor.id,
      body,
      created_at: now,
    };

    if (existing) {
      existing.messages.push(msg);
      existing.status = "open";
      existing.updatedAt = now;
      existing.readAtBy[actor.id] = now;
      writeStore(store);
      return { threadId: existing.id, created: false };
    }

    const thread: GarageThreadRecord = {
      id: newId(),
      kind,
      itemId,
      itemTitle,
      itemHref,
      priceLabel: priceLabel || "",
      ownerHandle,
      ownerName,
      buyerId: actor.id,
      buyerName: actor.name,
      ...(actor.handle ? { buyerHandle: actor.handle } : {}),
      status: "open",
      createdAt: now,
      updatedAt: now,
      messages: [msg],
      readAtBy: { [actor.id]: now },
    };
    store.threads.unshift(thread);
    writeStore(store);
    return { threadId: thread.id, created: true };
  },

  async listThreads(viewer: { id: string; handle?: string }): Promise<ThreadListItem[]> {
    if (!viewer?.id) return [];
    const store = readStore();
    return store.threads
      .filter((t) => participates(t, viewer))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((t) => {
        const role = roleFor(t, viewer);
        const otherName = role === "buyer" ? t.ownerName : t.buyerName;
        return {
          kind: t.kind,
          threadId: t.id,
          itemId: t.itemId,
          role,
          status: t.status,
          updatedAt: t.updatedAt,
          title: t.kind === "member" ? otherName : t.itemTitle,
          lastBody: lastBody(t),
          otherDisplayName: otherName,
          coverUrl: "",
          priceLabel: t.priceLabel,
          unread: isUnread(t, viewer.id),
        };
      });
  },

  async getThread(
    threadId: string,
    viewer: { id: string; handle?: string },
  ): Promise<ThreadDetail | null> {
    if (!threadId || !viewer?.id) return null;
    const store = readStore();
    const t = store.threads.find((row) => row.id === threadId);
    if (!t || !participates(t, viewer)) return null;

    const now = new Date().toISOString();
    t.readAtBy[viewer.id] = now;
    writeStore(store);

    const role = roleFor(t, viewer);
    const otherName = role === "buyer" ? t.ownerName : t.buyerName;
    const otherHandle = role === "buyer" ? t.ownerHandle : t.buyerHandle;
    const href =
      t.kind === "member" && otherHandle ? `/u/${otherHandle}` : t.itemHref;

    return {
      kind: t.kind,
      thread: {
        id: t.id,
        status: t.status,
        viewer_role: role,
        item_id: t.itemId,
        owner_handle: t.ownerHandle,
      },
      subject: {
        title: t.kind === "member" ? otherName : t.itemTitle,
        href,
        priceLabel: t.kind === "member" ? "" : t.priceLabel,
        coverUrl: "",
        meta: otherHandle ? `@${otherHandle}` : otherName,
      },
      messages: t.messages,
      viewerId: viewer.id,
    };
  },

  async reply({
    threadId,
    message,
    actor,
  }: {
    threadId: string;
    message: string;
    actor: GarageActor;
  }) {
    const body = String(message || "").trim();
    if (!body) throw new Error("Enter a message.");
    if (body.length > 2000) throw new Error("Message must be 2000 characters or fewer.");
    if (!actor?.id) throw new Error("Sign in to send a message.");
    if (actor.emailVerified === false) {
      throw new Error("Verify your email before messaging members.");
    }

    const store = readStore();
    const t = store.threads.find((row) => row.id === threadId);
    if (!t || !participates(t, actor)) throw new Error("Conversation not found.");

    const now = new Date().toISOString();
    t.messages.push({
      id: newId(),
      sender_id: actor.id,
      body,
      created_at: now,
    });
    t.status = "open";
    t.updatedAt = now;
    t.readAtBy[actor.id] = now;
    writeStore(store);
    return { emailed: false };
  },
};
