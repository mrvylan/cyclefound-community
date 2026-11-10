import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const CONFIRM_WORD = "REMOVE";

/**
 * Owner-only marketplace listing controls for Community.
 * DELETE → pause the classic bike_listings row so it leaves Market.
 * Requires JSON body `{ "confirm": "REMOVE" }` as a safeguard against
 * accidental / scripted removals.
 */
export async function DELETE(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const listingId = String(id || "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  }

  let confirm = "";
  try {
    const body = (await request.json()) as { confirm?: string };
    confirm = String(body?.confirm || "").trim().toUpperCase();
  } catch {
    confirm = "";
  }
  if (confirm !== CONFIRM_WORD) {
    return NextResponse.json(
      { error: `Confirmation required. Send { "confirm": "${CONFIRM_WORD}" }.` },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Listings API is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to manage this listing." }, { status: 401 });
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error: loadError } = await admin
    .from("bike_listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (String(row.seller_id) !== user.id) {
    return NextResponse.json({ error: "Only the seller can remove this listing." }, { status: 403 });
  }

  if (row.status === "sold") {
    return NextResponse.json(
      { error: "This listing is already marked sold and is off Market." },
      { status: 409 },
    );
  }

  // Already off Market — treat as success so the client can clean up cache.
  if (row.status === "paused" || row.status === "archived" || row.status === "draft") {
    return NextResponse.json({ ok: true, status: row.status });
  }

  const { data: updated, error: updateError } = await admin
    .from("bike_listings")
    .update({ status: "paused" })
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .select("id, status")
    .maybeSingle();
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "Could not pause listing. Refresh and try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, status: updated.status || "paused" });
}
