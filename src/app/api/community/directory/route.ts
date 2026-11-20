import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isHiddenMember } from "@/lib/community/hidden-members";

export const runtime = "nodejs";

/**
 * Public community directory — limited profile fields for all members.
 * Uses the shared Cycle Found service role (server-only) because profiles RLS
 * is own-row. Never expose the service key to the browser.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Community directory is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Community server environment (same secret as Cycle Found marketplace).",
        members: [],
      },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, handle, display_name, bio, avatar_url, city, state, created_at, is_founding_member, member_number, is_test_account",
    )
    .not("handle", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message, members: [] }, { status: 500 });
  }

  const members = (data || []).filter((row) => {
    const handle = String(row.handle || "").trim();
    if (!handle || !row.id) return false;
    if (row.is_test_account) return false;
    return !isHiddenMember({ name: handle, userId: row.id });
  });

  const foundingAssigned = members.filter((m) => m.is_founding_member).length;

  // Live Q&A counts from shared Community tables (not localStorage / preview).
  const askedBy = new Map<string, number>();
  const answeredBy = new Map<string, number>();
  const acceptedBy = new Map<string, number>();
  try {
    const ids = members.map((m) => String(m.id));
    if (ids.length) {
      const { data: questions } = await supabase
        .from("community_questions")
        .select("asker_id")
        .in("asker_id", ids);
      for (const row of questions || []) {
        const id = String((row as { asker_id: string }).asker_id);
        askedBy.set(id, (askedBy.get(id) || 0) + 1);
      }

      const { data: answers } = await supabase
        .from("community_answers")
        .select("author_id, accepted")
        .in("author_id", ids);
      for (const row of answers || []) {
        const id = String((row as { author_id: string }).author_id);
        answeredBy.set(id, (answeredBy.get(id) || 0) + 1);
        if ((row as { accepted?: boolean }).accepted) {
          acceptedBy.set(id, (acceptedBy.get(id) || 0) + 1);
        }
      }
    }
  } catch {
    // Tables may not be migrated yet — leave counts at 0.
  }

  const withActivity = members.map((m) => {
    const id = String(m.id);
    return {
      ...m,
      asked: askedBy.get(id) || 0,
      answered: answeredBy.get(id) || 0,
      accepted: acceptedBy.get(id) || 0,
    };
  });

  return NextResponse.json({ members: withActivity, foundingAssigned });
}
