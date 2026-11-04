# Cycle Found v2 — Product spec

## Vision
A community hub for bike people. Members are the product: their expertise, reputation and garages. Q&A, repair help, rare-part hunting and builds come first. Buying and selling happens inside garages, as a secondary action.

## Pages (mockup → route)
| Mockup | Route | Purpose |
|---|---|---|
| `Main.dc.html` | `/` | Ask box with topic routing, experts online, question feed with tabs, top contributors, wanted board, expertise areas, featured garages |
| `Question.dc.html` | `/q/[id]` | Question with photos and linked garage item, Spokes bounty, answers sorted by expertise, accepted answer, replies, tips, linked garage items in answers; sidebar: experts on topic, parts in garages, guides, related |
| `Experts.dc.html` | `/experts` | Directory filtered by expertise, location radius, minimum rating, availability, level; sortable |
| `Profile.dc.html` | `/u/[handle]` | Hero (avatar, level, verified, bio, Ask/Message/Follow), stats, expertise endorsements, Spokes breakdown, badges, services, contribution calendar, tabs: Garage / Answers / Builds / Reviews |
| `Garage.dc.html` | `/u/[handle]/garage` | Garage header and stats, value-by-category bar, category filter, availability filter, grid/table toggle, owner's wanted list, activity feed |
| `Item.dc.html` | `/i/[id]` | Gallery, status, owner, market value range + trend, owner asking price, offer / ask / watch, specs, owner notes, provenance timeline, same model in other garages, resource hub, compatible parts nearby, people who know this item |

Also needed (not mocked yet): sign up / onboarding, edit profile, add/edit garage item, ask-question composer, messages inbox, notifications, search results, resource guide page.

## Data model (Supabase / Postgres)

```sql
profiles        (id uuid pk → auth.users, handle text unique, display_name, avatar_url, cover_url,
                 bio, location_text, lat, lng, member_since, reply_time_label,
                 is_verified bool, level text, spokes_total int default 0,
                 rating_avg numeric, rating_count int)
expertise_areas (id, slug, name)                                  -- 'vintage-restoration', 'wheelbuilding'…
profile_expertise (profile_id, area_id, verified bool, endorsement_count int)
endorsements    (endorser_id, profile_id, area_id, created_at)
services        (id, profile_id, kind enum('questions','video_consult','restoration','tool_lending','in_person'),
                 price_label, status_label)

garages         (id, owner_id unique, name, description, followers_count, updated_at)
items           (id, garage_id, category enum('complete_bike','frameset','groupset','component','wheels','tool','apparel','other'),
                 title, brand, model, year int, size_label, condition enum('new','excellent','very_good','good','fair','project'),
                 originality_pct int, notes text,
                 status enum('not_for_sale','open_to_offers','for_sale','trade_only'),
                 asking_price_cents int null, market_low_cents int, market_high_cents int, market_median_cents int,
                 market_updated_at, created_at)
item_specs      (item_id, key, value, sort)
item_photos     (id, item_id, url, caption, sort)
item_history    (id, item_id, year_label, text, sort)
item_value_points (item_id, month date, median_cents)             -- trend chart
watches         (user_id, item_id)
offers          (id, item_id, from_id, amount_cents, message, status, created_at)

questions       (id, author_id, title, body, topic_area_id, bounty_spokes int default 0,
                 linked_item_id null, accepted_answer_id null, views int, created_at)
question_tags   (question_id, tag)
question_photos (id, question_id, url, sort)
answers         (id, question_id, author_id, body, created_at)
answer_items    (answer_id, item_id)                              -- garage items linked in an answer
replies         (id, answer_id, author_id, body, created_at)
votes           (user_id, target_type enum('question','answer'), target_id, value smallint)
follows         (follower_id, target_type enum('profile','garage','question'), target_id)

reviews         (id, reviewer_id, profile_id, context enum('answer','consult','tool_loan','trade','sale'),
                 stars smallint 1..5, text, created_at)
spokes_events   (id, profile_id, kind, amount int, source_type, source_id, created_at)   -- ledger
badges          (id, slug, name, mark)   profile_badges (profile_id, badge_id, awarded_at)

wanted_posts    (id, author_id, title, description, category, status, created_at)
wanted_matches  (wanted_id, item_id, score)                       -- computed

resources       (id, author_id, kind enum('guide','reference'), title, body_md, saves int)
resource_links  (resource_id, target_type enum('item_model','item','question','area'), target_id)
messages, conversations                                           -- standard DM tables
```

Row-level security: anyone can read public profiles, garages, items, questions and answers. Only the owner can write their own rows. `spokes_events`, `rating_avg` and `level` are written only by database functions or server code.

## Spokes (reputation)
Ledger-based: every change is a row in `spokes_events`, and `profiles.spokes_total` is the sum. Starting values (tune later):

| Event | Spokes |
|---|---|
| Your answer gets an upvote | +10 |
| Your answer is accepted | +25 (+ bounty) |
| Your question gets an upvote | +5 |
| Documented garage item (photos + specs + value) | +15, once per item |
| Resource guide published | +50; +2 per save |
| Tip from a member | amount tipped (moved from tipper) |
| Answer downvote | −2 |
| Offering a bounty | −bounty from asker |

Levels: Rider < 2,500 · Pro 2,500–9,999 · Master 10,000–14,999 · Legend 15,000+.
The contribution calendar is the daily sum of `spokes_events`.

## Ratings
Reviews can only be left after a real interaction: an accepted answer, a consult, a tool loan, a trade or a sale. `rating_avg` shows with one decimal place; a profile with fewer than 3 reviews shows "New".

## Question routing
When a question is posted with a topic, notify members who have verified expertise in that area, sorted by rating, then Spokes, then distance. Cap at 25 notifications per question. The ask box shows "routed to N members with … expertise".

## Market value
Phase 1: the owner enters a range, and members can submit appraisals (median shown). Later: comparable sales from completed trades on the platform. Always label values as estimates.

## Migrating the v1 site
The current site is static HTML/CSS/JS. Find where listings live (hard-coded HTML, a JSON file, a form service or an API). Write a one-off import script: each seller becomes a `profile` with a `garage`, and each listing becomes an `item` with `status='for_sale'`, `asking_price` = listing price, and photos copied into Supabase storage. Keep a `legacy_url` column on items to generate 301 redirects at cutover.
