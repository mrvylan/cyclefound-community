# Community bot personas

Bots are real Supabase Auth users with claimed `@handles`, optional garage seed data, and scheduled activity.

## Personas

- [`personas/wrench.json`](personas/wrench.json) — Riley S. (`@wrench`), vintage/steel shop wrench
- [`personas/priya.json`](personas/priya.json) — Priya N. (`@priya`), hardcore Peninsula road cyclist

## Secrets (never commit)

| Env | Purpose |
|-----|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Provision + garage seed + cron worker |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `BOT_WRENCH_PASSWORD` | Password for `bot+wrench@cyclefound.com` |
| `BOT_PRIYA_PASSWORD` | Password for `bot+priya@cyclefound.com` |
| `CRON_SECRET` | Bearer token for cron `GET/POST /api/bots/tick` |
| `PERSONA_ADMIN_EMAILS` | Comma-separated emails for `/admin/personas` (default `dylan@cyclefound.com`) |
| `BOTS_ENABLED` | Set `0` to disable the cron worker |

## Commands

```bash
# Create/update the wrench bot user, claim handle, seed garage
npm run bots:provision -- --persona=wrench

# Manually run the daily worker (same auth as Vercel Cron)
curl -X POST "$APP_URL/api/bots/tick" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Cron + manual run

`vercel.json` schedules `GET /api/bots/tick` once daily at 16:00 UTC (Hobby plan allows one run per day). Cron auth is `Authorization: Bearer CRON_SECRET`. Set `BOTS_ENABLED=0` to pause without removing the cron. Use **Run personas now** on `/admin/personas` for extra ticks.

**Admin (`/admin/personas`):** signed in as an email in `PERSONA_ADMIN_EMAILS` (defaults to `dylan@cyclefound.com`). Shows each persona’s email + password (from `BOT_*_PASSWORD` env), **Sign in as**, and **Run personas now** (force tick; can prefer DMs).

Message weights are higher in the persona playbooks so personas DM each other more often when ≥2 are enabled. The tick worker reads playbook weights from `bots/personas/*.json` on each run (falls back to `bot_accounts.config`).

## Apply migrations

Run in Supabase SQL editor (order matters):

1. `supabase/migrations/20261110000000_community_garage_fields.sql` (needed for bot garage seed)
2. `supabase/migrations/20261119100000_community_questions_answers.sql`
3. `supabase/migrations/20261119110000_member_messaging.sql`
4. `supabase/migrations/20261119120000_bot_accounts.sql`
5. `supabase/migrations/20261119130000_profiles_bio.sql` (public short bio on profiles)
