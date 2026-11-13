/**
 * 24h cache for eBay active-listing aggregates (service-role writes).
 */

import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { EbayActiveResult } from "@/lib/garage/ebayActiveEstimate";
import { normalizeEbayQueryKey } from "@/lib/garage/ebayActiveEstimate";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readEbayPriceCache(
  query: string,
): Promise<EbayActiveResult | null> {
  const key = normalizeEbayQueryKey(query);
  if (!key) return null;
  const admin = adminClient();
  if (!admin) return null;

  try {
    const { data, error } = await admin
      .from("ebay_price_cache")
      .select("result, fetched_at")
      .eq("query_key", key)
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn("[ebay-cache] read:", error.message);
      return null;
    }

    const fetchedAt = data.fetched_at ? new Date(String(data.fetched_at)).getTime() : 0;
    if (!fetchedAt || Date.now() - fetchedAt > CACHE_TTL_MS) return null;

    const result = data.result as EbayActiveResult | null;
    if (!result || typeof result !== "object") return null;
    return result;
  } catch (err) {
    console.warn("[ebay-cache] read soft-fail:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function writeEbayPriceCache(
  query: string,
  result: EbayActiveResult,
): Promise<void> {
  const key = normalizeEbayQueryKey(query);
  if (!key || !result?.available) return;
  const admin = adminClient();
  if (!admin) return;

  // Persist only the aggregate + up to 3 samples — never full eBay payloads.
  const slim: EbayActiveResult = {
    source: "ebay_active",
    available: true,
    median: result.median,
    low: result.low,
    high: result.high,
    count: result.count,
    samples: (result.samples || []).slice(0, 3),
    query: result.query,
    fetchedAt: result.fetchedAt || new Date().toISOString(),
    message: null,
  };

  try {
    const { error } = await admin.from("ebay_price_cache").upsert(
      {
        query_key: key,
        result: slim,
        fetched_at: slim.fetchedAt,
      },
      { onConflict: "query_key" },
    );
    if (error) console.warn("[ebay-cache] write:", error.message);
  } catch (err) {
    console.warn("[ebay-cache] write soft-fail:", err instanceof Error ? err.message : err);
  }
}
