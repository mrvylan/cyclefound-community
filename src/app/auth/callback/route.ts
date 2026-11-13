import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyOwnerOfSignup } from "@/lib/auth/notifySignup";
import {
  AUTH_NEXT_COOKIE,
  readAuthNextFromCookieHeader,
  sanitizeNextPath,
} from "@/lib/auth/redirects";

async function maybeNotifyNewUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await notifyOwnerOfSignup(user);
  } catch {
    /* never block OAuth redirect */
  }
}

function clearNextCookie(response: NextResponse) {
  response.cookies.set(AUTH_NEXT_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const cookieHeader = request.headers.get("cookie");
  const next = sanitizeNextPath(
    searchParams.get("next") ||
      readAuthNextFromCookieHeader(cookieHeader, ""),
    "/",
  );

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type !== "recovery") {
        await maybeNotifyNewUser();
      }
      if (type === "recovery") {
        const res = NextResponse.redirect(
          `${origin}/auth?mode=set-password&next=${encodeURIComponent(next)}`,
        );
        clearNextCookie(res);
        return res;
      }
      const res = NextResponse.redirect(`${origin}${next}`);
      clearNextCookie(res);
      return res;
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
    });
    if (!error) {
      if (type !== "recovery") {
        await maybeNotifyNewUser();
      }
      if (type === "recovery") {
        const res = NextResponse.redirect(
          `${origin}/auth?mode=set-password&next=${encodeURIComponent(next)}`,
        );
        clearNextCookie(res);
        return res;
      }
      const res = NextResponse.redirect(`${origin}${next}`);
      clearNextCookie(res);
      return res;
    }
  }

  const fail = NextResponse.redirect(
    `${origin}/auth?mode=login&error=${encodeURIComponent("Could not complete sign-in. Try again.")}`,
  );
  clearNextCookie(fail);
  return fail;
}
