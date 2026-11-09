/**
 * Curated expertise taxonomy for Cycle Found Community.
 * Skills stored on profiles are taxonomy labels (Person.skills: string[]).
 * Free-form tags are normalized into this list on read/save.
 *
 * Brands live in ./brands.ts (large catalog) and are merged here.
 */

import { BIKE_BRANDS } from "./brands";

export type SkillGroup = "Expertise" | "Systems" | "Brands";

/** Sub-headers inside the Expertise catalog wall. */
export type ExpertiseSection = "Skills" | "Eras" | "Materials" | "Bike types";

export type SkillDef = {
  /** Stable id for AI / APIs */
  id: string;
  /** Canonical label stored on the profile */
  label: string;
  group: SkillGroup;
  /** Expertise catalog section (ignored for Systems / Brands). */
  section?: ExpertiseSection;
  /** Alternate spellings / legacy free-form tags that map here */
  aliases?: string[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  "Expertise",
  "Systems",
  "Brands",
];

export const EXPERTISE_SECTIONS: ExpertiseSection[] = [
  "Skills",
  "Eras",
  "Materials",
  "Bike types",
];

/** Max skills a member can pin on their public profile. */
export const MAX_PROFILE_SKILLS = 8;

const CORE_SKILLS: SkillDef[] = [
  // Expertise · Skills — crafts and practices
  {
    id: "vintage-restoration",
    label: "Vintage restoration",
    group: "Expertise",
    section: "Skills",
    aliases: ["restoration", "resto", "vintage resto"],
  },
  {
    id: "frame-building",
    label: "Frame building",
    group: "Expertise",
    section: "Skills",
    aliases: ["framebuilder", "frame builder", "custom frames"],
  },
  {
    id: "brazing",
    label: "Brazing",
    group: "Expertise",
    section: "Skills",
    aliases: ["fillet brazing", "lugged construction", "silver brazing"],
  },
  {
    id: "tig-welding",
    label: "TIG welding",
    group: "Expertise",
    section: "Skills",
    aliases: ["welding", "tig"],
  },
  {
    id: "frame-alignment",
    label: "Frame alignment",
    group: "Expertise",
    section: "Skills",
    aliases: ["cold setting", "alignment", "dropout alignment"],
  },
  {
    id: "geometry",
    label: "Geometry",
    group: "Expertise",
    section: "Skills",
    aliases: ["frame geometry", "fit geometry"],
  },
  {
    id: "wheelbuilding",
    label: "Wheelbuilding",
    group: "Expertise",
    section: "Skills",
    aliases: ["wheels", "wheel building", "wheelbuilder", "relacing"],
  },
  {
    id: "paint-finish",
    label: "Paint & finish",
    group: "Expertise",
    section: "Skills",
    aliases: ["paint", "paint and finish", "respray"],
  },
  {
    id: "decals",
    label: "Decals",
    group: "Expertise",
    section: "Skills",
    aliases: ["decal reproduction", "transfers", "waterslide"],
  },
  {
    id: "chrome-plating",
    label: "Chrome & plating",
    group: "Expertise",
    section: "Skills",
    aliases: ["chrome", "plating", "rechrome"],
  },
  {
    id: "powder-coat",
    label: "Powder coat",
    group: "Expertise",
    section: "Skills",
    aliases: ["powder coating"],
  },
  {
    id: "valuation",
    label: "Valuation",
    group: "Expertise",
    section: "Skills",
    aliases: ["appraisal", "market value"],
  },
  {
    id: "authentication",
    label: "Authentication",
    group: "Expertise",
    section: "Skills",
    aliases: ["authenticity", "dating frames", "serial numbers", "fake spotting"],
  },
  {
    id: "bike-fit",
    label: "Bike fit",
    group: "Expertise",
    section: "Skills",
    aliases: ["fitting", "fit", "cleat fit"],
  },
  {
    id: "rare-parts",
    label: "Rare parts",
    group: "Expertise",
    section: "Skills",
    aliases: ["rare / vintage parts", "parts hunting", "NOS"],
  },
  {
    id: "tool-lending",
    label: "Tool lending",
    group: "Expertise",
    section: "Skills",
    aliases: ["tools", "tool loan"],
  },
  {
    id: "general-repair",
    label: "Repair & maintenance",
    group: "Expertise",
    section: "Skills",
    aliases: ["repair", "maintenance", "tune-up", "mechanic"],
  },
  {
    id: "race-mechanic",
    label: "Race mechanic",
    group: "Expertise",
    section: "Skills",
    aliases: ["team mechanic", "pit"],
  },
  {
    id: "complete-builds",
    label: "Complete builds",
    group: "Expertise",
    section: "Skills",
    aliases: ["bike builds", "build-up", "assembly"],
  },
  {
    id: "facing-tapping",
    label: "Facing & tapping",
    group: "Expertise",
    section: "Skills",
    aliases: ["facing", "tapping", "bb facing", "head tube facing"],
  },
  {
    id: "seized-parts",
    label: "Seized parts",
    group: "Expertise",
    section: "Skills",
    aliases: ["seized seatpost", "stuck parts", "frozen bolts"],
  },
  {
    id: "italian-steel",
    label: "Italian steel",
    group: "Expertise",
    section: "Skills",
    aliases: ["italian frames", "lugged italian"],
  },
  {
    id: "french-constructeur",
    label: "French constructeur",
    group: "Expertise",
    section: "Skills",
    aliases: ["constructeur", "randonneuring frames", "french frames"],
  },
  {
    id: "british-frames",
    label: "British frames",
    group: "Expertise",
    section: "Skills",
    aliases: ["uk frames", "reynolds frames"],
  },
  {
    id: "japanese-keirin",
    label: "Japanese / NJS",
    group: "Expertise",
    section: "Skills",
    aliases: ["keirin", "njs", "japanese track"],
  },
  {
    id: "lighting-dynamos",
    label: "Lighting & dynamos",
    group: "Expertise",
    section: "Skills",
    aliases: ["dynamo", "generator hub", "bike lights"],
  },
  {
    id: "leather-saddle",
    label: "Leather saddles",
    group: "Expertise",
    section: "Skills",
    aliases: ["brooks care", "saddle care", "leather"],
  },
  {
    id: "tubulars",
    label: "Tubulars",
    group: "Expertise",
    section: "Skills",
    aliases: ["tubular gluing", "sew-ups", "glue"],
  },
  {
    id: "packing-shipping",
    label: "Packing & shipping",
    group: "Expertise",
    section: "Skills",
    aliases: ["bike packing for travel", "case packing", "shipping bikes"],
  },
  {
    id: "documentation",
    label: "Garage documentation",
    group: "Expertise",
    section: "Skills",
    aliases: ["build logs", "documentation", "provenance records"],
  },
  {
    id: "teaching",
    label: "Teaching & mentoring",
    group: "Expertise",
    section: "Skills",
    aliases: ["mentoring", "workshops", "teaching"],
  },
  {
    id: "collecting",
    label: "Collecting",
    group: "Expertise",
    section: "Skills",
    aliases: ["collector", "archive", "collection"],
  },

  // Expertise · Materials
  {
    id: "titanium-work",
    label: "Titanium",
    group: "Expertise",
    section: "Materials",
    aliases: ["ti frames", "titanium frames"],
  },
  {
    id: "carbon-repair",
    label: "Carbon repair",
    group: "Expertise",
    section: "Materials",
    aliases: ["carbon", "composite repair"],
  },
  {
    id: "vintage-steel",
    label: "Vintage steel",
    group: "Expertise",
    section: "Materials",
    aliases: ["vintage", "classic", "steel"],
  },

  // Expertise · Bike types
  {
    id: "touring-bikepacking",
    label: "Touring & bikepacking",
    group: "Expertise",
    section: "Bike types",
    aliases: ["touring", "bikepacking", "loaded touring"],
  },
  {
    id: "track-fixed",
    label: "Track & fixed",
    group: "Expertise",
    section: "Bike types",
    aliases: ["fixed gear", "track bike", "fixie"],
  },
  {
    id: "cargo-utility",
    label: "Cargo & utility",
    group: "Expertise",
    section: "Bike types",
    aliases: ["cargo bikes", "utility", "family bikes"],
  },
  {
    id: "modern-road",
    label: "Modern road",
    group: "Expertise",
    section: "Bike types",
    aliases: ["modern", "contemporary"],
  },
  {
    id: "retro-modern",
    label: "Retro-modern",
    group: "Expertise",
    section: "Bike types",
    aliases: ["retro"],
  },

  // Expertise · Eras
  {
    id: "pre-war",
    label: "Pre-war",
    group: "Expertise",
    section: "Eras",
    aliases: ["prewar", "1930s", "1940s"],
  },
  {
    id: "1950s-60s",
    label: "1950s–60s",
    group: "Expertise",
    section: "Eras",
    aliases: ["50s", "60s", "1950s", "1960s"],
  },
  {
    id: "1970s-80s",
    label: "1970s–80s",
    group: "Expertise",
    section: "Eras",
    aliases: ["70s", "80s", "1970s", "1980s"],
  },
  {
    id: "1990s",
    label: "1990s",
    group: "Expertise",
    section: "Eras",
    aliases: ["90s", "1990s"],
  },
  {
    id: "early-mtb",
    label: "Early MTB",
    group: "Expertise",
    section: "Eras",
    aliases: ["clunker", "klunker", "80s mtb"],
  },

  // Systems — what you know how to work on
  {
    id: "electronic-shifting",
    label: "Electronic shifting",
    group: "Systems",
    aliases: ["di2", "eps", "axs", "etap"],
  },
  {
    id: "hydraulic-brakes",
    label: "Hydraulic brakes",
    group: "Systems",
    aliases: ["disc brakes", "hydraulics", "brake bleed"],
  },
  {
    id: "rim-brakes",
    label: "Rim brakes",
    group: "Systems",
    aliases: ["caliper brakes", "cantilever", "v-brakes"],
  },
  {
    id: "suspension",
    label: "Suspension",
    group: "Systems",
    aliases: ["forks", "shock", "fork and shock", "fork rebuild"],
  },
  {
    id: "tubeless",
    label: "Tubeless",
    group: "Systems",
  },
  {
    id: "hub-service",
    label: "Hub service",
    group: "Systems",
    aliases: ["hubs", "freehub"],
  },
  {
    id: "drivetrain",
    label: "Drivetrain",
    group: "Systems",
    aliases: ["groupset", "crank", "derailleur", "bottom bracket"],
  },
  {
    id: "headset-bb",
    label: "Headset & BB",
    group: "Systems",
    aliases: ["headset", "bottom bracket", "bb"],
  },
  {
    id: "internal-routing",
    label: "Internal routing",
    group: "Systems",
    aliases: ["cable routing", "hose routing"],
  },
  {
    id: "framesets",
    label: "Framesets",
    group: "Systems",
    aliases: ["frameset", "frame"],
  },
  {
    id: "mtb-setup",
    label: "MTB setup",
    group: "Systems",
    aliases: ["mtb", "mountain bike"],
  },
  {
    id: "gravel-build",
    label: "Gravel build",
    group: "Systems",
    aliases: ["gravel", "build"],
  },
  {
    id: "drop-bar-conversion",
    label: "Drop-bar conversion",
    group: "Systems",
    aliases: ["drop bar conversion", "flat to drop"],
  },
  {
    id: "1x-drivetrain",
    label: "1× drivetrain",
    group: "Systems",
    aliases: ["1x", "single ring"],
  },
  {
    id: "e-bike-systems",
    label: "E-bike systems",
    group: "Systems",
    aliases: ["ebike", "e-bike", "mid-drive", "hub motor"],
  },
];

const BRAND_SKILLS: SkillDef[] = BIKE_BRANDS.map((brand) => ({
  id: brand.id,
  label: brand.label,
  group: "Brands" as const,
  aliases: brand.aliases,
}));

export const SKILL_TAXONOMY: SkillDef[] = [...CORE_SKILLS, ...BRAND_SKILLS];

export function skillsInExpertiseSection(section: ExpertiseSection): SkillDef[] {
  return SKILL_TAXONOMY.filter((s) => s.group === "Expertise" && s.section === section);
}

const byLabel = new Map(
  SKILL_TAXONOMY.map((s) => [s.label.toLowerCase(), s] as const),
);
const byId = new Map(SKILL_TAXONOMY.map((s) => [s.id, s] as const));
const byAlias = new Map<string, SkillDef>();
for (const skill of SKILL_TAXONOMY) {
  byAlias.set(skill.label.toLowerCase(), skill);
  for (const a of skill.aliases ?? []) {
    byAlias.set(a.toLowerCase(), skill);
  }
}

export function getSkillById(id: string): SkillDef | undefined {
  return byId.get(id);
}

export function getSkillByLabel(label: string): SkillDef | undefined {
  return byLabel.get(label.trim().toLowerCase());
}

/** Map a free-form or legacy tag onto a taxonomy skill, if possible. */
export function resolveSkillTag(raw: string): SkillDef | undefined {
  const key = raw.trim().toLowerCase();
  if (!key) return undefined;
  return byAlias.get(key) ?? byLabel.get(key);
}

/**
 * Normalize a list of tags to unique taxonomy labels.
 * Unknown free-form tags are dropped (curated-only).
 */
export function normalizeSkillLabels(
  tags: string[],
  max = MAX_PROFILE_SKILLS,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const skill = resolveSkillTag(raw);
    if (!skill || seen.has(skill.label)) continue;
    seen.add(skill.label);
    out.push(skill.label);
    if (out.length >= max) break;
  }
  return out;
}

export function skillsInGroup(group: SkillGroup): SkillDef[] {
  return SKILL_TAXONOMY.filter((s) => s.group === group);
}

export function groupForLabel(label: string): SkillGroup | null {
  return getSkillByLabel(label)?.group ?? resolveSkillTag(label)?.group ?? null;
}

/** Compact catalog for AI prompts and clients. */
export function taxonomyCatalog() {
  return SKILL_TAXONOMY.map(({ id, label, group }) => ({ id, label, group }));
}
