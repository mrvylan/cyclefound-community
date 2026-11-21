import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TargetType = "question" | "answer";

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * POST { targetType: 'question'|'answer', targetId: uuid }
 * Toggles the signed-in member's Useful vote. Returns { voted, votes }.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { targetType?: string; targetId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const targetType = String(body.targetType || "").trim() as TargetType;
  const targetId = String(body.targetId || "").trim();
  if (targetType !== "question" && targetType !== "answer") {
    return NextResponse.json({ error: "Invalid target type." }, { status: 400 });
  }
  if (!isUuid(targetId)) {
    return NextResponse.json({ error: "Invalid target id." }, { status: 400 });
  }

  const admin = service();
  if (!admin) {
    return NextResponse.json({ error: "Votes API not configured." }, { status: 503 });
  }

  if (targetType === "question") {
    const { data: q } = await admin
      .from("community_questions")
      .select("id, asker_id, votes")
      .eq("id", targetId)
      .maybeSingle();
    if (!q) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    if (String(q.asker_id) === user.id) {
      return NextResponse.json(
        { error: "You can’t vote on your own question." },
        { status: 403 },
      );
    }
  } else {
    const { data: a } = await admin
      .from("community_answers")
      .select("id, author_id, votes")
      .eq("id", targetId)
      .maybeSingle();
    if (!a) {
      return NextResponse.json({ error: "Answer not found." }, { status: 404 });
    }
    if (String(a.author_id) === user.id) {
      return NextResponse.json(
        { error: "You can’t vote on your own answer." },
        { status: 403 },
      );
    }
  }

  const { data: existing } = await admin
    .from("community_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  let voted = false;
  if (existing?.id) {
    const { error } = await admin
      .from("community_votes")
      .delete()
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    voted = false;
  } else {
    const { error } = await admin.from("community_votes").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    voted = true;
  }

  const table =
    targetType === "question" ? "community_questions" : "community_answers";
  const { data: row } = await admin
    .from(table)
    .select("votes")
    .eq("id", targetId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    voted,
    votes: Number((row as { votes?: number } | null)?.votes) || 0,
    targetType,
    targetId,
  });
}

/**
 * GET ?targetType=question&targetIds=id,id
 * Returns which targets the signed-in member has voted on.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ votedIds: [] });
  }

  const url = new URL(request.url);
  const targetType = String(url.searchParams.get("targetType") || "").trim();
  const rawIds = String(url.searchParams.get("targetIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(isUuid)
    .slice(0, 100);

  if (
    (targetType !== "question" && targetType !== "answer") ||
    !rawIds.length
  ) {
    return NextResponse.json({ votedIds: [] });
  }

  const admin = service();
  if (!admin) {
    return NextResponse.json({ votedIds: [] });
  }

  const { data } = await admin
    .from("community_votes")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .in("target_id", rawIds);

  return NextResponse.json({
    votedIds: (data || []).map((r) => String((r as { target_id: string }).target_id)),
  });
}
