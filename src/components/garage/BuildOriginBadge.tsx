"use client";

import {
  BIKE_COMPONENT_LABELS,
  summarizeBuildOrigin,
  type BikeComponent,
} from "@/lib/garage/bike-components";

type Props = {
  components?: BikeComponent[] | null;
  /** Compact pill for cards; default is a slightly richer line. */
  compact?: boolean;
  className?: string;
};

/**
 * At-a-glance stock vs aftermarket signal — readable without opening Specs.
 */
export function BuildOriginBadge({
  components,
  compact = false,
  className = "",
}: Props) {
  const summary = summarizeBuildOrigin(components);
  if (summary.kind === "unknown") return null;

  if (summary.kind === "all_stock") {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-line bg-ground px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.06em] text-muted-2 uppercase ${className}`}
      >
        All stock
      </span>
    );
  }

  const labels = summary.aftermarket.map((c) => BIKE_COMPONENT_LABELS[c.slot]);
  const preview = labels.slice(0, compact ? 2 : 4);
  const more = labels.length - preview.length;

  return (
    <span
      className={`inline-flex max-w-full flex-wrap items-center gap-1.5 ${className}`}
      title={`Aftermarket: ${labels.join(", ")}`}
    >
      <span className="inline-flex items-center rounded-full border border-accent-soft-border bg-accent-soft px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.06em] text-accent-hover uppercase">
        {summary.kind === "all_aftermarket" ? "Aftermarket" : "Stock + aftermarket"}
      </span>
      {!compact || labels.length <= 2 ? (
        <span className="truncate text-[12px] text-muted-2">
          {preview.join(" · ")}
          {more > 0 ? ` · +${more}` : ""}
        </span>
      ) : (
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {labels.length}
        </span>
      )}
    </span>
  );
}
