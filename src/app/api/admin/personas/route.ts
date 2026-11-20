import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isPersonaAdminEmail } from "@/lib/bots/admin";
import { listPersonaFiles } from "@/lib/bots/personasCatalog";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPersonaAdminEmail(user.email)) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const personas = listPersonaFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const enabled = new Map<string, boolean>();
  if (url && key) {
    const admin = createServiceClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await admin
      .from("bot_accounts")
      .select("persona_slug, enabled");
    for (const row of data || []) {
      enabled.set(
        String((row as { persona_slug: string }).persona_slug),
        Boolean((row as { enabled: boolean }).enabled),
      );
    }
  }

  return NextResponse.json({
    personas: personas.map((p) => ({
      ...p,
      enabled: enabled.get(p.slug) ?? null,
      passwordSet: Boolean(process.env[p.passwordEnvKey]?.trim()),
      // Admin-only: surface password so you can copy or sign in manually.
      password: process.env[p.passwordEnvKey]?.trim() || null,
    })),
  });
}
