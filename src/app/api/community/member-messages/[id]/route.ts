import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  mapThreadDetail,
  serviceClient,
  type MessageRow,
  type ThreadRow,
} from "@/lib/messaging/memberMessagingServer";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
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
      { error: "Messaging API not configured." },
      { status: 503 },
    );
  }

  const { data: thread, error } = await admin
    .from("member_threads")
    .select(
      "id, kind, participant_a, participant_b, item_id, item_title, item_href, price_label, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!thread) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const row = thread as ThreadRow;
  if (row.participant_a !== user.id && row.participant_b !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data: messages } = await admin
    .from("member_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const now = new Date().toISOString();
  await admin.from("member_thread_reads").upsert(
    {
      thread_id: id,
      user_id: user.id,
      read_at: now,
    },
    { onConflict: "thread_id,user_id" },
  );

  const detail = await mapThreadDetail(
    admin,
    row,
    user.id,
    (messages || []) as MessageRow[],
  );

  return NextResponse.json({ thread: detail });
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
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

  let body: { message?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = String(body.message || "").trim();
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

  const { data: thread } = await admin
    .from("member_threads")
    .select("id, participant_a, participant_b")
    .eq("id", id)
    .maybeSingle();

  if (
    !thread ||
    ((thread as ThreadRow).participant_a !== user.id &&
      (thread as ThreadRow).participant_b !== user.id)
  ) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error: msgErr } = await admin.from("member_messages").insert({
    thread_id: id,
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
    .eq("id", id);

  await admin.from("member_thread_reads").upsert(
    {
      thread_id: id,
      user_id: user.id,
      read_at: now,
    },
    { onConflict: "thread_id,user_id" },
  );

  return NextResponse.json({ emailed: false });
}
