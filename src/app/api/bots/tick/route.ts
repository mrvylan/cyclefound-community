import { NextResponse } from "next/server";
import { runBotTick } from "@/lib/bots/tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when configured.
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader && auth === `Bearer ${secret}`) return true;

  return false;
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
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
