/**
 * Legal routes on community.cyclefound.com.
 * Marketplace guidelines remain on cyclefound.com (not duplicated here).
 */
export const LEGAL = {
  terms: "/terms",
  privacy: "/privacy",
  copyright: "/copyright",
  communityGuidelines: "/community-guidelines",
  /** External — marketplace site only */
  marketplaceGuidelines: "https://cyclefound.com/marketplace-guidelines",
  supportEmail: "hello@cyclefound.com",
  copyrightEmail: "copyright@cyclefound.com",
} as const;

/** @deprecated use LEGAL.communityGuidelines */
export const communityGuidelinesPath = LEGAL.communityGuidelines;
