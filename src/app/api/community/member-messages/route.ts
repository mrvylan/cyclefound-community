import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  loadProfiles,
  orderedPair,
  serviceClient,
  type MessageRow,
  type ThreadRow,
} from "@/lib/messaging/memberMessagingServer";
import type { ThreadListItem } from "@/lib/messaging/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Messaging API not configured.", threads: [] },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from("member_threads")
    .select(
      "id, kind, participant_a, participant_b, item_id, item_title, item_href, price_label, status, created_at, updated_at",
    )
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message, threads: [] },
      { status: 500 },
    );
  }

  const threads = (data || []) as ThreadRow[];
  if (!threads.length) {
    return NextResponse.json({ threads: [] });
  }

  const threadIds = threads.map((t) => t.id);
  const profiles = await loadProfiles(
    admin,
    threads.flatMap((t) => [t.participant_a, t.participant_b]),
  );

  const { data: messages } = await admin
    .from("member_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  const byThread = new Map<string, MessageRow[]>();
  for (const m of (messages || []) as MessageRow[]) {
    const list = byThread.get(m.thread_id) || [];
    list.push(m);
    byThread.set(m.thread_id, list);
  }

  const { data: reads } = await admin
    .from("member_thread_reads")
    .select("thread_id, read_at")
    .eq("user_id", user.id)
    .in("thread_id", threadIds);
  const readAt = new Map<string, string>();
  for (const r of reads || []) {
    readAt.set(
      String((r as { thread_id: string }).thread_id),
      String((r as { read_at: string }).read_at),
    );
  }

  const items: ThreadListItem[] = threads.map((t) => {
    const msgs = byThread.get(t.id) || [];
    const last = msgs[msgs.length - 1] || null;
    const firstSender = msgs[0]?.sender_id;
    const other =
      t.participant_a === user.id ? t.participant_b : t.participant_a;
    const otherProfile = profiles.get(other);
    const otherName =
      String(otherProfile?.display_name || "").trim() ||
      (otherProfile?.handle ? `@${otherProfile.handle}` : "Member");
    const role: "buyer" | "seller" =
      firstSender === user.id ? "buyer" : "seller";
    const unread = Boolean(
      last &&
        last.sender_id !== user.id &&
        (!readAt.get(t.id) ||
          new Date(last.created_at).getTime() >
            new Date(readAt.get(t.id)!).getTime()),
    );
    return {
      kind: t.kind,
      threadId: t.id,
      itemId: t.item_id,
      role,
      status: t.status,
      updatedAt: t.updated_at,
      title: t.kind === "member" ? otherName : t.item_title || otherName,
      lastBody: last ? last.body.slice(0, 160) : "",
      otherDisplayName: otherName,
      coverUrl: "",
      priceLabel: t.price_label || "",
      unread,
    };
  });

  return NextResponse.json({ threads: items });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Verify your email before messaging members." },
      { status: 403 },
    );
  }

  let body: { handle?: string; name?: string; message?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const handle = String(body.handle || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const message = String(body.message || "").trim();
  if (!handle) {
    return NextResponse.json({ error: "Member handle required." }, { status: 400 });
  }
  if (message.length < 20) {
    return NextResponse.json(
      { error: "Message must be at least 20 characters." },
      { status: 400 },
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message must be 2000 characters or fewer." },
      { status: 400 },
    );
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Messaging API not configured." },
      { status: 503 },
    );
  }

  const { data: peer } = await admin
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", handle)
    .maybeSingle();

  if (!peer?.id) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  if (peer.id === user.id) {
    return NextResponse.json(
      { error: "You can’t message yourself." },
      { status: 400 },
    );
  }

  const [a, b] = orderedPair(user.id, peer.id);
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("member_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .eq("kind", "member")
    .is("item_id", null)
    .maybeSingle();

  let threadId = existing?.id as string | undefined;
  let created = false;

  if (!threadId) {
    const { data: createdThread, error: createErr } = await admin
      .from("member_threads")
      .insert({
        kind: "member",
        participant_a: a,
        participant_b: b,
        item_id: null,
        item_title: String(body.name || peer.display_name || handle),
        item_href: `/u/${handle}`,
        price_label: "",
        status: "open",
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle();

    if (createErr || !createdThread?.id) {
      const { data: raced } = await admin
        .from("member_threads")
        .select("id")
        .eq("participant_a", a)
        .eq("participant_b", b)
        .eq("kind", "member")
        .is("item_id", null)
        .maybeSingle();
      if (!raced?.id) {
        return NextResponse.json(
          { error: createErr?.message || "Could not start conversation." },
          { status: 500 },
        );
      }
      threadId = raced.id;
    } else {
      threadId = createdThread.id;
      created = true;
    }
  }

  const { error: msgErr } = await admin.from("member_messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body: message,
    created_at: now,
  });

  if (msgErr) {
    return NextResponse.json(
      { error: msgErr.message || "Could not send the message." },
      { status: 500 },
    );
  }

  await admin
    .from("member_threads")
    .update({ updated_at: now, status: "open" })
    .eq("id", threadId);

  await admin.from("member_thread_reads").upsert(
    {
      thread_id: threadId,
      user_id: user.id,
      read_at: now,
    },
    { onConflict: "thread_id,user_id" },
  );

  return NextResponse.json({ threadId, created });
}
