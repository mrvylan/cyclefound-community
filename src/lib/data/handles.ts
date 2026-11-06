/** Community member handles: email-local or seed handles. */
export function isValidMemberHandle(handle: string) {
  return /^[a-z0-9_]{2,32}$/i.test(String(handle || "").trim());
}
