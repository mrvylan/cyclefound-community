import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET = "listing-photos";
const SIGNED_TTL = 60 * 60 * 6; // 6 hours

/**
 * Active marketplace listings with signed photo URLs (server-side).
 * Keeps private storage + service-role signing off the browser.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Listings API is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Community server environment.",
        listings: [],
      },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from("bike_listings")
    .select(
      "id, seller_id, title, description, status, condition, asking_price_cents, manufacturer_name, model_name, category_name, approximate_year, frame_size_label, city, state, published_at",
    )
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message, listings: [] }, { status: 500 });
  }

  const listings = rows || [];
  const ids = listings.map((r) => r.id);

  const photosByListing = new Map<string, string[]>();
  if (ids.length) {
    const { data: photoRows, error: photoError } = await supabase
      .from("listing_photos")
      .select("listing_id, storage_path, is_cover, sort_order")
      .in("listing_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      return NextResponse.json({ error: photoError.message, listings: [] }, { status: 500 });
    }

    const paths: { listingId: string; path: string }[] = [];
    for (const row of photoRows || []) {
      const listingId = String(row.listing_id);
      const path = String(row.storage_path || "");
      if (!path) continue;
      paths.push({ listingId, path });
    }

    if (paths.length) {
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          paths.map((p) => p.path),
          SIGNED_TTL,
        );
      if (signError) {
        return NextResponse.json({ error: signError.message, listings: [] }, { status: 500 });
      }
      for (let i = 0; i < paths.length; i += 1) {
        const listingId = paths[i]!.listingId;
        const signedUrl = signed?.[i]?.signedUrl || "";
        if (!signedUrl) continue;
        const list = photosByListing.get(listingId) || [];
        list.push(signedUrl);
        photosByListing.set(listingId, list);
      }
    }
  }

  return NextResponse.json({
    listings: listings.map((row) => ({
      ...row,
      photoUrls: photosByListing.get(String(row.id)) || [],
    })),
  });
}
