/**
 * Soft-hide incomplete / test directory accounts from public Community surfaces
 * (Members, Garages index, search, messaging picker, etc.).
 * Match on display name (exact) or handle slug prefix.
 */
const HIDDEN_DISPLAY_NAMES = new Set(["ca", "live"]);

const HIDDEN_HANDLE_PREFIXES = ["ca_", "live_"];

export function isHiddenMember(opts: {
  name?: string | null;
  handle?: string | null;
  userId?: string | null;
}): boolean {
  const name = String(opts.name || "")
    .trim()
    .toLowerCase();
  if (name && HIDDEN_DISPLAY_NAMES.has(name)) return true;

  const handle = String(opts.handle || "")
    .trim()
    .toLowerCase();
  if (handle && HIDDEN_HANDLE_PREFIXES.some((p) => handle === p.slice(0, -1) || handle.startsWith(p))) {
    return true;
  }

  return false;
}
