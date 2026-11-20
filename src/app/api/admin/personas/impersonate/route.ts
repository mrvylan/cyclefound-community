import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isPersonaAdminEmail } from "@/lib/bots/admin";
import { getPersonaBySlug } from "@/lib/bots/personasCatalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPersonaAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { slug?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const persona = getPersonaBySlug(String(body.slug || ""));
  if (!persona?.email) {
    return NextResponse.json({ error: "Persona not found." }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase service role not configured." },
      { status: 503 },
    );
  }

  const admin = createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const origin = new URL(request.url).origin;
  const next = `/u/${persona.handle}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: persona.email,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not create a sign-in link. Check the persona email exists in Auth.",
      },
      { status: 500 },
    );
  }

  const tokenHash = data.properties.hashed_token;
  const loginUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`;

  return NextResponse.json({
    ok: true,
    slug: persona.slug,
    handle: persona.handle,
    email: persona.email,
    loginUrl,
  });
}
