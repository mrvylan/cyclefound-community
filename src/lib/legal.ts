/** Legal routes on the Community host (www / apex after cutover). */
export const LEGAL = {
  terms: "/terms",
  privacy: "/privacy",
  copyright: "/copyright",
  communityGuidelines: "/community-guidelines",
  supportEmail: "hello@cyclefound.com",
  copyrightEmail: "copyright@cyclefound.com",
} as const;

/** Canonical Community origin after apex cutover. */
export const LEGAL_ORIGIN = "https://www.cyclefound.com";

/** Marketplace Vite app kept live for listings / sell flow. */
export const CLASSIC_ORIGIN = "https://classic.cyclefound.com";
