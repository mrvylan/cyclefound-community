"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import {
  BIKE_COMPONENT_LABELS,
  componentSummary,
  type BikeComponent,
} from "@/lib/garage/bike-components";

type Props = {
  component: BikeComponent | null;
  onClose: () => void;
};

export function ComponentDetailModal({ component, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!component) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [component, onClose]);

  if (!component) return null;

  const rows = [
    { k: "Brand", v: component.brand?.trim() },
    { k: "Model", v: component.model?.trim() },
    { k: "Notes", v: component.notes?.trim() },
  ].filter((r) => r.v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-lg"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow m-0 text-muted">Component</p>
            <h2 id={titleId} className="section-title m-0 text-[22px]">
              {BIKE_COMPONENT_LABELS[component.slot]}
            </h2>
            <p className="mt-1 m-0 text-[15px] text-muted-2">{componentSummary(component)}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-ink hover:bg-ground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {rows.length ? (
          <dl className="m-0 divide-y divide-line-soft">
            {rows.map((r) => (
              <div
                key={r.k}
                className="grid grid-cols-[minmax(5rem,7rem)_minmax(0,1fr)] gap-x-4 py-2.5 text-[14px]"
              >
                <dt className="text-muted">{r.k}</dt>
                <dd className="m-0 min-w-0 font-medium text-ink">{r.v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="m-0 text-[14px] text-muted-2">No details recorded for this part.</p>
        )}
      </div>
    </div>
  );
}
