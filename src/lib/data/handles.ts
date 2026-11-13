/**
 * Community member handles — public identity.
 * Prefer `@/lib/community/handleRules` for new code.
 */

import {
  HANDLE_MAX,
  HANDLE_MIN,
  handlePublicLabel,
  isReservedOrBlocked,
  normalizeHandleInput,
  validateHandleFormat,
} from "@/lib/community/handleRules";

export {
  HANDLE_MAX,
  HANDLE_MIN,
  handlePublicLabel,
  isReservedOrBlocked,
  normalizeHandleInput,
  validateHandleFormat,
};

/** @deprecated Prefer validateHandleFormat — kept for route guards. */
export function isValidMemberHandle(handle: string) {
  return validateHandleFormat(handle).ok;
}

/**
 * Legacy auto handles looked like `dylan_s_75f7798f` (name slug + id fragment).
 * After migration, durable handles live on profiles.handle — this is only for
 * old local/seed rows still using the hash suffix form.
 */
export function isProvisionalHandle(handle: string) {
  const h = String(handle || "").trim().toLowerCase();
  if (!h) return false;
  return /_[a-f0-9]{6,8}$/.test(h);
}

/** Normalize a member-claimed public handle. */
export function normalizeClaimedHandle(raw: string) {
  return normalizeHandleInput(raw).slice(0, HANDLE_MAX);
}

export function isClaimableHandle(handle: string) {
  const parsed = validateHandleFormat(handle);
  if (!parsed.ok) return false;
  if (isProvisionalHandle(parsed.handle)) return false;
  if (isReservedOrBlocked(parsed.handle)) return false;
  if (parsed.handle.length < HANDLE_MIN) return false;
  return true;
}
