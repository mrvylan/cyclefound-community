/**
 * Stable Community handle for a Supabase profile.
 * Must match isValidMemberHandle (/^[a-z0-9_]{2,32}$/i).
 */
export function communityHandleFromProfile(id: string, displayName: string) {
  const slug =
    String(displayName || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 18) || "member";
  const suffix = accountIdSuffix(id);
  const handle = `${slug}_${suffix}`.replace(/_+/g, "_").replace(/^_|_$/g, "");
  return handle.slice(0, 32) || `member_${suffix}`.slice(0, 32);
}

/** First 8 hex chars of a Supabase user id (dashes stripped). */
export function accountIdSuffix(userId: string) {
  return String(userId || "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toLowerCase();
}

/**
 * Stable identity across slug changes (dylan_s_75f7798f vs dylan_simpson_75f7798f).
 * Prefer an explicit user id when known; otherwise use the handle's trailing suffix.
 */
export function accountIdentityKey(handle: string, userId?: string | null) {
  if (userId) return `uid:${accountIdSuffix(userId)}`;
  const m = String(handle || "")
    .trim()
    .toLowerCase()
    .match(/_([a-f0-9]{8})$/);
  if (m) return `uid:${m[1]}`;
  return `h:${String(handle || "").trim().toLowerCase()}`;
}
