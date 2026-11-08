const FALLBACK = "/";

/** Cookie that carries post-auth destination across OAuth / email magic-link round-trips. */
export const AUTH_NEXT_COOKIE = "cf_auth_next";

/** Only allow same-origin relative paths as post-auth redirects. */
export function sanitizeNextPath(next: string | null | undefined, fallback = FALLBACK) {
  const value = String(next || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  if (value.startsWith("/auth")) return fallback;
  return value;
}

/**
 * Persist where to send the member after /auth/callback.
 * Prefer this over putting ?next= on redirectTo — Supabase allowlists often
 * reject query strings and fall back to Site URL (cyclefound.com marketplace).
 */
export function stashAuthNext(path: string) {
  if (typeof document === "undefined") return;
  const safe = sanitizeNextPath(path);
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function clearAuthNextCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_NEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readAuthNextFromCookieHeader(
  cookieHeader: string | null,
  fallback = FALLBACK,
) {
  if (!cookieHeader) return fallback;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${AUTH_NEXT_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return fallback;
  try {
    return sanitizeNextPath(decodeURIComponent(match[1]), fallback);
  } catch {
    return fallback;
  }
}

/** Canonical callback URL for Supabase redirect allowlist (no query string). */
export function authCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

export function authHref(
  mode: "login" | "join" | "recovery" = "login",
  next?: string | null,
) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  const safe = sanitizeNextPath(next);
  if (safe !== FALLBACK) params.set("next", safe);
  return `/auth?${params.toString()}`;
}
