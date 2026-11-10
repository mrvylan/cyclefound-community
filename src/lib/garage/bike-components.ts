/**
 * Bike component catalog for garage documentation.
 * Derived from bike-components-by-type.xlsx (Component Matrix + Shared Lists).
 *
 * Templates:
 * - standard — parts required for a functional acoustic bike (Road column ✓ + pedals)
 * - ebike — standard base without bottom bracket, plus Electrical (eBike only) group
 *           (mid-drive replaces the BB per Shared Lists)
 */

import type { Discipline } from "@/lib/garage/disciplines";

export const BIKE_COMPONENT_SLOTS = [
  // Frame & Fork
  "frame",
  "fork",
  "rear_shock",
  "headset",
  "thru_axles",
  "derailleur_hanger",
  // Cockpit
  "handlebar",
  "stem",
  "grips",
  "bar_tape",
  "brake_levers",
  "shifters",
  // Contact points
  "saddle",
  "seatpost",
  "seatpost_clamp",
  "pedals",
  // Drivetrain
  "crankset",
  "bottom_bracket",
  "chain",
  "cassette",
  "rear_derailleur",
  "front_derailleur",
  "shift_cables",
  // Brakes
  "brake_calipers",
  "brake_rotors",
  "brake_hoses",
  "brake_pads",
  // Wheels
  "rims",
  "hubs",
  "spokes",
  "tires",
  "tubes_tubeless",
  // Electrical (eBike only)
  "motor",
  "battery",
  "controller",
  "display",
  "sensors",
  "wiring_harness",
  "charger",
  "lights",
] as const;

export type BikeComponentSlot = (typeof BIKE_COMPONENT_SLOTS)[number];

/** Factory / as-sold part vs owner-fitted aftermarket part. */
export type BikeComponentOrigin = "stock" | "aftermarket";

export type BikeComponent = {
  slot: BikeComponentSlot;
  /** Brand / maker when known */
  brand?: string;
  /** Model or short label */
  model?: string;
  /** Freeform notes (condition, year, serial, etc.) */
  notes?: string;
  /** Defaults to stock when omitted (legacy rows). */
  origin?: BikeComponentOrigin;
};

export type BikeComponentTemplate = "standard" | "ebike" | "frameset";

export const BIKE_COMPONENT_ORIGIN_LABELS: Record<BikeComponentOrigin, string> = {
  stock: "Stock",
  aftermarket: "Aftermarket",
};

export const BIKE_COMPONENT_LABELS: Record<BikeComponentSlot, string> = {
  frame: "Frame",
  fork: "Fork",
  rear_shock: "Rear shock",
  headset: "Headset",
  thru_axles: "Thru-axles / quick-release",
  derailleur_hanger: "Derailleur hanger",
  handlebar: "Handlebar",
  stem: "Stem",
  grips: "Grips",
  bar_tape: "Bar tape",
  brake_levers: "Brake levers",
  shifters: "Shifters",
  saddle: "Saddle",
  seatpost: "Seatpost",
  seatpost_clamp: "Seatpost clamp",
  pedals: "Pedals",
  crankset: "Crankset",
  bottom_bracket: "Bottom bracket",
  chain: "Chain",
  cassette: "Cassette",
  rear_derailleur: "Rear derailleur",
  front_derailleur: "Front derailleur",
  shift_cables: "Shift cables / electronic shifting",
  brake_calipers: "Brake calipers",
  brake_rotors: "Brake rotors",
  brake_hoses: "Brake hoses / cables",
  brake_pads: "Brake pads",
  rims: "Rims",
  hubs: "Hubs",
  spokes: "Spokes + nipples",
  tires: "Tires",
  tubes_tubeless: "Tubes / tubeless setup",
  motor: "Motor",
  battery: "Battery + mount",
  controller: "Controller",
  display: "Display / remote",
  sensors: "Speed / torque sensors",
  wiring_harness: "Wiring harness",
  charger: "Charger",
  lights: "Lights",
};

export const BIKE_COMPONENT_GROUPS: { id: string; label: string; slots: BikeComponentSlot[] }[] =
  [
    {
      id: "frame",
      label: "Frame & fork",
      slots: ["frame", "fork", "rear_shock", "headset", "thru_axles", "derailleur_hanger"],
    },
    {
      id: "cockpit",
      label: "Cockpit",
      slots: ["handlebar", "stem", "grips", "bar_tape", "brake_levers", "shifters"],
    },
    {
      id: "contact",
      label: "Contact points",
      slots: ["saddle", "seatpost", "seatpost_clamp", "pedals"],
    },
    {
      id: "drivetrain",
      label: "Drivetrain",
      slots: [
        "crankset",
        "bottom_bracket",
        "chain",
        "cassette",
        "rear_derailleur",
        "front_derailleur",
        "shift_cables",
      ],
    },
    {
      id: "brakes",
      label: "Brakes",
      slots: ["brake_calipers", "brake_rotors", "brake_hoses", "brake_pads"],
    },
    {
      id: "wheels",
      label: "Wheels",
      slots: ["rims", "hubs", "spokes", "tires", "tubes_tubeless"],
    },
    {
      id: "electrical",
      label: "Electrical (e-bike)",
      slots: [
        "motor",
        "battery",
        "controller",
        "display",
        "sensors",
        "wiring_harness",
        "charger",
        "lights",
      ],
    },
  ];

/**
 * Frameset sheet — frame + fork package (plus usual smalls).
 * Not a rideable bike: no cockpit, drivetrain, brakes, or wheels.
 */
export const FRAMESET_SLOTS: readonly BikeComponentSlot[] = [
  "frame",
  "fork",
  "headset",
  "thru_axles",
  "derailleur_hanger",
] as const;

/** Required parts for a functional acoustic bike (Road ✓ + pedals). */
export const STANDARD_FUNCTIONAL_SLOTS: readonly BikeComponentSlot[] = [
  "frame",
  "fork",
  "headset",
  "thru_axles",
  "derailleur_hanger",
  "handlebar",
  "stem",
  "bar_tape",
  "brake_levers",
  "shifters",
  "saddle",
  "seatpost",
  "seatpost_clamp",
  "pedals",
  "crankset",
  "bottom_bracket",
  "chain",
  "cassette",
  "rear_derailleur",
  "front_derailleur",
  "shift_cables",
  "brake_calipers",
  "brake_rotors",
  "brake_hoses",
  "brake_pads",
  "rims",
  "hubs",
  "spokes",
  "tires",
  "tubes_tubeless",
] as const;

/** eBike electrical add-ons (Component Matrix Electrical group ✓). */
export const EBIKE_ELECTRICAL_SLOTS: readonly BikeComponentSlot[] = [
  "motor",
  "battery",
  "controller",
  "display",
  "sensors",
  "wiring_harness",
  "charger",
  "lights",
] as const;

/**
 * eBike build sheet: functional bike without BB (replaced by mid-drive) + electrical.
 * Flat-bar / drop-bar cockpit still covered via handlebar/stem/levers/shifters.
 */
export const EBIKE_FUNCTIONAL_SLOTS: readonly BikeComponentSlot[] = [
  "frame",
  "fork",
  "headset",
  "thru_axles",
  "derailleur_hanger",
  "handlebar",
  "stem",
  "brake_levers",
  "shifters",
  "saddle",
  "seatpost",
  "seatpost_clamp",
  "pedals",
  "crankset",
  "chain",
  "cassette",
  "rear_derailleur",
  "shift_cables",
  "brake_calipers",
  "brake_rotors",
  "brake_hoses",
  "brake_pads",
  "rims",
  "hubs",
  "spokes",
  "tires",
  "tubes_tubeless",
  ...EBIKE_ELECTRICAL_SLOTS,
] as const;

const SLOT_ALIASES: Record<string, BikeComponentSlot> = {
  // Legacy slots from the first components pass
  seat: "saddle",
  saddle: "saddle",
  seatpost: "seatpost",
  "seat post": "seatpost",
  "seatpost clamp": "seatpost_clamp",
  clamp: "seatpost_clamp",
  handlebar: "handlebar",
  handlebars: "handlebar",
  bars: "handlebar",
  stem: "stem",
  grips: "grips",
  grip: "grips",
  "bar tape": "bar_tape",
  bartape: "bar_tape",
  tape: "bar_tape",
  shifter: "shifters",
  shifters: "shifters",
  brifters: "shifters",
  "brake lever": "brake_levers",
  "brake levers": "brake_levers",
  levers: "brake_levers",
  fork: "fork",
  frame: "frame",
  headset: "headset",
  "rear shock": "rear_shock",
  shock: "rear_shock",
  "thru axle": "thru_axles",
  "thru axles": "thru_axles",
  "quick release": "thru_axles",
  qr: "thru_axles",
  hanger: "derailleur_hanger",
  "derailleur hanger": "derailleur_hanger",
  "front brake": "brake_calipers",
  "rear brake": "brake_calipers",
  brake: "brake_calipers",
  brakes: "brake_calipers",
  caliper: "brake_calipers",
  calipers: "brake_calipers",
  rotor: "brake_rotors",
  rotors: "brake_rotors",
  "brake pads": "brake_pads",
  pads: "brake_pads",
  "front wheel": "rims",
  "rear wheel": "rims",
  wheel: "rims",
  wheels: "rims",
  rim: "rims",
  rims: "rims",
  hub: "hubs",
  hubs: "hubs",
  spoke: "spokes",
  spokes: "spokes",
  tire: "tires",
  tires: "tires",
  tyre: "tires",
  tyres: "tires",
  tube: "tubes_tubeless",
  tubes: "tubes_tubeless",
  tubeless: "tubes_tubeless",
  crank: "crankset",
  cranks: "crankset",
  crankset: "crankset",
  pedal: "pedals",
  pedals: "pedals",
  "bottom bracket": "bottom_bracket",
  bb: "bottom_bracket",
  chain: "chain",
  cassette: "cassette",
  freewheel: "cassette",
  cog: "cassette",
  "front derailleur": "front_derailleur",
  "rear derailleur": "rear_derailleur",
  derailleur: "rear_derailleur",
  derailer: "rear_derailleur",
  fd: "front_derailleur",
  rd: "rear_derailleur",
  "shift cable": "shift_cables",
  "shift cables": "shift_cables",
  motor: "motor",
  battery: "battery",
  controller: "controller",
  display: "display",
  remote: "display",
  sensor: "sensors",
  sensors: "sensors",
  wiring: "wiring_harness",
  harness: "wiring_harness",
  charger: "charger",
  light: "lights",
  lights: "lights",
};

export function normalizeBikeComponentSlot(
  raw: string | null | undefined,
): BikeComponentSlot | null {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!key) return null;
  const underscored = key.replace(/ /g, "_");
  if ((BIKE_COMPONENT_SLOTS as readonly string[]).includes(underscored)) {
    return underscored as BikeComponentSlot;
  }
  // Legacy single-wheel / brake slots
  if (underscored === "front_wheel" || underscored === "rear_wheel") return "rims";
  if (underscored === "front_brake" || underscored === "rear_brake") return "brake_calipers";
  if (underscored === "crank") return "crankset";
  return SLOT_ALIASES[key] || null;
}

export type ComponentTemplateInput = {
  category?: string | null;
  discipline?: Discipline | string | null;
};

export function resolveComponentTemplate(
  input?: Discipline | string | null | ComponentTemplateInput,
): BikeComponentTemplate {
  const opts: ComponentTemplateInput =
    input && typeof input === "object"
      ? input
      : { discipline: input as Discipline | string | null | undefined };
  const cat = String(opts.category || "")
    .trim()
    .toLowerCase();
  if (cat === "framesets" || cat === "frameset") return "frameset";

  const d = String(opts.discipline || "")
    .trim()
    .toLowerCase();
  if (d === "e-bike" || d === "ebike" || /e\s*bike|electric/.test(d)) return "ebike";
  return "standard";
}

export function slotsForTemplate(template: BikeComponentTemplate): BikeComponentSlot[] {
  if (template === "frameset") return [...FRAMESET_SLOTS];
  if (template === "ebike") return [...EBIKE_FUNCTIONAL_SLOTS];
  return [...STANDARD_FUNCTIONAL_SLOTS];
}

export function emptyComponentRow(slot: BikeComponentSlot): BikeComponent {
  return { slot, brand: "", model: "", notes: "", origin: "stock" };
}

/** Empty build sheet for category + discipline. */
export function defaultComponentsForDiscipline(
  discipline?: Discipline | string | null,
  category?: string | null,
): BikeComponent[] {
  return slotsForTemplate(
    resolveComponentTemplate({ discipline, category }),
  ).map(emptyComponentRow);
}

/**
 * Keep filled owner data; ensure every template slot is present for editing.
 * Drops empty rows that are not in the active template (e.g. BB when switching to eBike).
 */
export function mergeComponentsWithTemplate(
  existing: BikeComponent[] | undefined | null,
  disciplineOrInput?: Discipline | string | null | ComponentTemplateInput,
  category?: string | null,
): BikeComponent[] {
  const input: ComponentTemplateInput =
    disciplineOrInput && typeof disciplineOrInput === "object"
      ? disciplineOrInput
      : { discipline: disciplineOrInput as Discipline | string | null | undefined, category };
  const template = resolveComponentTemplate(input);
  const slots = slotsForTemplate(template);
  const bySlot = new Map<BikeComponentSlot, BikeComponent>();
  for (const row of existing || []) {
    const slot = normalizeBikeComponentSlot(row.slot);
    if (!slot) continue;
    bySlot.set(slot, {
      slot,
      brand: row.brand || "",
      model: row.model || "",
      notes: row.notes || "",
      origin: row.origin === "aftermarket" ? "aftermarket" : "stock",
    });
  }
  const merged = slots.map((slot) => bySlot.get(slot) || emptyComponentRow(slot));
  // Keep filled extras outside the template (e.g. rear shock on a mountain e-bike).
  for (const [slot, row] of bySlot) {
    if (slots.includes(slot)) continue;
    if (componentHasDetails(row)) merged.push(row);
  }
  return merged;
}

export function componentHasDetails(c: BikeComponent | undefined | null): boolean {
  if (!c) return false;
  return Boolean(
    String(c.brand || "").trim() ||
      String(c.model || "").trim() ||
      String(c.notes || "").trim(),
  );
}

export function componentOrigin(c: BikeComponent | undefined | null): BikeComponentOrigin {
  return c?.origin === "aftermarket" ? "aftermarket" : "stock";
}

export function componentSummary(c: BikeComponent): string {
  const brand = String(c.brand || "").trim();
  const model = String(c.model || "").trim();
  if (brand && model) return `${brand} ${model}`;
  return brand || model || String(c.notes || "").trim() || BIKE_COMPONENT_LABELS[c.slot];
}

export function normalizeComponentOrigin(
  raw: string | null | undefined,
): BikeComponentOrigin {
  const key = String(raw || "")
    .trim()
    .toLowerCase();
  if (
    key === "aftermarket" ||
    key === "modified" ||
    key === "modded" ||
    key === "upgraded" ||
    key === "replaced"
  ) {
    return "aftermarket";
  }
  return "stock";
}

export type BuildOriginSummary = {
  kind: "unknown" | "all_stock" | "mixed" | "all_aftermarket";
  filled: number;
  aftermarket: BikeComponent[];
};

/** Roll-up for cards / hero — no need to open the component list. */
export function summarizeBuildOrigin(
  list: BikeComponent[] | undefined | null,
): BuildOriginSummary {
  const filled = (list || []).filter(componentHasDetails);
  if (!filled.length) return { kind: "unknown", filled: 0, aftermarket: [] };
  const aftermarket = filled.filter((c) => componentOrigin(c) === "aftermarket");
  if (!aftermarket.length) {
    return { kind: "all_stock", filled: filled.length, aftermarket: [] };
  }
  if (aftermarket.length === filled.length) {
    return { kind: "all_aftermarket", filled: filled.length, aftermarket };
  }
  return { kind: "mixed", filled: filled.length, aftermarket };
}

export function sanitizeBikeComponent(raw: unknown): BikeComponent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const slot =
    normalizeBikeComponentSlot(String(row.slot || row.type || row.part || "")) ||
    null;
  if (!slot) return null;
  const brand = String(row.brand || row.manufacturer || "")
    .trim()
    .slice(0, 80);
  const model = String(row.model || row.name || "")
    .trim()
    .slice(0, 120);
  const notes = String(row.notes || row.detail || row.description || "")
    .trim()
    .slice(0, 400);
  const origin = normalizeComponentOrigin(
    String(row.origin || row.source || row.fitment || ""),
  );
  const next: BikeComponent = { slot, origin };
  if (brand) next.brand = brand;
  if (model) next.model = model;
  if (notes) next.notes = notes;
  return componentHasDetails(next) ? next : null;
}

/** Dedupe by slot — later entries win. Drop empty rows. */
export function normalizeBikeComponents(list: unknown): BikeComponent[] {
  if (!Array.isArray(list)) return [];
  const bySlot = new Map<BikeComponentSlot, BikeComponent>();
  for (const row of list) {
    const next = sanitizeBikeComponent(row);
    if (!next) continue;
    bySlot.set(next.slot, next);
  }
  return BIKE_COMPONENT_SLOTS.map((slot) => bySlot.get(slot)).filter(
    (c): c is BikeComponent => Boolean(c),
  );
}

export function bikeComponentsBySlot(
  list: BikeComponent[] | undefined | null,
): Partial<Record<BikeComponentSlot, BikeComponent>> {
  const out: Partial<Record<BikeComponentSlot, BikeComponent>> = {};
  for (const c of list || []) {
    if (componentHasDetails(c)) out[c.slot] = c;
  }
  return out;
}

/** Light parse of freeform AI component blurb into structured rows when list is empty. */
export function parseComponentsBlurb(blurb: string): BikeComponent[] {
  const text = String(blurb || "").trim();
  if (!text) return [];
  const parts = text
    .split(/[;•\n]+|(?:,\s+)(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: BikeComponent[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    let slot: BikeComponentSlot | null = null;
    for (const [alias, s] of Object.entries(SLOT_ALIASES)) {
      if (lower.includes(alias)) {
        slot = s;
        break;
      }
    }
    if (!slot && /group|campagnolo|shimano|sram|sora|ultegra|dura.?ace|105\b/i.test(part)) {
      slot = "rear_derailleur";
    }
    if (!slot) continue;
    out.push({ slot, model: part.slice(0, 120), origin: "stock" });
  }
  return normalizeBikeComponents(out);
}
