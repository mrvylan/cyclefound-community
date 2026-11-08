import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    .select("id, display_name, avatar_url, city, state, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message, members: [] }, { status: 500 });
  }

  const members = (data || []).filter((row) => {
    const name = String(row.display_name || "").trim();
    return Boolean(name) || Boolean(row.id);
  });

  return NextResponse.json({ members });
}
