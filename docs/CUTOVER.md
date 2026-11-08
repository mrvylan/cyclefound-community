# Apex cutover — Community → cyclefound.com

**Date started:** 2026-11-08  
**Goal:** Community (Next.js / Vercel) serves `www` + apex; marketplace Vite app stays recoverable at `classic.cyclefound.com`. Supabase Auth users and `bike_listings` are untouched.

## Rollback (yes, you can)

1. In IONOS DNS, restore pre-cutover records (saved below).
2. Optionally remove `www` / apex from Vercel project `cyclefound-community` (or leave attached unused).
3. Revert Supabase **Site URL** / Redirect allowlist if you changed them.
4. Do **not** delete Auth users or listings — they were never migrated away.

Marketplace source archive:  
`/Users/dylansimpson/•PROJECTS/• ARCHIVES/cyclefound-marketplace-2026-11-08/`  
Git tag in Cycle-Found-Website: `archive-pre-classic-cutover-2026-11-08` (`ce84858`).

## Pre-cutover DNS snapshot (2026-11-08)

| Host | Was |
|---|---|
| `cyclefound.com` (apex) | A `74.208.236.173` (IONOS) |
| `www.cyclefound.com` | A `74.208.236.173` (IONOS) |
| `community.cyclefound.com` | CNAME → Vercel (`fb2c272ec486296f.vercel-dns-017.com`) |
| Nameservers | IONOS `ns1068.ui-dns.com`, `ns1069.ui-dns.org`, `ns1083.ui-dns.biz`, `ns1115.ui-dns.de` |

## Vercel projects

| Project | Role | Production URL |
|---|---|---|
| `cyclefound-community` | Community app (apex / www) | https://community.cyclefound.com |
| `cyclefound-classic` | Archived marketplace | https://cyclefound-classic.vercel.app |

Domains already **attached** in Vercel (pending IONOS DNS):

- Community: `www.cyclefound.com`, `cyclefound.com`, `community.cyclefound.com`
- Classic: `classic.cyclefound.com`

## IONOS DNS — apply these records

In IONOS → Domains → cyclefound.com → DNS:

| Type | Name | Value | Notes |
|---|---|---|---|
| CNAME | `classic` | `649c09e75d3b7d06.vercel-dns-017.com.` | Marketplace archive |
| CNAME | `www` | `fb2c272ec486296f.vercel-dns-017.com.` | Replace existing A on www |
| A | `@` | `216.198.79.1` | Apex → Vercel (replace `74.208.236.173`) |
| A | `@` | `64.29.17.1` | Second apex A (add both) |

Keep `community` CNAME as-is until optional redirect Community → www.

After TTL, verify:

```bash
vercel domains verify classic.cyclefound.com
vercel domains verify www.cyclefound.com
vercel domains verify cyclefound.com
```

## Supabase Auth (Dashboard — do not rotate keys)

Project: `tvqrlgttfsalcxestdjp`

**Redirect URLs — add (keep existing):**

- `https://www.cyclefound.com/auth/callback`
- `https://www.cyclefound.com/**`
- `https://cyclefound.com/auth/callback`
- `https://cyclefound.com/**`
- `https://classic.cyclefound.com/**`
- `https://classic.cyclefound.com/auth.html**`
- Keep `https://community.cyclefound.com/auth/callback` during transition

**Site URL:** set to `https://www.cyclefound.com` (Community), not classic.

Do **not** change anon / service_role / OpenAI secrets for this cutover.

## Google Cloud OAuth client

Authorized JavaScript origins — add:

- `https://www.cyclefound.com`
- `https://cyclefound.com`
- `https://classic.cyclefound.com`

Keep community + localhost. Supabase callback URI unchanged:  
`https://tvqrlgttfsalcxestdjp.supabase.co/auth/v1/callback`

## Already shipped in code / hosting

- Marketplace git freeze + local archive with `ARCHIVE.md` + checksums
- `cyclefound-classic` deployed; listing shells return HTTP 200 on `cyclefound-classic.vercel.app`
- Community `next.config.ts` 301s `/listing.html` (and other marketplace shells) → `classic.cyclefound.com` (query preserved)
- Verified: `https://community.cyclefound.com/listing.html?id=27c9b283-…` → 308 → classic
- `LEGAL_ORIGIN` / legal canonicals → `https://www.cyclefound.com`
- Listing message deep-links → `https://classic.cyclefound.com/listing.html?id=…`

## Status

| Step | Status |
|---|---|
| Marketplace archive + git tag | Done |
| Vercel `cyclefound-classic` deploy | Done (`cyclefound-classic.vercel.app`) |
| Community redirects + legal host strings | Done (commit `ce1ac44`) |
| Attach `www` / apex / `classic` in Vercel | Done |
| IONOS DNS records | **You** — login required (records above) |
| Supabase Site URL + Redirect URLs | **You** — dashboard login required |
| Google OAuth JS origins | **You** — Cloud Console |

## Smoke checklist

### Verified without classic DNS

- [x] `https://cyclefound-classic.vercel.app/listing.html?id=27c9b283-…` → HTTP 200
- [x] `https://cyclefound-classic.vercel.app/listing.html?id=b92c337c-…` → HTTP 200
- [x] `https://community.cyclefound.com/listing.html?id=27c9b283-…` → 308 → classic
- [x] `https://community.cyclefound.com/` → HTTP 200 (Community)

### After IONOS + Supabase (operator)

- [ ] `https://classic.cyclefound.com/listing.html?id=27c9b283-b71b-4e8a-8f46-65faf05e9af6` loads listing
- [ ] `https://classic.cyclefound.com/listing.html?id=b92c337c-5556-42c8-90e5-8eabdab07a31` loads listing
- [ ] `https://www.cyclefound.com/` loads Community
- [ ] `https://www.cyclefound.com/listing.html?id=27c9b283-…` 301/308 → classic and loads
- [ ] Existing user signs in on www (Community) and classic (marketplace) — same Supabase account
- [ ] Auth users (Warren, Live, Ca, Kristine, …) still present in Supabase Auth
