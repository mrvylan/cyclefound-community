/**
 * Shared public name / avatar helpers for Community members.
 * Handle stays the unique identifier; display_name is optional.
 */

/** Must match community_settings.founding_member_cap (DB). */
export const FOUNDING_MEMBER_CAP = 50;

/** Accessible palette — white text ≥4.5:1 on each. */
export const MEMBER_AVATAR_COLORS = [
  "#527D31", // accent green
  "#1E40AF", // blue
  "#7C2D12", // brown
  "#0F766E", // teal
  "#6B21A8", // purple
  "#9A3412", // rust
  "#1F2937", // ink-ish
  "#115E59", // deep teal
] as const;

export type MemberNameInput = {
  handle?: string | null;
  displayName?: string | null;
  /** @deprecated local-store Person.name — may be @handle or a display name */
  name?: string | null;
  location?: string | null;
  loc?: string | null;
};

/** Prefill from OAuth full name → "Dylan S." */
export function formatDisplayNamePrefill(fullName: string): string {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 40);
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]![0]!;
  return `${first} ${lastInitial.toUpperCase()}.`.slice(0, 40);
}

/**
 * Validate optional display name.
 * Returns normalized string, "" for empty→NULL, or throws.
 */
export function validateDisplayName(raw: string): string {
  const value = String(raw || "").trim().replace(/\s+/g, " ");
  if (!value) return "";
  if (value.length < 1 || value.length > 40) {
    throw new Error("Display name must be 1–40 characters.");
  }
  if (value.includes("@")) {
    throw new Error("Display name can’t include @.");
  }
  if (/https?:\/\/|www\./i.test(value)) {
    throw new Error("Display name can’t include a URL.");
  }
  return value;
}

function cleanHandle(handle?: string | null): string {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function cleanDisplayName(
  displayName?: string | null,
  handle?: string | null,
): string {
  let raw = String(displayName || "").trim();
  if (!raw) return "";
  // Ignore values that are just the handle (legacy mirror).
  const h = cleanHandle(handle);
  if (h && raw.replace(/^@/, "").toLowerCase() === h) return "";
  try {
    return validateDisplayName(raw);
  } catch {
    return "";
  }
}

/** Primary label: display name if set, otherwise @handle. */
export function getMemberName(input: MemberNameInput): string {
  const handle = cleanHandle(input.handle);
  const display = cleanDisplayName(input.displayName, handle);
  if (display) return display;
  // Legacy Person.name that isn't @handle
  const legacy = String(input.name || "").trim();
  if (legacy && !legacy.startsWith("@")) {
    const asDisplay = cleanDisplayName(legacy, handle);
    if (asDisplay) return asDisplay;
  }
  if (handle) return `@${handle}`;
  return "";
}

/**
 * Secondary line under the primary name.
 * With display name: "@handle · Location" (omit empty parts).
 * Without: "Location" only — never "Member".
 */
export function getMemberSecondary(input: MemberNameInput): string {
  const handle = cleanHandle(input.handle);
  const display = cleanDisplayName(input.displayName, handle);
  const loc = String(input.location || input.loc || "")
    .trim()
    .split("·")[0]
    ?.trim() || "";

  if (display) {
    const parts = [handle ? `@${handle}` : "", loc].filter(Boolean);
    return parts.join(" · ");
  }
  return loc;
}

/** Initials from display name (first two words) or handle (first two chars). */
export function initialsFromMember(input: {
  displayName?: string | null;
  handle?: string | null;
  name?: string | null;
}): string {
  const handle = cleanHandle(input.handle);
  const display = cleanDisplayName(
    input.displayName || (input.name?.startsWith("@") ? "" : input.name),
    handle,
  );
  if (display) {
    const parts = display.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return display.slice(0, 2).toUpperCase();
  }
  if (handle.length >= 2) return handle.slice(0, 2).toUpperCase();
  if (handle.length === 1) return `${handle}${handle}`.toUpperCase();
  return "CF";
}

/** Deterministic avatar background from user id. */
export function avatarColorForId(id: string): string {
  const key = String(id || "").trim() || "cyclefound";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * 17) % 997;
  }
  return MEMBER_AVATAR_COLORS[hash % MEMBER_AVATAR_COLORS.length]!;
}

export function foundingSpotsLeft(assignedFoundingCount: number): number {
  return Math.max(0, FOUNDING_MEMBER_CAP - Math.max(0, assignedFoundingCount));
}
