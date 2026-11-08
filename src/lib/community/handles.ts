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
  const suffix = String(id || "")
    .replace(/-/g, "")
    .slice(0, 8);
  const handle = `${slug}_${suffix}`.replace(/_+/g, "_").replace(/^_|_$/g, "");
  return handle.slice(0, 32) || `member_${suffix}`.slice(0, 32);
}
