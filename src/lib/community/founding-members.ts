/**
 * Early Community accounts granted the Founding Member badge.
 * Keys are Supabase auth user ids (stable across display-name changes).
 */
export const FOUNDING_MEMBER_USER_IDS = new Set([
  "75f7798f-4f31-442c-b0dc-91f28a45f5a1", // Dylan
  "9a180516-d78d-4a50-826e-5df6f073e012", // Warren
  "406fa694-9b05-4cee-9b4e-78b0c8daa29e", // Kristine
  "ea20bf47-22f4-4f75-950d-9a2ef79d777c", // Sean
  "a51f2e74-ac62-4b33-8dec-aea56029947f", // Tyler
]);

/** First 8 hex chars of the user id (no dashes) — embedded in community handles. */
const FOUNDING_HANDLE_SUFFIXES = new Set(
  [...FOUNDING_MEMBER_USER_IDS].map((id) => id.replace(/-/g, "").slice(0, 8)),
);

export const FOUNDING_MEMBER_BADGE = "Founding Member";

export function isFoundingMember(opts: {
  userId?: string | null;
  handle?: string | null;
}): boolean {
  const id = String(opts.userId || "").trim().toLowerCase();
  if (id && FOUNDING_MEMBER_USER_IDS.has(id)) return true;

  const handle = String(opts.handle || "").trim().toLowerCase();
  if (!handle) return false;
  for (const suffix of FOUNDING_HANDLE_SUFFIXES) {
    if (handle === suffix || handle.endsWith(`_${suffix}`)) return true;
  }
  return false;
}

export function roleBadgeForMember(opts: {
  userId?: string | null;
  handle?: string | null;
  fallback?: string;
}): string {
  if (isFoundingMember(opts)) return FOUNDING_MEMBER_BADGE;
  return opts.fallback ?? "Member";
}
