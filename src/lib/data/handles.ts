/** Community member handles: email-local or seed handles. */
export function isValidMemberHandle(handle: string) {
  return /^[a-z0-9_]{2,32}$/i.test(String(handle || "").trim());
}

/**
 * Auto handles from auth look like `dylan_s_75f7798f` (name slug + id fragment).
 * Hide these publicly until the member claims a custom handle.
 */
export function isProvisionalHandle(handle: string) {
  const h = String(handle || "").trim().toLowerCase();
  if (!h) return false;
  return /_[a-f0-9]{6,8}$/.test(h);
}

/** Normalize a member-claimed public handle. */
export function normalizeClaimedHandle(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 24);
}

export function isClaimableHandle(handle: string) {
  const h = normalizeClaimedHandle(handle);
  if (!isValidMemberHandle(h)) return false;
  if (isProvisionalHandle(h)) return false;
  if (h.length < 3) return false;
  return true;
}
