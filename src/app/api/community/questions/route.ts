import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  mapQuestionRow,
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

export async function GET() {
  const admin = service();
  if (!admin) {
    return NextResponse.json(
      { error: "Questions API not configured.", questions: [] },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from("community_questions")
    .select(
      "id, asker_id, title, body, tags, linked_item_id, votes, solved, accepted_answer_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message, questions: [] },
      { status: 500 },
    );
  }

  const baseRows = (data || []) as QuestionRow[];
  const askerIds = [...new Set(baseRows.map((r) => r.asker_id))];
  const profileById = new Map<
    string,
    { handle?: string | null; display_name?: string | null }
  >();
  if (askerIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", askerIds);
    for (const p of profiles || []) {
      profileById.set(String((p as { id: string }).id), p as {
        handle?: string | null;
        display_name?: string | null;
      });
    }
  }

  const rows: QuestionRow[] = baseRows.map((r) => ({
    ...r,
    profiles: profileById.get(r.asker_id) || null,
  }));

  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: answers } = await admin
      .from("community_answers")
      .select("question_id")
      .in("question_id", ids);
    for (const a of answers || []) {
      const qid = String((a as { question_id: string }).question_id);
      counts.set(qid, (counts.get(qid) || 0) + 1);
    }
  }

  const expertByQ = new Map<string, { name: string; handle: string }>();
  const acceptedIds = rows
    .map((r) => r.accepted_answer_id)
    .filter(Boolean) as string[];
  if (acceptedIds.length) {
    const { data: accepted } = await admin
      .from("community_answers")
      .select("id, question_id, author_id")
      .in("id", acceptedIds);
    const authorIds = [
      ...new Set(
        (accepted || []).map((a) => String((a as { author_id: string }).author_id)),
      ),
    ];
    const authors = new Map<string, { handle?: string | null; display_name?: string | null }>();
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
    for (const a of accepted || []) {
      const row = a as { question_id: string; author_id: string };
      const prof = authors.get(row.author_id);
      const handle = String(prof?.handle || "").trim();
      const name =
        String(prof?.display_name || "").trim() ||
        (handle ? `@${handle}` : "");
      expertByQ.set(row.question_id, { name, handle });
    }
  }

  const questions = rows.map((r) => {
    const ex = expertByQ.get(r.id);
    return mapQuestionRow(
      r,
      counts.get(r.id) || 0,
      ex?.name || "",
      ex?.handle || "",
    );
  });

  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    title?: string;
    body?: string;
    tags?: string[];
    linkedItemId?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [];

  if (title.length < 8) {
    return NextResponse.json(
      { error: "Title needs at least 8 characters." },
      { status: 400 },
    );
  }

  const admin = service();
  if (!admin) {
    return NextResponse.json(
      { error: "Questions API not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from("community_questions")
    .insert({
      asker_id: user.id,
      title: title.slice(0, 200),
      body: text.slice(0, 8000),
      tags,
      linked_item_id: body.linkedItemId || null,
    })
    .select(
      "id, asker_id, title, body, tags, linked_item_id, votes, solved, accepted_answer_id, created_at",
    )
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Could not create question." },
      { status: 500 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("handle, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    question: mapQuestionRow(
      {
        ...(data as QuestionRow),
        profiles: profile || null,
      },
      0,
    ),
  });
}
