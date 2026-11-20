/** Emails allowed to run persona ticks from the admin UI. */
export function personaAdminEmails(): string[] {
  const raw = process.env.PERSONA_ADMIN_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["dylan@cyclefound.com"];
}

export function isPersonaAdminEmail(email: string | null | undefined): boolean {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  if (!value) return false;
  return personaAdminEmails().includes(value);
}
