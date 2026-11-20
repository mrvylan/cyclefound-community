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
  type PersonaGarageItem,
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

async function loadPhotoBytes(
  photoUrl: string | undefined,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const src = String(photoUrl || "").trim();
  if (!src) return null;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    return { bytes, contentType };
  }

  const path = resolve(process.cwd(), src);
  if (!existsSync(path)) {
    console.warn(`Photo file missing: ${path}`);
    return null;
  }
  const lower = path.toLowerCase();
  const contentType = lower.endsWith(".png")
    ? "image/png"
    : lower.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  return { bytes: readFileSync(path), contentType };
}

async function upsertCoverPhoto(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  bikeId: string,
  item: PersonaGarageItem,
) {
  const photo = await loadPhotoBytes(item.photoUrl);
  if (!photo) return false;

  const ext =
    photo.contentType === "image/png"
      ? "png"
      : photo.contentType === "image/webp"
        ? "webp"
        : "jpg";
  const photoId = crypto.randomUUID();
  const storagePath = `${userId}/${bikeId}/${photoId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("garage-photos")
    .upload(storagePath, photo.bytes, {
      contentType: photo.contentType,
      upsert: false,
    });
  if (upErr) {
    console.warn(`Photo upload failed for ${item.title}:`, upErr.message);
    return false;
  }

  // Replace prior covers so re-provision can swap in new art.
  await supabase.from("garage_bike_photos").delete().eq("bike_id", bikeId);

  const { error: rowErr } = await supabase.from("garage_bike_photos").insert({
    bike_id: bikeId,
    storage_path: storagePath,
    sort_order: 0,
    is_cover: true,
    content_type: photo.contentType,
    byte_size: photo.bytes.length,
  });
  if (rowErr) {
    console.warn(`Photo row failed for ${item.title}:`, rowErr.message);
    return false;
  }
  return true;
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
    const match = (existing || []).find((row) => {
      const title = String(row.title || "").trim();
      const composed = `${row.manufacturer_name || ""} ${row.model_name || ""}`.trim();
      return title === item.title || composed === item.title;
    });

    if (match?.id) {
      const ok = await upsertCoverPhoto(supabase, userId, match.id, item);
      console.log(
        ok
          ? `Garage photo updated: ${item.title} (${match.id})`
          : `Garage skip (exists, no photo): ${item.title}`,
      );
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

    const ok = await upsertCoverPhoto(supabase, userId, bike.id, item);
    console.log(
      ok
        ? `Garage seeded: ${item.title} (${bike.id})`
        : `Garage seeded (no photo): ${item.title} (${bike.id})`,
    );
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

  const profilePatch: Record<string, unknown> = {
    handle: persona.handle.toLowerCase(),
    handle_changed_at: new Date().toISOString(),
    display_name: persona.displayName || null,
    full_name: persona.fullName,
    city: persona.city || null,
    state: persona.state || null,
    bio: persona.bio?.trim() || null,
    is_bot: true,
    is_founding_member: false,
    member_number: null,
  };

  let { error: profileErr } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", userId);

  // Bio column may not be migrated yet — retry without it.
  if (profileErr?.message?.toLowerCase().includes("bio")) {
    console.warn(`Profile bio skipped: ${profileErr.message}`);
    delete profilePatch.bio;
    ({ error: profileErr } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", userId));
  }

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
