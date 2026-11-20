import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PersonaCatalogEntry = {
  slug: string;
  email: string;
  handle: string;
  displayName: string;
  fullName: string;
  city?: string;
  state?: string;
  /** Env var that holds the password (never commit the value). */
  passwordEnvKey: string;
};

function passwordEnvKey(slug: string) {
  return `BOT_${slug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_PASSWORD`;
}

export function listPersonaFiles(): PersonaCatalogEntry[] {
  const dir = join(process.cwd(), "bots/personas");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const out: PersonaCatalogEntry[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, file), "utf8")) as {
        slug?: string;
        email?: string;
        handle?: string;
        displayName?: string;
        fullName?: string;
        city?: string;
        state?: string;
      };
      const slug = String(raw.slug || file.replace(/\.json$/, "")).trim();
      if (!slug) continue;
      out.push({
        slug,
        email: String(raw.email || "").trim(),
        handle: String(raw.handle || "").trim().toLowerCase(),
        displayName: String(raw.displayName || "").trim(),
        fullName: String(raw.fullName || "").trim(),
        city: raw.city ? String(raw.city).trim() : undefined,
        state: raw.state ? String(raw.state).trim() : undefined,
        passwordEnvKey: passwordEnvKey(slug),
      });
    } catch {
      /* skip bad files */
    }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getPersonaBySlug(slug: string): PersonaCatalogEntry | null {
  const key = String(slug || "").trim().toLowerCase();
  return listPersonaFiles().find((p) => p.slug === key) || null;
}

export function passwordForPersona(slug: string): string | null {
  const entry = getPersonaBySlug(slug);
  if (!entry) return null;
  const value = process.env[entry.passwordEnvKey]?.trim();
  return value && value.length >= 12 ? value : null;
}
