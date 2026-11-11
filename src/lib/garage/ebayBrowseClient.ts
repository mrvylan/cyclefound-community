/**
 * eBay Browse API (active listings / asking prices).
 * Uses client-credentials scope https://api.ebay.com/oauth/api_scope
 * — NOT Marketplace Insights (sold prices).
 */

import {
  buildEbayActiveQuery,
  estimateFromActiveListings,
  type EbayActiveQueryInput,
  type EbayActiveResult,
  type RawListing,
} from "@/lib/garage/ebayActiveEstimate";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const TAXONOMY_SUGGEST_URL =
  "https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_suggestions";
const APP_SCOPE = "https://api.ebay.com/oauth/api_scope";

/** US Cycling root — used when taxonomy lookup fails. */
const DEFAULT_CYCLING_CATEGORY_ID = "177";

type Env = NodeJS.ProcessEnv;

let cachedToken: { token: string; expiresAt: number } | null = null;

export function ebayBrowseConfigured(env: Env = process.env) {
  return Boolean(env.EBAY_CLIENT_ID?.trim() && env.EBAY_CLIENT_SECRET?.trim());
}

function logEbayError(context: string, status: number, payload: unknown) {
  const err =
    payload && typeof payload === "object"
      ? (payload as { errors?: Array<{ errorId?: number; message?: string }>; error?: string })
      : null;
  const errorId = err?.errors?.[0]?.errorId;
  const message = err?.errors?.[0]?.message || err?.error || "";
  console.warn(
    `[ebay] ${context} status=${status}` +
      (errorId != null ? ` errorId=${errorId}` : "") +
      (message ? ` message=${String(message).slice(0, 200)}` : ""),
  );
}

async function getAppAccessToken(env: Env = process.env, force = false) {
  if (!force && cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  const clientId = env.EBAY_CLIENT_ID?.trim();
  const clientSecret = env.EBAY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("eBay is not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: APP_SCOPE,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    logEbayError("oauth", response.status, payload);
    throw new Error("Could not authenticate with eBay.");
  }

  const expiresIn = Number(payload.expires_in) || 7200;
  cachedToken = {
    token: payload.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return cachedToken.token;
}

async function ebayFetch(
  url: string,
  env: Env,
  init?: RequestInit,
  retried = false,
): Promise<Response> {
  const token = await getAppAccessToken(env, retried);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": env.EBAY_MARKETPLACE_ID || "EBAY_US",
      ...(init?.headers || {}),
    },
  });
  if (response.status === 401 && !retried) {
    cachedToken = null;
    return ebayFetch(url, env, init, true);
  }
  return response;
}

async function suggestCategoryId(query: string, env: Env): Promise<string | null> {
  const q = String(query || "").trim();
  if (!q) return null;
  try {
    const url = new URL(TAXONOMY_SUGGEST_URL);
    url.searchParams.set("q", q);
    const response = await ebayFetch(url.toString(), env);
    const payload = (await response.json().catch(() => ({}))) as {
      categorySuggestions?: Array<{
        category?: { categoryId?: string; categoryName?: string };
      }>;
      errors?: unknown;
    };
    if (!response.ok) {
      logEbayError("taxonomy", response.status, payload);
      return null;
    }
    const id = payload.categorySuggestions?.[0]?.category?.categoryId;
    return id ? String(id) : null;
  } catch (err) {
    console.warn("[ebay] taxonomy soft-fail:", err instanceof Error ? err.message : err);
    return null;
  }
}

function listingFromSummary(raw: Record<string, unknown>): RawListing | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const priceObj = raw.price as { value?: unknown; currency?: string } | undefined;
  const price = Number(priceObj?.value);
  if (!title || !Number.isFinite(price) || price <= 0) return null;
  if (priceObj?.currency && String(priceObj.currency).toUpperCase() !== "USD") {
    return null;
  }

  const image =
    (raw.image as { imageUrl?: string } | undefined)?.imageUrl ||
    (Array.isArray(raw.thumbnailImages)
      ? (raw.thumbnailImages[0] as { imageUrl?: string } | undefined)?.imageUrl
      : null) ||
    null;

  const url =
    (typeof raw.itemWebUrl === "string" && raw.itemWebUrl) ||
    (typeof raw.itemHref === "string" && raw.itemHref) ||
    "";

  return {
    title,
    price,
    url,
    image: image || null,
  };
}

export async function fetchEbayActiveListings(
  input: EbayActiveQueryInput,
  env: Env = process.env,
): Promise<{ query: string; listings: RawListing[] }> {
  const query = buildEbayActiveQuery(input);
  if (!query) return { query: "", listings: [] };

  const knownCategory =
    String(input.categoryHint || env.EBAY_CYCLING_CATEGORY_ID || "").trim() ||
    null;
  const suggested = knownCategory ? null : await suggestCategoryId(query, env);
  const preferredCategory =
    knownCategory || suggested || DEFAULT_CYCLING_CATEGORY_ID;

  const limit = Math.min(Math.max(Number(env.EBAY_BROWSE_LIMIT) || 50, 1), 50);

  async function runSearch(categoryId: string | null) {
    const url = new URL(BROWSE_SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set(
      "filter",
      "buyingOptions:{FIXED_PRICE},priceCurrency:USD",
    );
    if (categoryId) url.searchParams.set("category_ids", String(categoryId));

    const response = await ebayFetch(url.toString(), env);
    const payload = (await response.json().catch(() => ({}))) as {
      itemSummaries?: Record<string, unknown>[];
      total?: number;
      errors?: Array<{ errorId?: number; message?: string }>;
    };

    if (!response.ok) {
      logEbayError("browse_search", response.status, payload);
      throw new Error("eBay listing search failed.");
    }

    const summaries = Array.isArray(payload.itemSummaries)
      ? payload.itemSummaries
      : [];
    return summaries
      .map((row) => listingFromSummary(row))
      .filter((row): row is RawListing => Boolean(row));
  }

  // Prefer cycling category, then retry unscoped if empty (category trees vary).
  let listings = await runSearch(preferredCategory);
  if (!listings.length && preferredCategory) {
    listings = await runSearch(null);
  }

  return { query, listings };
}

/**
 * End-to-end: search active listings → aggregate asking-price estimate.
 * Soft-fails to available:false on config/API errors (caller falls back to AI).
 */
export async function estimateEbayActiveValue(
  input: EbayActiveQueryInput,
  env: Env = process.env,
): Promise<EbayActiveResult> {
  const query = buildEbayActiveQuery(input);
  const fetchedAt = new Date().toISOString();

  if (!ebayBrowseConfigured(env)) {
    return {
      source: "ebay_active",
      available: false,
      median: null,
      low: null,
      high: null,
      count: 0,
      samples: [],
      query,
      fetchedAt,
      message: "eBay is not configured.",
    };
  }

  if (!query) {
    return {
      source: "ebay_active",
      available: false,
      median: null,
      low: null,
      high: null,
      count: 0,
      samples: [],
      query: "",
      fetchedAt,
      message: "Brand and model are needed to search eBay.",
    };
  }

  try {
    const { listings } = await fetchEbayActiveListings(input, env);
    return estimateFromActiveListings(
      listings,
      query,
      input.subjectKind,
      input.bikeState,
      { model: input.model, manufacturer: input.manufacturer },
    );
  } catch (err) {
    console.warn("[ebay] active estimate soft-fail:", err instanceof Error ? err.message : err);
    return {
      source: "ebay_active",
      available: false,
      median: null,
      low: null,
      high: null,
      count: 0,
      samples: [],
      query,
      fetchedAt,
      message: "eBay listings unavailable right now.",
    };
  }
}
