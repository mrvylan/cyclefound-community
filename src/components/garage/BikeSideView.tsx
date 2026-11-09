"use client";

import { useState } from "react";
import {
  BIKE_COMPONENT_HOTSPOTS,
  BIKE_COMPONENT_LABELS,
  bikeComponentsBySlot,
  componentSummary,
  type BikeComponent,
  type BikeComponentSlot,
} from "@/lib/garage/bike-components";

type Props = {
  components: BikeComponent[];
  onSelect: (component: BikeComponent) => void;
};

/**
 * Simplified drive-side silhouette with active hotspots only where the owner
 * has entered component data. Hover shows the type; click/tap opens details.
 */
export function BikeSideView({ components, onSelect }: Props) {
  const bySlot = bikeComponentsBySlot(components);
  const activeSlots = (Object.keys(bySlot) as BikeComponentSlot[]).filter(
    (slot) => bySlot[slot],
  );
  const [hover, setHover] = useState<BikeComponentSlot | null>(null);

  if (!activeSlots.length) {
    return (
      <p className="m-0 rounded-[12px] border border-dashed border-line bg-ground px-4 py-6 text-center text-[14px] text-muted-2">
        No component details yet. Add them when editing this garage item.
      </p>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox="0 0 640 360"
        role="img"
        aria-label="Bike side view with component hotspots"
        className="pointer-events-none h-auto w-full max-h-[280px] text-ink"
      >
        <title>Bike components</title>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        >
          <circle cx="118" cy="250" r="68" />
          <circle cx="458" cy="250" r="68" />
          <path d="M118 250 L278 248 L350 110 L188 110 L148 190 Z" />
          <path d="M278 248 L350 110" />
          <path d="M188 110 L168 72" />
          <path d="M350 110 L368 72" />
          <path d="M148 190 L118 250" />
          <path d="M430 190 L458 250" />
          <path d="M278 248 L248 268" />
          <path d="M278 248 L458 248" strokeDasharray="4 6" opacity="0.7" />
        </g>

        {activeSlots.map((slot) => {
          const spot = BIKE_COMPONENT_HOTSPOTS[slot];
          const r = spot.r ?? 14;
          const isHover = hover === slot;
          return (
            <g key={slot}>
              <circle
                cx={spot.cx}
                cy={spot.cy}
                r={r + 6}
                className={isHover ? "fill-accent/25" : "fill-accent/10"}
              />
              <circle
                cx={spot.cx}
                cy={spot.cy}
                r={r}
                className={
                  isHover ? "fill-accent stroke-white" : "fill-accent-bright stroke-white"
                }
                strokeWidth="2.5"
              />
              <circle cx={spot.cx} cy={spot.cy} r={3.5} className="fill-white" />
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0">
        {activeSlots.map((slot) => {
          const spot = BIKE_COMPONENT_HOTSPOTS[slot];
          const comp = bySlot[slot]!;
          const left = (spot.cx / 640) * 100;
          const top = (spot.cy / 360) * 100;
          const sizePct = Math.max((((spot.r ?? 14) * 2.6) / 640) * 100, 5);
          return (
            <button
              key={slot}
              type="button"
              aria-label={`${BIKE_COMPONENT_LABELS[slot]}: ${componentSummary(comp)}. Show details`}
              onMouseEnter={() => setHover(slot)}
              onMouseLeave={() => setHover((h) => (h === slot ? null : h))}
              onFocus={() => setHover(slot)}
              onBlur={() => setHover((h) => (h === slot ? null : h))}
              onClick={() => onSelect(comp)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-0 bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${sizePct}%`,
                aspectRatio: "1",
              }}
            />
          );
        })}
      </div>

      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-2 z-[1] -translate-x-1/2 rounded-full bg-ink px-3 py-1.5 font-mono text-[12px] tracking-[0.04em] text-white uppercase"
        >
          {BIKE_COMPONENT_LABELS[hover]}
        </div>
      ) : (
        <p className="m-0 mt-2 text-center text-[13px] text-muted">
          Hover or tap a highlighted part
        </p>
      )}
    </div>
  );
}
