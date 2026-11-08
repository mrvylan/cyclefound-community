/** Public listing description — AI may draft; owner edits before save. */
export const ITEM_DESCRIPTION_MAX = 400;

export type ItemPrivateMeta = {
  /** Owner-only — never shown to other members. */
  notes?: string;
  /** Optional ownership history shown on the item page. */
  provenance?: string;
};

export function clampItemDescription(value: string, max = ITEM_DESCRIPTION_MAX) {
  return value.trim().slice(0, max);
}

export function itemYearLabel(year: string | undefined | null) {
  const y = (year || "").trim();
  if (!y || y === "—" || y === "-" || /^unk/i.test(y)) return "";
  return y;
}

/** Dollar amounts mentioned in free text (e.g. $850, 850 dollars). */
export function dollarAmountsInText(text: string): number[] {
  const out: number[] = [];
  const re = /\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\d+(?:\.\d+)?)|\b([0-9]{2,6})\s*(?:usd|dollars?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = (m[1] || m[2] || "").replace(/,/g, "");
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) out.push(Math.round(n));
  }
  return out;
}

export function askAmount(ask: string | undefined | null): number | null {
  const raw = String(ask || "").trim();
  if (!raw || raw === "—" || /^(trade|make an offer)$/i.test(raw)) return null;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** True when description quotes a different dollar amount than Asking. */
export function descriptionPriceMismatch(
  description: string,
  ask: string | undefined | null,
): number | null {
  const asking = askAmount(ask);
  if (asking == null) return null;
  const found = dollarAmountsInText(description).find((n) => n !== asking);
  return found ?? null;
}

/**
 * Display title without duplicating the year field.
 * Prefer structured year + clean name over "1996 … 1996".
 */
export function itemDisplayTitle(
  name: string | undefined | null,
  year?: string | null,
): string {
  let base = String(name || "")
    .split(",")[0]
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "";

  const y = itemYearLabel(year);
  if (y) {
    const yearToken = new RegExp(`(?:^|\\s)${y}(?:\\s|$)`);
    // Strip trailing "1996 - Mountain" / "— 1996" style leftovers.
    base = base
      .replace(new RegExp(`(?:\\s*[-–—:/]?\\s*)${y}\\b.*$`), "")
      .replace(new RegExp(`^${y}\\b[\\s\-–—:]*`), "")
      .replace(/\s+/g, " ")
      .trim();
    // If a year still remains mid-title, leave it; otherwise prepend once.
    if (!yearToken.test(base)) {
      base = `${y} ${base}`.trim();
    }
  }

  // Collapse accidental repeated words ("Mountain Mountain").
  base = base.replace(/\b(\w+)\s+\1\b/gi, "$1");
  return base;
}

/** Compose a save title from free-text or structured brand/model/year. */
export function composeItemTitle(input: {
  title?: string;
  year?: string;
  manufacturer?: string;
  modelName?: string;
}): string {
  const raw =
    input.title?.trim() ||
    [input.manufacturer, input.modelName].filter(Boolean).join(" ").trim() ||
    "";
  const composed = itemDisplayTitle(raw || "Untitled garage item", input.year);
  return composed || "Untitled garage item";
}

/** Display asking price with a $ when the value is numeric without currency. */
export function formatAskPrice(ask: string | undefined | null): string {
  const raw = String(ask || "").trim();
  if (!raw || raw === "—" || /^(trade|make an offer)$/i.test(raw)) return raw || "—";
  if (/^\$/.test(raw)) return raw;
  if (/^\d/.test(raw)) {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) {
      return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
  }
  return raw;
}

/** Normalize price input before save — keeps Trade / offers / empty as-is. */
export function normalizeAskInput(ask: string): string {
  const raw = ask.trim();
  if (!raw) return "";
  if (/^(—|-|trade|make an offer)$/i.test(raw)) return raw;
  if (/^\$/.test(raw)) return raw;
  if (/^\d/.test(raw)) return formatAskPrice(raw);
  return raw;
}
