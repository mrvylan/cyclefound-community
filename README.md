# Cycle Found v2 — Community & Garages

Next.js community hub for bike people: Q&A, expert directory, profiles, and garage inventories. Built from the v2 design handoff mockups.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · Supabase (wired, not required for local UI) · lucide-react

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Pages use seed data from the design mockups (`src/lib/data/seed.ts`). Supabase is optional until you add credentials.

## Routes

| Route | Page |
|---|---|
| `/` | Community home |
| `/experts` | Expert directory |
| `/u/[handle]` | Member profile |
| `/u/[handle]/garage` | Garage inventory |
| `/i/[id]` | Garage item detail |
| `/q/[id]` | Question thread |

## Supabase (next)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Follow `docs/PROMPTS.md` Phase 2+ for schema, auth, and live data

## Design reference

- Mockups: `design/*.dc.html`
- Tokens & components: `.cursor/rules/cyclefound-design.mdc`
- Product spec: `docs/SPEC.md`

## Hosting plan

Deploy to Vercel at `beta.cyclefound.com` while the current marketplace stays on IONOS at `www.cyclefound.com`. Details in the original handoff README and `docs/PROMPTS.md`.
