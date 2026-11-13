/**
 * Public handle rules for Cycle Found.
 * Handles are the only public identity; full_name stays private.
 */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
export const HANDLE_CHANGE_COOLDOWN_DAYS = 30;
export const HANDLE_HISTORY_RESERVE_DAYS = 90;

/** Rejected even if format-valid. */
export const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "support",
  "help",
  "cyclefound",
  "cycle_found",
  "staff",
  "mod",
  "moderator",
  "settings",
  "account",
  "login",
  "signup",
  "api",
  "members",
  "garage",
  "wanted",
  "about",
  "terms",
  "privacy",
  "null",
  "undefined",
  "onboarding",
  "auth",
  "join",
  "me",
  "root",
  "system",
  "official",
]);

/** Basic blocklist — keep short; format rules catch most abuse. */
const PROFANITY = new Set([
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "cock",
  "crap",
  "cunt",
  "damn",
  "dick",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "goddamn",
  "hell",
  "homo",
  "nigger",
  "nigga",
  "piss",
  "porn",
  "pussy",
  "shit",
  "slut",
  "whore",
]);

const HANDLE_RE = /^[a-z][a-z0-9_]{2,19}$/;

export function normalizeHandleInput(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, HANDLE_MAX);
}

export function isReservedOrBlocked(handle: string): boolean {
  const h = normalizeHandleInput(handle);
  if (!h) return true;
  if (RESERVED_HANDLES.has(h)) return true;
  if (PROFANITY.has(h)) return true;
  for (const bad of PROFANITY) {
    if (h.includes(bad)) return true;
  }
  return false;
}

export type HandleFormatResult =
  | { ok: true; handle: string }
  | { ok: false; error: string };

/** Format + reserved checks only (not uniqueness). */
export function validateHandleFormat(raw: string): HandleFormatResult {
  const handle = normalizeHandleInput(raw);
  if (!handle) {
    return { ok: false, error: "Enter a handle." };
  }
  if (handle.length < HANDLE_MIN) {
    return {
      ok: false,
      error: `Handle must be at least ${HANDLE_MIN} characters.`,
    };
  }
  if (handle.length > HANDLE_MAX) {
    return {
      ok: false,
      error: `Handle must be ${HANDLE_MAX} characters or fewer.`,
    };
  }
  if (!/^[a-z]/.test(handle)) {
    return { ok: false, error: "Handle must start with a letter." };
  }
  if (handle.includes("__")) {
    return { ok: false, error: "Don’t use two underscores in a row." };
  }
  if (handle.endsWith("_")) {
    return { ok: false, error: "Handle can’t end with an underscore." };
  }
  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers, and underscores only.",
    };
  }
  if (isReservedOrBlocked(handle)) {
    return { ok: false, error: "That handle isn’t available." };
  }
  return { ok: true, handle };
}

function slugPart(raw: string, max = HANDLE_MAX): string {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, max);
}

function nameParts(fullName: string): { first: string; last: string } {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .map((p) => slugPart(p))
    .filter(Boolean);
  return {
    first: parts[0] || "rider",
    last: parts.length > 1 ? parts[parts.length - 1]! : "",
  };
}

function pushCandidate(out: string[], seen: Set<string>, raw: string) {
  const parsed = validateHandleFormat(raw);
  if (!parsed.ok) return;
  if (seen.has(parsed.handle)) return;
  seen.add(parsed.handle);
  out.push(parsed.handle);
}

/**
 * Ordered handle ideas from a full name (may include taken/reserved —
 * caller filters with availability).
 * "Dylan Simpson" → dylan_s, dylan_si, dylan_simpson, dylansimpson, dylan_s2…
 */
export function suggestHandleCandidates(fullName: string, max = 24): string[] {
  const { first, last } = nameParts(fullName);
  const firstSafe = first.slice(0, HANDLE_MAX) || "rider";
  const out: string[] = [];
  const seen = new Set<string>();

  if (last) {
    pushCandidate(out, seen, `${firstSafe}_${last[0]}`);
    for (let i = 2; i <= Math.min(last.length, 8); i += 1) {
      pushCandidate(out, seen, `${firstSafe}_${last.slice(0, i)}`);
    }
    pushCandidate(out, seen, `${firstSafe}_${last}`);
    pushCandidate(out, seen, `${firstSafe}${last}`);
  } else {
    pushCandidate(out, seen, firstSafe);
  }

  const base = out[0] ?? (validateHandleFormat(firstSafe).ok ? firstSafe : "rider");

  for (let n = 2; out.length < max && n < 100; n += 1) {
    const stem = base.replace(/_+$/, "").slice(0, HANDLE_MAX - String(n).length);
    pushCandidate(out, seen, `${stem}${n}`);
  }

  // Absolute fallbacks
  for (let n = 1; out.length < 3 && n < 50; n += 1) {
    pushCandidate(out, seen, `rider${n}`);
  }

  return out.slice(0, max);
}

/** First available candidate (always returns a valid unused handle). */
export async function suggestAvailableHandle(
  fullName: string,
  isTaken: (handle: string) => Promise<boolean>,
): Promise<string> {
  const candidates = suggestHandleCandidates(fullName, 40);
  for (const h of candidates) {
    if (!(await isTaken(h))) return h;
  }
  for (let n = 100; n < 10_000; n += 1) {
    const h = `rider${n}`;
    const parsed = validateHandleFormat(h);
    if (!parsed.ok) continue;
    if (!(await isTaken(parsed.handle))) return parsed.handle;
  }
  throw new Error("Could not suggest an available handle.");
}

export function handlePublicLabel(handle: string): string {
  const h = normalizeHandleInput(handle);
  return h ? `@${h}` : "";
}

export function nextHandleChangeAllowedAt(changedAt: string | Date | null | undefined) {
  if (!changedAt) return null;
  const d = changedAt instanceof Date ? changedAt : new Date(changedAt);
  if (Number.isNaN(d.getTime())) return null;
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + HANDLE_CHANGE_COOLDOWN_DAYS);
  return next;
}

export function canChangeHandle(changedAt: string | Date | null | undefined, now = new Date()) {
  const next = nextHandleChangeAllowedAt(changedAt);
  if (!next) return true;
  return now.getTime() >= next.getTime();
}
