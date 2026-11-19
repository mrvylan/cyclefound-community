/**
 * Cross-user member DMs via Postgres (member_threads / member_messages).
 */
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { ThreadDetail, ThreadListItem, ThreadMessage } from "./types";
import type { GarageActor } from "./garageMessagingService";

export function memberMessagingAvailable() {
  return hasSupabaseConfig();
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  return (await res.json().catch(() => ({}))) as T & { error?: string };
}

export const memberMessagingService = {
  async startThread({
    actor,
    message,
    handle,
    name,
  }: {
    actor: GarageActor;
    message: string;
    handle: string;
    name: string;
  }): Promise<{ threadId: string; created: boolean }> {
    if (!actor?.id) throw new Error("Sign in to message members.");
    if (actor.emailVerified === false) {
      throw new Error("Verify your email before messaging members.");
    }
    const body = String(message || "").trim();
    if (body.length < 20) throw new Error("Message must be at least 20 characters.");
    if (body.length > 2000) throw new Error("Message must be 2000 characters or fewer.");

    const res = await fetch("/api/community/member-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: handle.trim().toLowerCase(),
        name,
        message: body,
      }),
    });
    const data = await parseJson<{
      threadId?: string;
      created?: boolean;
    }>(res);
    if (!res.ok || !data.threadId) {
      throw new Error(data.error || "Could not send the message.");
    }
    return { threadId: data.threadId, created: Boolean(data.created) };
  },

  async listThreads(): Promise<ThreadListItem[]> {
    const res = await fetch("/api/community/member-messages", {
      cache: "no-store",
    });
    const data = await parseJson<{ threads?: ThreadListItem[] }>(res);
    if (!res.ok) {
      throw new Error(data.error || "Could not load messages.");
    }
    return data.threads || [];
  },

  async getThread(threadId: string): Promise<ThreadDetail | null> {
    const res = await fetch(
      `/api/community/member-messages/${encodeURIComponent(threadId)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return null;
    const data = await parseJson<{ thread?: ThreadDetail }>(res);
    if (!res.ok) {
      throw new Error(data.error || "Could not load conversation.");
    }
    return data.thread || null;
  },

  async reply({
    threadId,
    message,
  }: {
    threadId: string;
    message: string;
  }): Promise<{ emailed: boolean }> {
    const body = String(message || "").trim();
    if (!body) throw new Error("Enter a message.");
    if (body.length > 2000) throw new Error("Message must be 2000 characters or fewer.");
    if (body.length < 20) throw new Error("Message must be at least 20 characters.");

    const res = await fetch(
      `/api/community/member-messages/${encodeURIComponent(threadId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
      },
    );
    const data = await parseJson<{ emailed?: boolean }>(res);
    if (!res.ok) {
      throw new Error(data.error || "Could not send the message.");
    }
    return { emailed: Boolean(data.emailed) };
  },
};
