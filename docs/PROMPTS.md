# Cursor prompts — one phase per chat

Start each phase in a **new Cursor chat** (Agent mode). Paste the prompt, review the plan Cursor proposes, let it build, run it locally (`npm run dev`), then commit:
`git add -A && git commit -m "Phase N: …"`.

If something drifts from the design, tell Cursor: "Compare against `design/<File>.dc.html` and the screenshot, and fix the differences."

---

## Phase 0 — Project setup
```
Read README.md, docs/SPEC.md and .cursor/rules/cyclefound-design.mdc.
Scaffold a Next.js (App Router, TypeScript) app in this folder with Tailwind and ESLint.
Add the color tokens, fonts (Archivo with width axis, IBM Plex Sans, IBM Plex Mono via next/font) and radii from the rules file to tailwind.config.ts.
Install @supabase/supabase-js and @supabase/ssr and create lib/supabase (server + browser clients) reading NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
Create .env.example. Don't build any pages yet. Explain what I need to create in Supabase.
```

## Phase 1 — Shared layout and components
```
Using design/Main.dc.html as the reference, build the SiteHeader and footer in app/layout.tsx, then the shared components listed in the rules file
(Avatar, RatingStars, SpokesCount, LevelBadge, ExpertiseBadge, StatusChip, TagChip, FilterChip, SegmentedControl, PersonRow).
Make a /styleguide page that shows every component with sample props so I can check them against the mockups.
Header must wrap correctly at phone width.
```

## Phase 2 — Database schema and seed data
```
Turn the data model in docs/SPEC.md into Supabase SQL migrations in supabase/migrations, including enums, foreign keys, indexes and row-level security policies
(public read for public content, owner-only writes; spokes_events and profile aggregates written only through security-definer functions).
Add a trigger that keeps profiles.spokes_total and level in sync with spokes_events, and one that keeps rating_avg/rating_count in sync with reviews.
Write supabase/seed.sql using the sample people, garages, items, questions and answers from the renderVals() blocks in design/*.dc.html.
```

## Phase 3 — Auth and profiles
```
Add Supabase auth (email magic link + Google). On first sign-in, run an onboarding flow: handle, display name, location, bio, expertise areas (pick up to 5), avatar upload.
Build /u/[handle] to match design/Profile.dc.html exactly: hero, stats row, expertise endorsement bars, Spokes breakdown, badges, services, contribution calendar (from spokes_events, last 26 weeks), and tabs Garage / Answers / Builds / Reviews with real data.
Add /settings/profile to edit everything. Follow and Endorse buttons should work.
```

## Phase 4 — Garages and items
```
Build /u/[handle]/garage to match design/Garage.dc.html (header stats, value-by-category bar, category chips, availability filter, grid/table toggle, wanted list, activity feed),
and /i/[id] to match design/Item.dc.html (gallery, status, owner card, market value range + trend bars with 1Y/5Y/All, asking price, Make offer / Ask / Watch, specs, notes, provenance, same model in other garages, linked resources, compatible parts, people who know this).
Add /garage/new-item: a multi-step form (category → basics → photos → specs → condition & originality → value & status) that saves drafts. Award Spokes once an item has photos, specs and a value.
```

## Phase 5 — Questions and answers
```
Build the ask flow (from the home page ask box and the header button): title, body, topic, tags, photos, optional linked garage item, optional Spokes bounty.
Build /q/[id] to match design/Question.dc.html: votes, follow, answers sorted by expertise, accept answer (asker only), replies, tips in Spokes, linking garage items inside an answer, and the sidebar.
Implement question routing from docs/SPEC.md and notifications (in-app plus email via Supabase or Resend).
All Spokes changes go through the spokes_events ledger.
```

## Phase 6 — Home and expert directory
```
Build / to match design/Main.dc.html with live data: ask box with topic chips and a live "routed to N members" count, experts online now (seen in the last 15 minutes), feed tabs (Trending, Unanswered, Rare parts, Repairs, Builds), top contributors this month, wanted board, expertise areas, featured garages.
Build /experts to match design/Experts.dc.html with server-side filtering (expertise, distance from a location, minimum rating, availability, level) and sorting.
```

## Phase 7 — Reviews, wanted board, resources, messages
```
Add reviews, only allowed after a real interaction (accepted answer, consult, tool loan, trade or sale).
Add wanted posts and automatic matching against garage items (category + brand/model text similarity) with a notification to both people.
Add resource guides (markdown editor, linking to items, models, questions and areas) and show them in the item page resource hub and the question sidebar.
Add direct messages and an offers inbox.
```

## Phase 8 — Import the v1 site and launch the beta
```
The old site is at <PATH TO OLD SITE FOLDER> (static HTML/CSS/JS). Inspect it and tell me where listings and seller details come from before writing anything.
Then write scripts/import-v1.ts: each seller becomes a profile + garage, each listing an item with status 'for_sale', price as asking price, photos uploaded to Supabase storage, original URL saved in items.legacy_url.
Add a dry-run mode that prints what it would import.
Then prepare for deploy on Vercel at beta.cyclefound.com: environment variables, image domains, a robots noindex while in beta, and an invite-only sign-up gate.
```

## Cutover (later)
```
Generate next.config redirects from items.legacy_url to /i/[id] and from old pages to their new equivalents. Remove the noindex and the invite gate.
Give me a checklist for pointing www.cyclefound.com at Vercel in IONOS DNS and moving the old site to classic.cyclefound.com.
```
