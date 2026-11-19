import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { mapAnswerRow, type AnswerRow } from "@/lib/community/questionsRemote";

export const runtime = "nodejs";

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: questionId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { body?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const text = String(body.body || "").trim();
  if (text.length < 1) {
    return NextResponse.json({ error: "Answer body required." }, { status: 400 });
  }

  const admin = service();
  if (!admin) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { data: q } = await admin
    .from("community_questions")
    .select("id")
    .eq("id", questionId)
    .maybeSingle();
  if (!q) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("community_answers")
    .insert({
      question_id: questionId,
      author_id: user.id,
      body: text.slice(0, 8000),
    })
    .select("id, question_id, author_id, body, votes, accepted, created_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Could not post answer." },
      { status: 500 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("handle, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    answer: mapAnswerRow({
      ...(data as AnswerRow),
      profiles: profile || null,
    }),
  });
}
