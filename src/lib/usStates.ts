/** US states and DC for listing / profile location selects. Values are postal codes. */
export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

const BY_CODE = new Map(US_STATES.map((s) => [s.code, s]));
const BY_NAME = new Map(US_STATES.map((s) => [s.name.toLowerCase(), s]));

/** Map free-text or code values (e.g. "California", "ca") to a postal code. */
export function normalizeUsStateCode(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (BY_CODE.has(upper as (typeof US_STATES)[number]["code"])) return upper;
  const byName = BY_NAME.get(raw.toLowerCase());
  return byName?.code || "";
}

export function usStateLabel(code: string) {
  return BY_CODE.get(String(code || "").toUpperCase() as (typeof US_STATES)[number]["code"])
    ?.name || String(code || "");
}

/** Public location line: "San Jose, CA". City alone if no state. */
export function formatPublicLocation(city: string, stateCode?: string) {
  const c = city.trim().replace(/,+\s*$/, "");
  const st = normalizeUsStateCode(stateCode || "");
  if (!c) return st;
  // Strip a trailing ", CA" / ", California" so we don't double-format.
  const stripped = c.replace(
    /,\s*([A-Za-z]{2}|[A-Za-z .]+)$/,
    (match, maybeState: string) => (normalizeUsStateCode(maybeState) ? "" : match),
  );
  const cityOnly = stripped.trim() || c;
  return st ? `${cityOnly}, ${st}` : cityOnly;
}

/** Split a stored loc ("San Jose, CA" / "Oakland · CA") into city + state code. */
export function parsePublicLocation(loc: string): { city: string; stateCode: string } {
  const raw = String(loc || "").trim();
  if (!raw) return { city: "", stateCode: "" };
  const primary = raw.split("·")[0]?.trim() ?? raw;
  const comma = primary.match(/^(.+?),\s*([A-Za-z]{2}|[A-Za-z .]+)$/);
  if (comma) {
    const code = normalizeUsStateCode(comma[2]);
    if (code) return { city: comma[1].trim(), stateCode: code };
  }
  return { city: primary, stateCode: "" };
}
