/**
 * Duplicated from Cycle-Found-Website listingMessagingService.
 * Shared Supabase RPCs (start_listing_thread, etc.). Keep in sync until repos merge.
 */
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { ThreadDetail, ThreadListItem } from "./types";

const BUCKET = "listing-photos";
const SIGNED_URL_TTL = 60 * 60;

function rpcMissing(error: { code?: string; message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  );
}

function throwRpc(error: { code?: string; message?: string } | null, fallback: string): never {
  if (rpcMissing(error)) {
    throw new Error(
      "Bike messaging isn’t enabled on the database yet. Apply the listing messaging migration.",
    );
  }
  throw new Error(error?.message || fallback);
}

function formatUsdFromCents(cents: number | null | undefined) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

async function signedUrl(
  supabase: ReturnType<typeof createClient>,
  path: string | null | undefined,
) {
  if (!path) return "";
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return "";
  return data?.signedUrl || "";
}

async function notifyListingThread({ threadId }: { threadId: string }) {
  if (!hasSupabaseConfig()) return { emailed: false };
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token || !threadId) return { emailed: false };

  const endpoint =
    process.env.NEXT_PUBLIC_PART_MESSAGE_NOTIFY_API_URL || "/api/part-message-notify";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
  if (endpoint.includes("/functions/v1/")) {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (key) headers.apikey = key;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ threadId, event: "listing_message" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        emailed: false,
        error: (payload as { error?: string }).error || "Could not send notification email.",
      };
    }
    return { emailed: true };
  } catch {
    return { emailed: false };
  }
}

export const listingMessagingService = {
  formatUsdFromCents,

  async startThread({ listingId, message }: { listingId: string; message: string }) {
    const body = String(message || "").trim();
    if (body.length < 20) throw new Error("Message must be at least 20 characters.");

    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_listing_thread", {
      p_listing_id: listingId,
      p_body: body,
    });
    if (error) throwRpc(error, "Could not send the message.");
    const row = Array.isArray(data) ? data[0] : data;
    const threadId =
      (row as { thread_id?: string; threadId?: string } | null)?.thread_id ||
      (row as { threadId?: string } | null)?.threadId;
    if (!threadId) throw new Error("Could not start the conversation.");
    const notify = await notifyListingThread({ threadId });
    return {
      threadId,
      created: Boolean((row as { created?: boolean } | null)?.created),
      ...notify,
    };
  },

  async listThreads(): Promise<ThreadListItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("list_my_listing_threads");
    if (error) throwRpc(error, "Could not load messages.");
    const rows: ThreadListItem[] = [];
    for (const row of data || []) {
      const r = row as {
        thread_id: string;
        listing_id: string;
        role: "buyer" | "seller";
        status: string;
        updated_at: string;
        title?: string;
        last_body?: string;
        other_display_name?: string;
        cover_storage_path?: string;
        asking_price_cents?: number;
        unread?: boolean;
      };
      rows.push({
        kind: "listing",
        threadId: r.thread_id,
        itemId: null,
        listingId: r.listing_id,
        role: r.role,
        status: r.status,
        updatedAt: r.updated_at,
        title: r.title || "Untitled listing",
        lastBody: r.last_body || "",
        otherDisplayName: r.other_display_name || "Cycle Found member",
        coverUrl: await signedUrl(supabase, r.cover_storage_path),
        priceLabel: formatUsdFromCents(r.asking_price_cents),
        unread: Boolean(r.unread),
      });
    }
    return rows;
  },

  async getThread(threadId: string): Promise<ThreadDetail | null> {
    if (!threadId) return null;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc("get_listing_thread_detail", {
      p_thread_id: threadId,
    });
    if (error) throwRpc(error, "Could not load this conversation.");
    let payload = data as Record<string, unknown> | string | null;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }
    if (!payload) return null;

    const listing = (payload.listing || {}) as {
      id?: string;
      title?: string;
      cover_storage_path?: string;
      asking_price_cents?: number;
      manufacturer_name?: string;
      model_name?: string;
    };
    const thread = payload.thread as {
      id: string;
      listing_id: string;
      status: string;
      viewer_role: "buyer" | "seller";
    };
    const priceLabel = formatUsdFromCents(listing.asking_price_cents);
    return {
      kind: "listing",
      thread: {
        id: thread.id,
        status: thread.status,
        viewer_role: thread.viewer_role,
        listing_id: thread.listing_id,
      },
      subject: {
        title: listing.title || "Untitled listing",
        href: `/i/${encodeURIComponent(listing.id || thread.listing_id)}`,
        priceLabel,
        coverUrl: await signedUrl(supabase, listing.cover_storage_path),
        meta: [listing.manufacturer_name, listing.model_name].filter(Boolean).join(" "),
      },
      messages: (payload.messages as ThreadDetail["messages"]) || [],
      viewerId: user?.id || "",
    };
  },

  async reply({ threadId, message }: { threadId: string; message: string }) {
    const body = String(message || "").trim();
    if (!body) throw new Error("Enter a message.");
    const supabase = createClient();
    const { error } = await supabase.rpc("reply_listing_thread", {
      p_thread_id: threadId,
      p_body: body,
    });
    if (error) throwRpc(error, "Could not send the message.");
    return notifyListingThread({ threadId });
  },
};
