const FALLBACK = "/";

/** Only allow same-origin relative paths as post-auth redirects. */
export function sanitizeNextPath(next: string | null | undefined, fallback = FALLBACK) {
  const value = String(next || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  if (value.startsWith("/auth")) return fallback;
  return value;
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
