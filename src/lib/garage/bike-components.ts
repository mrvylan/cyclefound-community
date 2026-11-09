/** Canonical bike component slots for garage documentation. */

export const BIKE_COMPONENT_SLOTS = [
  "saddle",
  "seatpost",
  "handlebar",
  "stem",
  "shifters",
  "fork",
  "headset",
  "front_brake",
  "rear_brake",
  "front_wheel",
  "rear_wheel",
  "tires",
  "crank",
  "pedals",
  "bottom_bracket",
  "chain",
  "cassette",
  "front_derailleur",
  "rear_derailleur",
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

export const BIKE_COMPONENT_ORIGIN_LABELS: Record<BikeComponentOrigin, string> = {
  stock: "Stock",
  aftermarket: "Aftermarket",
};

export const BIKE_COMPONENT_LABELS: Record<BikeComponentSlot, string> = {
  saddle: "Saddle",
  seatpost: "Seatpost",
  handlebar: "Handlebar",
  stem: "Stem",
  shifters: "Shifters",
  fork: "Fork",
  headset: "Headset",
  front_brake: "Front brake",
  rear_brake: "Rear brake",
  front_wheel: "Front wheel",
  rear_wheel: "Rear wheel",
  tires: "Tires",
  crank: "Crank",
  pedals: "Pedals",
  bottom_bracket: "Bottom bracket",
  chain: "Chain",
  cassette: "Cassette",
  front_derailleur: "Front derailleur",
  rear_derailleur: "Rear derailleur",
};

const SLOT_ALIASES: Record<string, BikeComponentSlot> = {
  seat: "saddle",
  saddle: "saddle",
  seatpost: "seatpost",
  "seat post": "seatpost",
  handlebar: "handlebar",
  handlebars: "handlebar",
  bars: "handlebar",
  stem: "stem",
  shifter: "shifters",
  shifters: "shifters",
  brifters: "shifters",
  fork: "fork",
  headset: "headset",
  "front brake": "front_brake",
  "rear brake": "rear_brake",
  brake: "front_brake",
  brakes: "front_brake",
  "front wheel": "front_wheel",
  "rear wheel": "rear_wheel",
  wheel: "front_wheel",
  wheels: "front_wheel",
  tire: "tires",
  tires: "tires",
  tyre: "tires",
  tyres: "tires",
  crank: "crank",
  cranks: "crank",
  crankset: "crank",
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
  derailleur_front: "front_derailleur",
  derailleur_rear: "rear_derailleur",
  fd: "front_derailleur",
  rd: "rear_derailleur",
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
  if ((BIKE_COMPONENT_SLOTS as readonly string[]).includes(key.replace(/ /g, "_"))) {
    return key.replace(/ /g, "_") as BikeComponentSlot;
  }
  return SLOT_ALIASES[key] || null;
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
      // Groupset blurbs map onto drivetrain anchors when no specific slot.
      slot = "rear_derailleur";
    }
    if (!slot) continue;
    out.push({ slot, model: part.slice(0, 120), origin: "stock" });
  }
  return normalizeBikeComponents(out);
}
