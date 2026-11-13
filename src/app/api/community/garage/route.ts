import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { communityHandleFromProfile } from "@/lib/community/handles";
import { mapGarageBikeRow, readCfPayload } from "@/lib/garage/garageMap";

export const runtime = "nodejs";

const BUCKET = "garage-photos";
const SIGNED_TTL = 60 * 60 * 6;

/**
 * Public Community garage items with signed photo URLs (service role).
 * Classic garage_bikes RLS is owner-only; this route is how Community reads them.
 */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Garage API is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Community server environment.",
        items: [],
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId")?.trim() || "";
  const id = searchParams.get("id")?.trim() || "";

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase.from("garage_bikes").select("*").order("updated_at", {
    ascending: false,
  });
  if (id) query = query.eq("id", id);
  if (ownerId) query = query.eq("owner_id", ownerId);
  query = query.limit(id ? 1 : 500);

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  }

  const bikes = (rows || []).filter((row) => {
    const cf = readCfPayload(row as Record<string, unknown>);
    // Only Community-authored rows (cf envelope) — classic private garage stays private.
    if (!cf) return false;
    if (cf.archived) return false;
    if (row.archived === true) return false;
    if (row.is_public === false) return false;
    return true;
  });

  const ids = bikes.map((r) => String(r.id));
  const photosByBike = new Map<string, string[]>();

  if (ids.length) {
    const { data: photoRows, error: photoError } = await supabase
      .from("garage_bike_photos")
      .select("bike_id, storage_path, is_cover, sort_order")
      .in("bike_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });
    if (photoError) {
      return NextResponse.json({ error: photoError.message, items: [] }, { status: 500 });
    }

    const paths: { bikeId: string; path: string }[] = [];
    for (const row of photoRows || []) {
      const bikeId = String(row.bike_id);
      const path = String(row.storage_path || "");
      if (!path) continue;
      paths.push({ bikeId, path });
    }

    if (paths.length) {
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          paths.map((p) => p.path),
          SIGNED_TTL,
        );
      if (signError) {
        return NextResponse.json({ error: signError.message, items: [] }, { status: 500 });
      }
      for (let i = 0; i < paths.length; i += 1) {
        const bikeId = paths[i]!.bikeId;
        const signedUrl = signed?.[i]?.signedUrl || "";
        if (!signedUrl) continue;
        const list = photosByBike.get(bikeId) || [];
        list.push(signedUrl);
        photosByBike.set(bikeId, list);
      }
    }
  }

  const ownerIds = [...new Set(bikes.map((b) => String(b.owner_id)))];
  const handleByOwner = new Map<string, string>();
  if (ownerIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", ownerIds);
    for (const p of profiles || []) {
      const handle =
        String(p.handle || "").trim().toLowerCase() ||
        communityHandleFromProfile(String(p.id), String(p.display_name || "Member"));
      handleByOwner.set(String(p.id), handle);
    }
  }

  const items = bikes.map((row) => {
    const owner = String(row.owner_id);
    const handle =
      handleByOwner.get(owner) || communityHandleFromProfile(owner, "Member");
    const photoUrls = photosByBike.get(String(row.id)) || [];
    const mapped = mapGarageBikeRow(row as Record<string, unknown>, handle, photoUrls);
    // Owner-only private notes stay off the public directory payload.
    const { notes: _notes, ...publicItem } = mapped;
    return publicItem;
  });

  return NextResponse.json({ items });
}
