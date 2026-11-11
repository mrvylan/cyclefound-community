/**
 * eBay Marketplace Insights (sold comps) client.
 * Requires EBAY_CLIENT_ID + EBAY_CLIENT_SECRET and Insights API access approval.
 */

import {
  buildEbaySearchQuery,
  estimateFromEbaySoldItems,
  type EbaySoldEstimateResult,
  type EbaySoldItem,
  type EbaySoldQuery,
} from "@/lib/garage/ebaySoldEstimate";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const INSIGHTS_SEARCH_URL =
  "https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search";
const INSIGHTS_SCOPE =
  "https://api.ebay.com/oauth/api_scope/buy.marketplace.insights";

/** US Cycling root category — narrows sold search to bikes/parts. */
const DEFAULT_CYCLING_CATEGORY_ID = "177";

type Env = NodeJS.ProcessEnv;

let cachedToken: { token: string; expiresAt: number } | null = null;

function dollarsToCents(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function ebaySoldConfigured(env: Env = process.env) {
  return Boolean(env.EBAY_CLIENT_ID?.trim() && env.EBAY_CLIENT_SECRET?.trim());
}

async function getAppAccessToken(env: Env = process.env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = env.EBAY_CLIENT_ID?.trim();
  const clientSecret = env.EBAY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "eBay sold comps are not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.",
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: INSIGHTS_SCOPE,
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

  if (!response.ok) {
    const detail = payload.error_description || payload.error || response.statusText;
    const detailLower = String(detail).toLowerCase();
    if (detailLower.includes("invalid_scope") || response.status === 403) {
      throw new Error(
        "eBay Marketplace Insights access is not approved for this app. Apply for sold-data access in the eBay developer portal, then retry.",
      );
    }
    if (
      detailLower.includes("client authentication failed") ||
      detailLower.includes("invalid_client")
    ) {
      throw new Error(
        "eBay credentials were rejected. Use Production App ID (Client ID) and Cert ID (Client Secret) from the eBay developer portal — not Sandbox.",
      );
    }
    throw new Error(`eBay OAuth error: ${detail}`);
  }

  const token = payload.access_token;
  const expiresIn = Number(payload.expires_in) || 7200;
  if (!token) throw new Error("eBay OAuth returned no access token.");

  cachedToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return token;
}

function normalizeSoldItem(raw: Record<string, unknown>): EbaySoldItem | null {
  if (!raw || typeof raw !== "object") return null;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const lastSold = raw.lastSoldPrice as { value?: unknown } | undefined;
  const price = raw.price as { value?: unknown } | undefined;
  const bid = raw.currentBidPrice as { value?: unknown } | undefined;
  const priceValue = lastSold?.value ?? price?.value ?? bid?.value ?? null;
  const priceCents = dollarsToCents(priceValue);
  if (!title || priceCents == null) return null;

  const condition =
    typeof raw.condition === "string"
      ? raw.condition
      : typeof raw.conditionId === "string"
        ? raw.conditionId
        : "";

  return {
    itemId:
      (typeof raw.itemId === "string" && raw.itemId) ||
      (typeof raw.legacyItemId === "string" && raw.legacyItemId) ||
      null,
    title,
    priceCents,
    condition,
    soldDate:
      (typeof raw.lastSoldDate === "string" && raw.lastSoldDate) ||
      (typeof raw.itemCreationDate === "string" && raw.itemCreationDate) ||
      null,
    itemWebUrl:
      (typeof raw.itemWebUrl === "string" && raw.itemWebUrl) ||
      (typeof raw.itemHref === "string" && raw.itemHref) ||
      null,
  };
}

/** Search eBay sold items (last ~90 days) via Marketplace Insights. */
export async function fetchEbaySoldItems(
  query: EbaySoldQuery = {},
  env: Env = process.env,
): Promise<EbaySoldItem[]> {
  const q = buildEbaySearchQuery(query);
  if (!q) return [];

  const token = await getAppAccessToken(env);
  const categoryId = env.EBAY_CYCLING_CATEGORY_ID || DEFAULT_CYCLING_CATEGORY_ID;
  const limit = Math.min(Math.max(Number(env.EBAY_SOLD_LIMIT) || 50, 1), 50);

  const url = new URL(INSIGHTS_SEARCH_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  if (categoryId) url.searchParams.set("category_ids", String(categoryId));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": env.EBAY_MARKETPLACE_ID || "EBAY_US",
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    itemSales?: Record<string, unknown>[];
    itemSummaries?: Record<string, unknown>[];
    errors?: Array<{ message?: string }>;
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const detail =
      payload.errors?.[0]?.message ||
      payload.error_description ||
      payload.error ||
      response.statusText;
    if (response.status === 403) {
      throw new Error(
        "eBay denied Marketplace Insights access (403). Confirm sold-data API approval and scopes.",
      );
    }
    throw new Error(`eBay sold search failed: ${detail}`);
  }

  const items = Array.isArray(payload.itemSales)
    ? payload.itemSales
    : Array.isArray(payload.itemSummaries)
      ? payload.itemSummaries
      : [];

  return items
    .map((row) => normalizeSoldItem(row))
    .filter((row): row is EbaySoldItem => Boolean(row));
}

/** End-to-end estimate from eBay sold comps. */
export async function estimateEbaySoldValue(
  query: EbaySoldQuery = {},
  env: Env = process.env,
): Promise<EbaySoldEstimateResult> {
  if (!ebaySoldConfigured(env)) {
    return {
      available: false,
      source: "ebay_sold_comps",
      sampleSize: 0,
      lowCents: null,
      midCents: null,
      highCents: null,
      confidence: "None",
      comps: [],
      disclaimer:
        "Estimate is based on recent eBay sold listings for similar bikes/parts — not Cycle Found asks, and not an appraisal.",
      message:
        "eBay sold comps are not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET (Marketplace Insights access required).",
    };
  }

  const soldItems = await fetchEbaySoldItems(query, env);
  return estimateFromEbaySoldItems(soldItems, query);
}
