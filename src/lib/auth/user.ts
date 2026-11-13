import type { User } from "@supabase/supabase-js";

export const TERMS_VERSION = "2026-10-27";
export const MIN_PASSWORD_LENGTH = 12;
export const AVATAR_COLORS = [
  "#527D31",
  "#1E40AF",
  "#7C2D12",
  "#0F766E",
  "#6B21A8",
  "#9A3412",
] as const;

export type AuthProfile = {
  id: string;
  email: string;
  /** Private legal name — never show publicly. */
  fullName: string;
  /**
   * @deprecated Public identity is `handle`. Kept briefly for migration
   * from older user_metadata.display_name values.
   */
  displayName: string;
  /** Public @handle from profiles.handle when loaded. */
  handle: string;
  /** Optional short bio (user_metadata or profile patch). */
  bio?: string;
  avatarUrl: string;
  initials: string;
  avatarColor: string;
};

export function validateEmail(email: string) {
  const value = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Please enter a valid email address.");
  }
  return value;
}

export function validatePassword(password: string) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

export function firstName(value: string) {
  return String(value || "").trim().split(/\s+/).find(Boolean) || "";
}

export function initialsFromName(name: string, email?: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return `${parts[0]![0]!}${(parts[0]![0] || "C").toUpperCase()}`.toUpperCase();
  }
  const local = String(email || "").split("@")[0] || "CF";
  return local.slice(0, 2).toUpperCase();
}

export function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 17) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

export function profileFromUser(user: User | null): AuthProfile | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const fullName = String(meta.full_name || meta.name || "").trim();
  const handle = String(meta.handle || "").trim().toLowerCase();
  // Legacy only — not for public UI.
  const displayName = String(meta.display_name || "").trim();
  const bio = String(meta.bio || "").trim();
  return {
    id: user.id,
    email: user.email || "",
    fullName,
    displayName,
    handle,
    ...(bio ? { bio } : {}),
    avatarUrl: String(meta.avatar_url || "").trim(),
    initials: initialsFromName(handle || fullName || user.email || "CF", user.email),
    avatarColor: colorForId(user.id),
  };
}

/** Join OTP metadata — full_name only (handle claimed in onboarding). */
export function signupMetadata(fullName: string) {
  const trimmed = String(fullName).trim();
  const attestedAt = new Date().toISOString();
  return {
    full_name: trimmed,
    age_attested: true,
    age_attested_at: attestedAt,
    accepted_terms: true,
    accepted_terms_at: attestedAt,
    accepted_terms_version: TERMS_VERSION,
  };
}

/**
 * Compact public label from a username (e.g. "@dylan_s").
 * Returns "" when unknown — never invent "@member".
 */
export function abbreviatedDisplayName(handleOrName: string) {
  const raw = String(handleOrName || "").trim();
  if (!raw) return "";
  if (raw.startsWith("@")) {
    const body = raw.slice(1).trim().toLowerCase();
    if (!body || body === "member") return "";
    return `@${body}`;
  }
  if (/^[a-z][a-z0-9_]{2,19}$/i.test(raw) && !/\s/.test(raw)) {
    const h = raw.toLowerCase();
    if (h === "member") return "";
    return `@${h}`;
  }
  // Legacy full/display names — do not surface publicly.
  return "";
}
