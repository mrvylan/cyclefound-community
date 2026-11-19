import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { orderedPair } from "@/lib/messaging/memberMessagingServer";

export type BotPlaybook = {
  maxActionsPerDay?: number;
  quietHoursLocal?: { start: number; end: number; tz?: string };
  weights?: { ask?: number; answer?: number; message?: number };
  askTemplates?: Array<{ intent: string; title: string; body: string }>;
  messageTemplates?: string[];
};

export type BotAccountRow = {
  user_id: string;
  persona_slug: string;
  enabled: boolean;
  last_acted_at: string | null;
  actions_today: number;
  actions_day: string | null;
  config: {
    playbook?: BotPlaybook;
    skills?: string[];
    voice?: string;
    bio?: string;
  } | null;
};

function service(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase service role not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Deterministic 0..1 from date + bot id + salt. */
export function seededUnit(dateKey: string, botId: string, salt: string): number {
  const raw = `${dateKey}:${botId}:${salt}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function todayKeyInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function localHour(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour = parts.find((p) => p.type === "hour")?.value;
    return Number(hour) || 0;
  } catch {
    return new Date().getUTCHours();
  }
}

function inQuietHours(
  playbook: BotPlaybook | undefined,
): boolean {
  const q = playbook?.quietHoursLocal;
  if (!q) return false;
  const tz = q.tz || "America/Los_Angeles";
  const hour = localHour(tz);
  const start = q.start ?? 22;
  const end = q.end ?? 7;
  if (start === end) return false;
  if (start > end) {
    // e.g. 22–7
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}

type ActionKind = "ask" | "answer" | "message";

function pickAction(
  playbook: BotPlaybook | undefined,
  dateKey: string,
  botId: string,
  hasPeer: boolean,
  hasOpenQuestion: boolean,
): ActionKind | null {
  const weights = {
    ask: playbook?.weights?.ask ?? 60,
    answer: playbook?.weights?.answer ?? 30,
    message: playbook?.weights?.message ?? 10,
  };
  const entries: Array<{ kind: ActionKind; w: number }> = (
    [
      { kind: "ask" as const, w: weights.ask },
      { kind: "answer" as const, w: hasOpenQuestion ? weights.answer : 0 },
      { kind: "message" as const, w: hasPeer ? weights.message : 0 },
    ] satisfies Array<{ kind: ActionKind; w: number }>
  ).filter((e) => e.w > 0);

  if (!entries.length) return null;

  const total = entries.reduce((s, e) => s + e.w, 0);
  let roll = seededUnit(dateKey, botId, "action") * total;
  for (const e of entries) {
    roll -= e.w;
    if (roll <= 0) return e.kind;
  }
  return entries[entries.length - 1]!.kind;
}

async function insertAsk(
  admin: SupabaseClient,
  bot: BotAccountRow,
  dateKey: string,
): Promise<{ action: string; targetId: string }> {
  const templates = bot.config?.playbook?.askTemplates || [];
  if (!templates.length) {
    throw new Error(`No ask templates for ${bot.persona_slug}`);
  }
  const idx = Math.floor(
    seededUnit(dateKey, bot.user_id, "ask-idx") * templates.length,
  );
  const tpl = templates[Math.min(idx, templates.length - 1)]!;
  const tags = [
    tpl.intent,
    ...(bot.config?.skills || []).slice(0, 3),
  ]
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 8);

  const { data, error } = await admin
    .from("community_questions")
    .insert({
      asker_id: bot.user_id,
      title: tpl.title.slice(0, 200),
      body: tpl.body.slice(0, 8000),
      tags,
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(error?.message || "Could not insert question.");
  }
  return { action: "ask", targetId: data.id };
}

async function insertAnswer(
  admin: SupabaseClient,
  bot: BotAccountRow,
  dateKey: string,
): Promise<{ action: string; targetId: string } | null> {
  const { data: open } = await admin
    .from("community_questions")
    .select("id, title, asker_id")
    .eq("solved", false)
    .neq("asker_id", bot.user_id)
    .order("created_at", { ascending: false })
    .limit(20);

  const candidates = (open || []).filter(
    (q) => String((q as { asker_id: string }).asker_id) !== bot.user_id,
  );
  if (!candidates.length) return null;

  const idx = Math.floor(
    seededUnit(dateKey, bot.user_id, "answer-idx") * candidates.length,
  );
  const q = candidates[Math.min(idx, candidates.length - 1)] as {
    id: string;
    title: string;
  };

  const body =
    `On “${q.title.slice(0, 80)}”: from the shop floor I’d start with the basics — ` +
    `confirm fitment, check for corrosion/seized fasteners, and work patiently with penetrating oil before heat. ` +
    `Happy to dig in further if you share year/make and what you’ve already tried.`;

  const { data, error } = await admin
    .from("community_answers")
    .insert({
      question_id: q.id,
      author_id: bot.user_id,
      body: body.slice(0, 8000),
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(error?.message || "Could not insert answer.");
  }
  return { action: "answer", targetId: data.id };
}

async function insertMessage(
  admin: SupabaseClient,
  bot: BotAccountRow,
  peerId: string,
  peerHandle: string,
  dateKey: string,
): Promise<{ action: string; targetId: string }> {
  const templates = bot.config?.playbook?.messageTemplates || [];
  if (!templates.length) {
    throw new Error(`No message templates for ${bot.persona_slug}`);
  }
  const idx = Math.floor(
    seededUnit(dateKey, bot.user_id, "msg-idx") * templates.length,
  );
  let body = templates[Math.min(idx, templates.length - 1)]!;
  if (body.length < 20) {
    body = `${body} Curious what you’re running these days.`;
  }

  const [a, b] = orderedPair(bot.user_id, peerId);
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("member_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .eq("kind", "member")
    .is("item_id", null)
    .maybeSingle();

  let threadId = String(existing?.id || "");
  if (!threadId) {
    const { data: created, error } = await admin
      .from("member_threads")
      .insert({
        kind: "member",
        participant_a: a,
        participant_b: b,
        item_id: null,
        item_title: peerHandle,
        item_href: `/u/${peerHandle}`,
        status: "open",
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle();
    if (error || !created?.id) {
      throw new Error(error?.message || "Could not create member thread.");
    }
    threadId = created.id;
  }

  const { error: msgErr } = await admin.from("member_messages").insert({
    thread_id: threadId,
    sender_id: bot.user_id,
    body: body.slice(0, 2000),
    created_at: now,
  });
  if (msgErr) {
    throw new Error(msgErr.message || "Could not send bot message.");
  }

  await admin
    .from("member_threads")
    .update({ updated_at: now, status: "open" })
    .eq("id", threadId);

  return { action: "message", targetId: threadId };
}

export type TickResult = {
  bot: string;
  skipped?: string;
  action?: string;
  targetId?: string;
  error?: string;
};

export async function runBotTick(): Promise<{
  ok: boolean;
  results: TickResult[];
  disabled?: boolean;
}> {
  if (process.env.BOTS_ENABLED === "0") {
    return { ok: true, results: [], disabled: true };
  }

  const admin = service();
  const { data: bots, error } = await admin
    .from("bot_accounts")
    .select(
      "user_id, persona_slug, enabled, last_acted_at, actions_today, actions_day, config",
    )
    .eq("enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (bots || []) as BotAccountRow[];
  const results: TickResult[] = [];
  const peerPool = rows.map((b) => b.user_id);

  // Resolve handles for peers
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, handle")
    .in("id", peerPool);
  const handleById = new Map<string, string>();
  for (const p of profiles || []) {
    const h = String((p as { handle?: string }).handle || "").trim();
    if (h) handleById.set(String((p as { id: string }).id), h);
  }

  for (const bot of rows) {
    const playbook = bot.config?.playbook;
    const tz = playbook?.quietHoursLocal?.tz || "America/Los_Angeles";
    const dateKey = todayKeyInTz(tz);
    const maxActions = playbook?.maxActionsPerDay ?? 2;

    if (inQuietHours(playbook)) {
      results.push({ bot: bot.persona_slug, skipped: "quiet_hours" });
      continue;
    }

    let actionsToday = bot.actions_today || 0;
    if (bot.actions_day !== dateKey) {
      actionsToday = 0;
    }
    if (actionsToday >= maxActions) {
      results.push({ bot: bot.persona_slug, skipped: "daily_cap" });
      continue;
    }

    // At most one action per tick wave unless under cap and roll says go.
    const shouldAct = seededUnit(dateKey, bot.user_id, `wave-${actionsToday}`) > 0.15;
    if (!shouldAct && actionsToday > 0) {
      results.push({ bot: bot.persona_slug, skipped: "cooldown" });
      continue;
    }

    const peers = peerPool.filter((id) => id !== bot.user_id);
    const hasPeer = peers.length > 0;

    const { count: openCount } = await admin
      .from("community_questions")
      .select("id", { count: "exact", head: true })
      .eq("solved", false)
      .neq("asker_id", bot.user_id);

    const action = pickAction(
      playbook,
      dateKey,
      bot.user_id,
      hasPeer,
      (openCount || 0) > 0,
    );

    if (!action) {
      results.push({ bot: bot.persona_slug, skipped: "no_action" });
      continue;
    }

    try {
      let outcome: { action: string; targetId: string } | null = null;
      if (action === "ask") {
        outcome = await insertAsk(admin, bot, dateKey);
      } else if (action === "answer") {
        outcome = await insertAnswer(admin, bot, dateKey);
        if (!outcome) {
          outcome = await insertAsk(admin, bot, dateKey);
        }
      } else if (action === "message") {
        const peerIdx = Math.floor(
          seededUnit(dateKey, bot.user_id, "peer") * peers.length,
        );
        const peerId = peers[Math.min(peerIdx, peers.length - 1)]!;
        const peerHandle = handleById.get(peerId) || "member";
        outcome = await insertMessage(admin, bot, peerId, peerHandle, dateKey);
      }

      if (!outcome) {
        results.push({ bot: bot.persona_slug, skipped: "noop" });
        continue;
      }

      const now = new Date().toISOString();
      await admin.from("bot_actions").insert({
        bot_user_id: bot.user_id,
        action: outcome.action,
        target_id: outcome.targetId,
        detail: { dateKey },
      });

      await admin
        .from("bot_accounts")
        .update({
          last_acted_at: now,
          actions_today: actionsToday + 1,
          actions_day: dateKey,
          updated_at: now,
        })
        .eq("user_id", bot.user_id);

      results.push({
        bot: bot.persona_slug,
        action: outcome.action,
        targetId: outcome.targetId,
      });
    } catch (err) {
      results.push({
        bot: bot.persona_slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { ok: true, results };
}
