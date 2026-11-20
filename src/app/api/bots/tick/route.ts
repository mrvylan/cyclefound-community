import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPersonaAdminEmail } from "@/lib/bots/admin";
import { runBotTick } from "@/lib/bots/tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

async function sessionIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isPersonaAdminEmail(user?.email);
}

export async function GET(request: Request) {
  // Vercel Cron uses GET — never force.
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const result = await runBotTick();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Bot tick failed.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const cronOk = cronAuthorized(request);
  const adminOk = !cronOk ? await sessionIsAdmin() : false;
  if (!cronOk && !adminOk) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { force?: boolean; preferMessage?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Only signed-in admins may force / preferMessage. Cron stays normal cadence.
  const force = adminOk && Boolean(body.force);
  const preferMessage = adminOk && Boolean(body.preferMessage);

  try {
    const result = await runBotTick({ force, preferMessage });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Bot tick failed.",
      },
      { status: 500 },
    );
  }
}
