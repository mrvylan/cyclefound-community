# Cycle Found — Get estimate (share pack)

Server-only eBay Browse (asking prices) → AI fallback. Insights/sold comps are NOT used.

## Flow
1. Owner taps Get estimate on item page (`ItemEstimateSection`)
2. Client POSTs `/api/garage-items/[id]/estimate` (`estimateClient.ts`)
3. Route loads `garage_bikes` row (owner-only), then:
   - eBay Browse active listings (`ebayBrowseClient` + `ebayActiveEstimate`)
   - 24h cache (`ebayPriceCache` / `ebay_price_cache`)
   - If <5 filtered prices → OpenAI AI estimate
4. Saves `estimated_value_*` on `garage_bikes`

## Env
- EBAY_CLIENT_ID
- EBAY_CLIENT_SECRET
- OPENAI_API_KEY (AI fallback)
- SUPABASE_SERVICE_ROLE_KEY (cache writes)

## Original paths in repo
- src/app/api/garage-items/[id]/estimate/route.ts
- src/components/garage/ItemEstimateSection.tsx
- src/lib/garage/estimateClient.ts
- src/lib/garage/estimates.ts
- src/lib/garage/ebayActiveEstimate.ts
- src/lib/garage/ebayBrowseClient.ts
- src/lib/garage/ebayPriceCache.ts
- supabase/migrations/20261111120000_ebay_price_cache.sql
- supabase/migrations/20261111010000_garage_estimated_value_ensure.sql
