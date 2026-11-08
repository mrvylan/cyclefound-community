/**
 * Beta feature flags. Deferred surfaces stay in the code but render only when
 * their flag is true. Flip flags here — do not delete wrapped UI.
 */
export const FEATURES = {
  /** Spokes bounties, "Tip Spokes", how-Spokes footer copy */
  spokesCurrency: false,
  /** RIDER/PRO/MASTER/LEGEND badges and level filters */
  spokesLevels: false,
  /** Leaderboard / Top contributors */
  topContributors: false,
  /** Market value ranges, trends, charts, "+x% 12mo", garage value stats, composition bar */
  marketValues: false,
  /** Home "In the shop now / Online" panel */
  expertsOnline: false,
  /** /experts directory (nav uses Members instead) */
  expertsDirectory: false,
  /** Paid consult pricing on expert/member cards */
  paidConsults: false,
  /** Make an offer CTA */
  makeOffer: false,
  /** Watch / Watching on items */
  watchItem: false,
  /** Follow garage / Follow profile */
  followGarage: false,
  /** Follower counts */
  followerCounts: false,
  /** Same model in other garages */
  sameModelElsewhere: false,
  /** Compatible parts nearby */
  compatibleParts: false,
  /** Question sidebar "Parts in garages" */
  partsInGarages: false,
  /** Automatic wanted↔garage matching labels */
  wantedMatching: false,
  /** Home-page Wanted board sample panel (renders only when mock data is on; real wanted lives on profile/garage) */
  homeWantedBoard: true,
  /** Resource hub / guides */
  resourceHub: false,
  /** "Save to resources" */
  saveToResources: false,
  /** "Verified by N", originality %, Verified · expertise pills — use roleBadge instead */
  verifiedBadges: false,
  /** Threaded replies on answers */
  threadedReplies: false,
  /** View counts on questions */
  viewCounts: false,
  /** Answer sort dropdown */
  answerSort: false,
  /** Category breadcrumbs (use tags only) */
  categoryBreadcrumbs: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function featureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
