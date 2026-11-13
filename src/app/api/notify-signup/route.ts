import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyOwnerOfSignup } from "@/lib/auth/notifySignup";

export const runtime = "nodejs";

/** Fire after a completed join (OTP verify or OAuth). Auth session required. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const result = await notifyOwnerOfSignup(user);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[notify-signup]", err);
    return NextResponse.json(
      { sent: false, error: err instanceof Error ? err.message : "Notify failed." },
      { status: 500 },
    );
  }
}
