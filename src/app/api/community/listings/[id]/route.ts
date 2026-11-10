import { NextResponse } from "next/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const CONFIRM_WORD = "REMOVE";
const EDITABLE_STATUSES = ["draft", "active", "paused"] as const;

type ListingRow = { id: string; seller_id: string; status: string };

async function requireOwner(
  listingId: string,
): Promise<
  | { ok: true; admin: SupabaseClient; userId: string; row: ListingRow }
  | { ok: false; response: NextResponse }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Listings API is not configured." }, { status: 503 }),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in to manage this listing." }, { status: 401 }),
    };
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
    return {
      ok: false,
      response: NextResponse.json({ error: loadError.message }, { status: 500 }),
    };
  }
  if (!row) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Listing not found." }, { status: 404 }),
    };
  }
  if (String(row.seller_id) !== user.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only the seller can manage this listing." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    admin,
    userId: user.id,
    row: row as ListingRow,
  };
}

/**
 * Owner-only marketplace listing controls for Community (no Classic).
 * PATCH → update listing fields / status in bike_listings.
 * DELETE → pause so it leaves Community Market (`{ "confirm": "REMOVE" }`).
 */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const listingId = String(id || "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  }

  const owned = await requireOwner(listingId);
  if (!owned.ok) return owned.response;
  const { admin, userId, row } = owned;

  if (!(EDITABLE_STATUSES as readonly string[]).includes(String(row.status))) {
    return NextResponse.json(
      {
        error:
          row.status === "archived"
            ? "This listing is archived and can no longer be edited."
            : "This listing can no longer be edited.",
      },
      { status: 409 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: Record<string, string | number | null> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, 120);
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    patch.title = title;
  }
  if (typeof body.description === "string") {
    patch.description = body.description.trim();
  }
  if (typeof body.condition === "string" && body.condition.trim()) {
    patch.condition = body.condition.trim();
  }
  if (typeof body.manufacturer_name === "string") {
    patch.manufacturer_name = body.manufacturer_name.trim() || null;
  }
  if (typeof body.model_name === "string") {
    patch.model_name = body.model_name.trim() || null;
  }
  if (typeof body.category_name === "string" || body.category_name === null) {
    patch.category_name =
      body.category_name == null ? null : String(body.category_name).trim() || null;
  }
  if (typeof body.approximate_year === "string") {
    patch.approximate_year = body.approximate_year.trim() || "Unknown";
  }
  if (typeof body.frame_size_label === "string" || body.frame_size_label === null) {
    patch.frame_size_label =
      body.frame_size_label == null
        ? null
        : String(body.frame_size_label).trim() || null;
  }
  if (typeof body.asking_price_cents === "number" && Number.isFinite(body.asking_price_cents)) {
    const cents = Math.max(0, Math.round(body.asking_price_cents));
    patch.asking_price_cents = cents;
    patch.asking_price_usd = cents / 100;
  }
  if (typeof body.status === "string") {
    const next = body.status.trim().toLowerCase();
    if (!(EDITABLE_STATUSES as readonly string[]).includes(next)) {
      return NextResponse.json(
        { error: `Unsupported status: ${body.status}` },
        { status: 400 },
      );
    }
    patch.status = next;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await admin
    .from("bike_listings")
    .update(patch)
    .eq("id", listingId)
    .eq("seller_id", userId)
    .in("status", [...EDITABLE_STATUSES])
    .select(
      "id, seller_id, title, description, status, condition, asking_price_cents, manufacturer_name, model_name, category_name, approximate_year, frame_size_label, city, state, published_at",
    )
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "Could not save listing. Refresh and try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, listing: updated });
}

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

  const owned = await requireOwner(listingId);
  if (!owned.ok) return owned.response;
  const { admin, userId, row } = owned;

  if (row.status === "sold") {
    return NextResponse.json(
      { error: "This listing is already marked sold and is off Market." },
      { status: 409 },
    );
  }

  if (row.status === "paused" || row.status === "archived" || row.status === "draft") {
    return NextResponse.json({ ok: true, status: row.status });
  }

  const { data: updated, error: updateError } = await admin
    .from("bike_listings")
    .update({ status: "paused" })
    .eq("id", listingId)
    .eq("seller_id", userId)
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

  return NextResponse.json({ ok: true, status: String(updated.status || "paused") });
}
