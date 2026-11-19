import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ws from "ws";

export type PersonaGarageItem = {
  title: string;
  year?: string;
  category: string;
  discipline?: string;
  manufacturer?: string;
  condition: string;
  status: string;
  askingPrice?: string;
  description?: string;
  notes?: string;
  provenance?: string;
  photoUrl?: string;
};

export type Persona = {
  slug: string;
  email: string;
  handle: string;
  displayName: string;
  fullName: string;
  city?: string;
  state?: string;
  bio?: string;
  skills?: string[];
  voice?: string;
  garage?: PersonaGarageItem[];
  playbook?: {
    maxActionsPerDay?: number;
    quietHoursLocal?: { start: number; end: number; tz?: string };
    weights?: { ask?: number; answer?: number; message?: number };
    askTemplates?: Array<{ intent: string; title: string; body: string }>;
    messageTemplates?: string[];
  };
};

export function loadPersona(slug: string): Persona {
  const path = resolve(process.cwd(), "bots/personas", `${slug}.json`);
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as Persona;
}

export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node 20 has no global WebSocket; supabase-js ≥2.118 needs one.
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}

export function statusToDb(status: string): string {
  switch (status) {
    case "For sale":
      return "for_sale";
    case "Open to offers":
      return "open_to_offers";
    case "Trade only":
      return "trade_only";
    default:
      return "not_for_sale";
  }
}

export function askToCents(ask?: string): number | null {
  if (!ask) return null;
  const n = Number(String(ask).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export async function waitForProfile(
  supabase: SupabaseClient,
  userId: string,
  attempts = 8,
) {
  for (let i = 0; i < attempts; i += 1) {
    const { data } = await supabase
      .from("profiles")
      .select("id, handle")
      .eq("id", userId)
      .maybeSingle();
    if (data?.id) return data;
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  throw new Error("Profile row not ready — check signup trigger on auth.users.");
}
