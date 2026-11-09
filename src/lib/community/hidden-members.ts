/**
 * Soft-hide incomplete / test directory accounts from public Community surfaces
 * (Members, Garages index, search, messaging picker, etc.).
 *
 * Prefer stable Supabase user ids. Name/handle matches are fallbacks for older
 * incomplete accounts that never got a real profile.
 */
const HIDDEN_USER_IDS = new Set([
  // Second Dylan login (Google) — incomplete duplicate of founding Dylan S.
  "e5b301ff-4aa4-4164-9362-ae13616eb44b",
]);

const HIDDEN_DISPLAY_NAMES = new Set(["ca", "live"]);

const HIDDEN_HANDLE_PREFIXES = ["ca_", "live_"];

export function isHiddenMember(opts: {
  name?: string | null;
  handle?: string | null;
  userId?: string | null;
}): boolean {
  const userId = String(opts.userId || "")
    .trim()
    .toLowerCase();
  if (userId && HIDDEN_USER_IDS.has(userId)) return true;

  const name = String(opts.name || "")
    .trim()
    .toLowerCase();
  if (name && HIDDEN_DISPLAY_NAMES.has(name)) return true;

  const handle = String(opts.handle || "")
    .trim()
    .toLowerCase();
  if (
    handle &&
    HIDDEN_HANDLE_PREFIXES.some((p) => handle === p.slice(0, -1) || handle.startsWith(p))
  ) {
    return true;
  }

  return false;
}
