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
