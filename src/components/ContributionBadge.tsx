import type { ContributionTier } from "@/lib/community/contribution-tier";

const TIER_STYLE: Record<
  ContributionTier["id"],
  { chip: string; mark: string }
> = {
  new_spoke: {
    chip: "border-line bg-ground text-muted-2",
    mark: "bg-line text-muted-2",
  },
  turning: {
    chip: "border-line bg-white text-ink",
    mark: "bg-ground text-ink",
  },
  cadence: {
    chip: "border-accent-soft-border bg-accent-soft text-accent-hover",
    mark: "bg-white text-accent-hover",
  },
  draft: {
    chip: "border-accent/40 bg-white text-accent-hover",
    mark: "bg-accent-soft text-accent-hover",
  },
  paceline: {
    chip: "border-ink bg-ink text-white",
    mark: "bg-ink-2 text-accent-bright",
  },
  breakaway: {
    chip: "border-accent bg-accent text-white",
    mark: "bg-accent-hover text-white",
  },
};

export function ContributionBadge({
  tier,
  preview = false,
  onDark = false,
  className = "",
}: {
  tier: ContributionTier;
  /** Soft label when using Pre-Alpha preview counts */
  preview?: boolean;
  /** Higher-contrast treatment for ink / hero headers */
  onDark?: boolean;
  className?: string;
}) {
  const style = TIER_STYLE[tier.id] ?? TIER_STYLE.new_spoke;
  const chip = onDark
    ? "border-white/25 bg-ink-2 text-white"
    : style.chip;
  const mark = onDark
    ? "bg-accent text-white"
    : style.mark;
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 ${chip} ${className}`}
      title={tier.blurb}
    >
      <span
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-semibold tracking-normal ${mark}`}
        aria-hidden
      >
        {tier.mark}
      </span>
      <span className="font-mono text-[12px] font-medium tracking-[0.04em]">
        {tier.label}
      </span>
      {preview ? (
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase opacity-70">
          Preview
        </span>
      ) : null}
    </span>
  );
}
