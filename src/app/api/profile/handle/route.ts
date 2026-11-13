import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkHandleAvailability,
  claimHandle,
  getProfileHandleRow,
  suggestHandleForName,
} from "@/lib/community/handleService";
import { nextHandleChangeAllowedAt } from "@/lib/community/handleRules";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** GET ?handle=… — availability. GET ?suggest=1 — suggested available handle. */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const suggest = url.searchParams.get("suggest");
  const handle = url.searchParams.get("handle");

  try {
    const row = await getProfileHandleRow(user.id);
    const fullName = String(
      row?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "",
    );

    if (suggest) {
      const suggested = await suggestHandleForName(fullName, {
        exceptUserId: user.id,
      });
      return NextResponse.json({
        suggested,
        current: row?.handle ?? null,
        handleChangedAt: row?.handle_changed_at ?? null,
        nextAllowedAt: nextHandleChangeAllowedAt(
          row?.handle_changed_at as string | null,
        )?.toISOString() ?? null,
      });
    }

    if (!handle) {
      return NextResponse.json({
        current: row?.handle ?? null,
        handleChangedAt: row?.handle_changed_at ?? null,
        nextAllowedAt: nextHandleChangeAllowedAt(
          row?.handle_changed_at as string | null,
        )?.toISOString() ?? null,
        fullNamePrivate: Boolean(fullName),
      });
    }

    const result = await checkHandleAvailability(handle, {
      exceptUserId: user.id,
      fullNameForSuggestions: fullName,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Handle check failed." },
      { status: 500 },
    );
  }
}

/** POST { handle, initial? } — claim or change handle. */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { handle?: string; initial?: boolean; displayName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    // Ensure full_name from OAuth is on the profile when possible (private).
    const metaName = String(
      user.user_metadata?.full_name || user.user_metadata?.name || "",
    ).trim();
    if (metaName) {
      const row = await getProfileHandleRow(user.id);
      if (row && !String(row.full_name || "").trim()) {
        const { createClient: createAdmin } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
        if (url && key) {
          const admin = createAdmin(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await admin
            .from("profiles")
            .update({ full_name: metaName })
            .eq("id", user.id);
        }
      }
    }

    const result = await claimHandle({
      userId: user.id,
      handle: String(body.handle || ""),
      initial: Boolean(body.initial),
      ...(body.displayName !== undefined
        ? { displayName: String(body.displayName) }
        : {}),
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save handle." },
      { status: 500 },
    );
  }
}
