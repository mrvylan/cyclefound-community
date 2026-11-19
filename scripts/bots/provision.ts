/**
 * Provision a bot persona: auth user → profile handle → garage seed → bot_accounts.
 *
 * Usage:
 *   npm run bots:provision -- --persona=wrench
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and BOT_<SLUG>_PASSWORD (e.g. BOT_WRENCH_PASSWORD).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  adminClient,
  askToCents,
  loadPersona,
  statusToDb,
  waitForProfile,
  type Persona,
} from "./lib";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function argValue(flag: string): string | undefined {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex((a) => a === flag || a.startsWith(`${flag}=`));
  if (idx < 0) return undefined;
  const a = argv[idx]!;
  if (a.includes("=")) return a.split("=").slice(1).join("=");
  return argv[idx + 1];
}

async function ensureUser(persona: Persona, password: string) {
  const supabase = adminClient();
  const { data: listed } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = listed?.users?.find(
    (u) => u.email?.toLowerCase() === persona.email.toLowerCase(),
  );

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: persona.fullName,
        bot_persona: persona.slug,
      },
    });
    console.log(`Updated auth user ${existing.id} (${persona.email})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: persona.fullName,
      bot_persona: persona.slug,
    },
  });
  if (error || !data.user) {
    throw new Error(error?.message || "Could not create auth user.");
  }
  console.log(`Created auth user ${data.user.id} (${persona.email})`);
  return data.user.id;
}

async function seedGarage(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  persona: Persona,
) {
  const items = persona.garage || [];
  if (!items.length) {
    console.log("No garage items in persona.");
    return;
  }

  const { data: existing } = await supabase
    .from("garage_bikes")
    .select("id, title, manufacturer_name, model_name")
    .eq("owner_id", userId);

  for (const item of items) {
    const already = (existing || []).some((row) => {
      const title = String(row.title || "").trim();
      const composed = `${row.manufacturer_name || ""} ${row.model_name || ""}`.trim();
      return title === item.title || composed === item.title;
    });
    if (already) {
      console.log(`Garage skip (exists): ${item.title}`);
      continue;
    }

    const status = statusToDb(item.status);
    const askCents =
      status === "not_for_sale" || status === "trade_only"
        ? null
        : askToCents(item.askingPrice);
    const brand = String(item.manufacturer || "").trim();
    const model = item.title
      .replace(new RegExp(`^${brand}\\b[\\s\\-–—:]*`, "i"), "")
      .trim() || item.title;

    const { data: bike, error } = await supabase
      .from("garage_bikes")
      .insert({
        owner_id: userId,
        manufacturer_name: brand || "Unknown",
        model_name: model,
        approximate_year: item.year || null,
        bike_type: item.discipline || null,
        condition: item.condition || null,
        notes: item.notes || "",
        modifications: item.description || null,
        item_kind:
          item.category === "Complete bikes" || item.category === "Framesets"
            ? "bike"
            : "part",
        part_category:
          item.category === "Complete bikes" || item.category === "Framesets"
            ? null
            : item.category,
        open_to_offers: item.status === "Open to offers",
        purchase_price_cents: askCents,
        title: item.title,
        category: item.category,
        discipline: item.discipline || null,
        description: item.description || null,
        provenance: item.provenance || null,
        status,
        asking_price_cents: askCents,
        is_public: true,
        ai_identification: {
          cf: {
            v: 1,
            title: item.title,
            category: item.category,
            status: item.status,
            description: item.description,
          },
        },
      })
      .select("id")
      .maybeSingle();

    if (error || !bike?.id) {
      console.warn(`Garage insert failed for ${item.title}:`, error?.message);
      continue;
    }

    if (item.photoUrl?.startsWith("http")) {
      try {
        const res = await fetch(item.photoUrl);
        if (res.ok) {
          const blob = Buffer.from(await res.arrayBuffer());
          const photoId = crypto.randomUUID();
          const storagePath = `${userId}/${bike.id}/${photoId}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("garage-photos")
            .upload(storagePath, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });
          if (!upErr) {
            await supabase.from("garage_bike_photos").insert({
              bike_id: bike.id,
              storage_path: storagePath,
              sort_order: 0,
              is_cover: true,
              content_type: "image/jpeg",
              byte_size: blob.length,
            });
          }
        }
      } catch (err) {
        console.warn(`Photo seed failed for ${item.title}:`, err);
      }
    }

    console.log(`Garage seeded: ${item.title} (${bike.id})`);
  }
}

async function main() {
  loadEnvLocal();
  const slug = argValue("--persona") || "wrench";
  const persona = loadPersona(slug);
  const envKey = `BOT_${slug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_PASSWORD`;
  const password = process.env[envKey]?.trim();
  if (!password || password.length < 12) {
    throw new Error(
      `Set ${envKey} to a password (≥12 chars) before provisioning.`,
    );
  }

  const supabase = adminClient();
  const userId = await ensureUser(persona, password);
  await waitForProfile(supabase, userId);

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      handle: persona.handle.toLowerCase(),
      handle_changed_at: new Date().toISOString(),
      display_name: persona.displayName || null,
      full_name: persona.fullName,
      city: persona.city || null,
      state: persona.state || null,
      is_bot: true,
      is_founding_member: false,
      member_number: null,
    })
    .eq("id", userId);

  if (profileErr) {
    throw new Error(`Profile update failed: ${profileErr.message}`);
  }
  console.log(`Profile @${persona.handle} ready (is_bot=true)`);

  await supabase.from("bot_accounts").upsert(
    {
      user_id: userId,
      persona_slug: persona.slug,
      enabled: true,
      config: {
        skills: persona.skills || [],
        voice: persona.voice || "",
        bio: persona.bio || "",
        playbook: persona.playbook || {},
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  console.log(`bot_accounts row upserted for ${persona.slug}`);

  await seedGarage(supabase, userId, persona);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
