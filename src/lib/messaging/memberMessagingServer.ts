import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMemberName } from "@/lib/community/memberDisplay";
import type { ThreadDetail, ThreadMessage } from "./types";

export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

type ProfileLite = {
  id: string;
  handle?: string | null;
  display_name?: string | null;
};

type ThreadRow = {
  id: string;
  kind: "member" | "garage";
  participant_a: string;
  participant_b: string;
  item_id: string | null;
  item_title: string;
  item_href: string;
  price_label: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function loadProfiles(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await admin
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", unique);
  for (const row of data || []) {
    map.set(String((row as ProfileLite).id), row as ProfileLite);
  }
  return map;
}

function displayFromProfile(p: ProfileLite | undefined, fallback = "Member") {
  if (!p) return fallback;
  return (
    getMemberName({
      displayName: p.display_name,
      handle: p.handle,
    }) || fallback
  );
}

function otherId(thread: ThreadRow, viewerId: string) {
  return thread.participant_a === viewerId
    ? thread.participant_b
    : thread.participant_a;
}

export async function mapThreadDetail(
  admin: SupabaseClient,
  thread: ThreadRow,
  viewerId: string,
  messages: MessageRow[],
): Promise<ThreadDetail> {
  const profiles = await loadProfiles(admin, [
    thread.participant_a,
    thread.participant_b,
  ]);
  const other = otherId(thread, viewerId);
  const otherProfile = profiles.get(other);
  const otherName = displayFromProfile(otherProfile);
  const otherHandle = String(otherProfile?.handle || "").trim();

  const firstSender = messages[0]?.sender_id;
  const role: "buyer" | "seller" =
    firstSender === viewerId ? "buyer" : "seller";

  const mapped: ThreadMessage[] = messages.map((m) => ({
    id: m.id,
    sender_id: m.sender_id,
    body: m.body,
    created_at: m.created_at,
  }));

  const href =
    thread.kind === "member" && otherHandle
      ? `/u/${otherHandle}`
      : thread.item_href || (otherHandle ? `/u/${otherHandle}` : "");

  return {
    kind: thread.kind,
    thread: {
      id: thread.id,
      status: thread.status,
      viewer_role: role,
      item_id: thread.item_id,
      owner_handle: otherHandle || undefined,
    },
    subject: {
      title: thread.kind === "member" ? otherName : thread.item_title || otherName,
      href,
      priceLabel: thread.kind === "member" ? "" : thread.price_label || "",
      coverUrl: "",
      meta: otherName,
    },
    messages: mapped,
    viewerId,
  };
}

export type { ThreadRow, MessageRow, ProfileLite };
