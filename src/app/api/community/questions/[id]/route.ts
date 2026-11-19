import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  mapAnswerRow,
  mapQuestionRow,
  type AnswerRow,
  type QuestionRow,
} from "@/lib/community/questionsRemote";

export const runtime = "nodejs";

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const admin = service();
  if (!admin) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { data: q, error } = await admin
    .from("community_questions")
    .select(
      "id, asker_id, title, body, tags, linked_item_id, votes, solved, accepted_answer_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!q) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data: askerProfile } = await admin
    .from("profiles")
    .select("handle, display_name")
    .eq("id", (q as QuestionRow).asker_id)
    .maybeSingle();

  const { data: answers } = await admin
    .from("community_answers")
    .select("id, question_id, author_id, body, votes, accepted, created_at")
    .eq("question_id", id)
    .order("created_at", { ascending: true });

  const baseAnswers = (answers || []) as AnswerRow[];
  const authorIds = [...new Set(baseAnswers.map((a) => a.author_id))];
  const authors = new Map<
    string,
    { handle?: string | null; display_name?: string | null }
  >();
  if (authorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", authorIds);
    for (const p of profiles || []) {
      authors.set(String((p as { id: string }).id), p as {
        handle?: string | null;
        display_name?: string | null;
      });
    }
  }

  const answerRows: AnswerRow[] = baseAnswers.map((a) => ({
    ...a,
    profiles: authors.get(a.author_id) || null,
  }));
  const accepted = answerRows.find((a) => a.accepted);
  const question = mapQuestionRow(
    {
      ...(q as QuestionRow),
      profiles: askerProfile || null,
    },
    answerRows.length,
    accepted
      ? String(accepted.profiles?.display_name || "").trim() ||
          (accepted.profiles?.handle
            ? `@${accepted.profiles.handle}`
            : "")
      : "",
    accepted?.profiles?.handle || "",
  );

  return NextResponse.json({
    question,
    answers: answerRows.map(mapAnswerRow),
  });
}
