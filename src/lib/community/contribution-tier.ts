/**
 * Community contribution tiers (Ask · Share recognition).
 *
 * Score favors helping others a bit more than asking, like Reddit karma,
 * but thresholds climb quickly so early communities feel progress.
 * Tune WEIGHTS / TIERS as real activity grows — keep changes here only.
 */

export type ContributionTierId =
  | "new_spoke"
  | "turning"
  | "cadence"
  | "draft"
  | "paceline"
  | "breakaway";

export type ContributionActivity = {
  asked: number;
  answered: number;
  accepted: number;
};

export type ContributionTier = {
  id: ContributionTierId;
  /** Short chip label */
  label: string;
  /** Compact mark for dense UI (font-display) */
  mark: string;
  /** Inclusive minimum score to hold this tier */
  minScore: number;
  /** One-line explanation for tooltips / profile */
  blurb: string;
};

/** Points per action — bump accepted hardest, answers next, asks lightest. */
export const CONTRIBUTION_WEIGHTS = {
  asked: 1,
  answered: 2,
  accepted: 4,
} as const;

/**
 * Ordered low → high. Early rungs are close together on purpose.
 * Example: 1 ask + 1 answer = 3 → Turning; +1 accepted = 7 → Cadence.
 */
export const CONTRIBUTION_TIERS: ContributionTier[] = [
  {
    id: "new_spoke",
    label: "New spoke",
    mark: "1",
    minScore: 0,
    blurb: "Just joining the wheel — ask or answer to start earning recognition.",
  },
  {
    id: "turning",
    label: "Turning",
    mark: "2",
    minScore: 2,
    blurb: "You’ve started to turn the cranks in the community.",
  },
  {
    id: "cadence",
    label: "Cadence",
    mark: "3",
    minScore: 5,
    blurb: "Steady rhythm — questions and answers are stacking up.",
  },
  {
    id: "draft",
    label: "Draft",
    mark: "4",
    minScore: 12,
    blurb: "People can sit in your draft — you’re showing up for others.",
  },
  {
    id: "paceline",
    label: "Paceline",
    mark: "5",
    minScore: 25,
    blurb: "In the paceline — reliable asks and answers keep the group moving.",
  },
  {
    id: "breakaway",
    label: "Breakaway",
    mark: "6",
    minScore: 50,
    blurb: "Off the front — a standout amount of community help.",
  },
];

/**
 * Preview activity for empty Pre-Alpha feeds so we can see tier UI.
 * Remove or empty this map when real Q&A volume is enough.
 */
export const CONTRIBUTION_PREVIEW_ACTIVITY: Record<string, ContributionActivity> = {
  // Dylan — preview Breakaway so the badge is visible on Members + profile before real Q&A volume.
  // Score: 6*1 + 12*2 + 5*4 = 50 → Breakaway
  "75f7798f-4f31-442c-b0dc-91f28a45f5a1": {
    asked: 6,
    answered: 12,
    accepted: 5,
  },
};

const PREVIEW_HANDLE_SUFFIXES = new Set(
  Object.keys(CONTRIBUTION_PREVIEW_ACTIVITY).map((id) =>
    id.replace(/-/g, "").slice(0, 8),
  ),
);

export function contributionScore(activity: ContributionActivity): number {
  const asked = Math.max(0, activity.asked | 0);
  const answered = Math.max(0, activity.answered | 0);
  const accepted = Math.max(0, Math.min(answered, activity.accepted | 0));
  return (
    asked * CONTRIBUTION_WEIGHTS.asked +
    answered * CONTRIBUTION_WEIGHTS.answered +
    accepted * CONTRIBUTION_WEIGHTS.accepted
  );
}

export function tierForScore(score: number): ContributionTier {
  let current = CONTRIBUTION_TIERS[0]!;
  for (const tier of CONTRIBUTION_TIERS) {
    if (score >= tier.minScore) current = tier;
  }
  return current;
}

export function nextTier(tier: ContributionTier): ContributionTier | null {
  const idx = CONTRIBUTION_TIERS.findIndex((t) => t.id === tier.id);
  if (idx < 0 || idx >= CONTRIBUTION_TIERS.length - 1) return null;
  return CONTRIBUTION_TIERS[idx + 1] ?? null;
}

export function previewActivityForMember(opts: {
  userId?: string | null;
  handle?: string | null;
}): ContributionActivity | null {
  const id = String(opts.userId || "").trim().toLowerCase();
  if (id && CONTRIBUTION_PREVIEW_ACTIVITY[id]) {
    return CONTRIBUTION_PREVIEW_ACTIVITY[id]!;
  }
  const handle = String(opts.handle || "").trim().toLowerCase();
  if (!handle) return null;
  for (const [userId, activity] of Object.entries(CONTRIBUTION_PREVIEW_ACTIVITY)) {
    const suffix = userId.replace(/-/g, "").slice(0, 8);
    if (handle.endsWith(`_${suffix}`) || PREVIEW_HANDLE_SUFFIXES.has(handle)) {
      return activity;
    }
  }
  return null;
}

export type MemberContribution = {
  activity: ContributionActivity;
  score: number;
  tier: ContributionTier;
  next: ContributionTier | null;
  /** True when preview numbers are filling in for empty Pre-Alpha data */
  isPreview: boolean;
};

export function resolveMemberContribution(
  live: ContributionActivity,
  opts: { userId?: string | null; handle?: string | null },
): MemberContribution {
  const preview = previewActivityForMember(opts);
  const usePreview =
    Boolean(preview) &&
    live.asked === 0 &&
    live.answered === 0 &&
    live.accepted === 0;
  const activity = usePreview && preview ? preview : live;
  const score = contributionScore(activity);
  const tier = tierForScore(score);
  return {
    activity,
    score,
    tier,
    next: nextTier(tier),
    isPreview: usePreview,
  };
}
