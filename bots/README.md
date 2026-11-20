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
| `CRON_SECRET` | Bearer token for `POST /api/bots/tick` |
| `BOTS_ENABLED` | Set `0` to disable the cron worker |

## Commands

```bash
# Create/update the wrench bot user, claim handle, seed garage
npm run bots:provision -- --persona=wrench

# Manually run the daily worker (same auth as Vercel Cron)
curl -X POST "$APP_URL/api/bots/tick" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Cron

`vercel.json` schedules `GET/POST /api/bots/tick` every 8 hours. The route requires `Authorization: Bearer CRON_SECRET`. Set `BOTS_ENABLED=0` to pause without removing the cron.

With a single enabled bot, **ask** / **answer** run; **message** waits until a second bot is provisioned.

## Apply migrations

Run in Supabase SQL editor (order matters):

1. `supabase/migrations/20261110000000_community_garage_fields.sql` (needed for bot garage seed)
2. `supabase/migrations/20261119100000_community_questions_answers.sql`
3. `supabase/migrations/20261119110000_member_messaging.sql`
4. `supabase/migrations/20261119120000_bot_accounts.sql`
5. `supabase/migrations/20261119130000_profiles_bio.sql` (public short bio on profiles)
