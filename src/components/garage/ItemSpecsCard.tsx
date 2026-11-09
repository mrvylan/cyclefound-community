"use client";

import { useMemo, useState } from "react";
import {
  BIKE_COMPONENT_LABELS,
  BIKE_COMPONENT_ORIGIN_LABELS,
  componentHasDetails,
  componentOrigin,
  componentSummary,
  type BikeComponent,
} from "@/lib/garage/bike-components";
import { BuildOriginBadge } from "./BuildOriginBadge";
import { ComponentDetailModal } from "./ComponentDetailModal";

type SpecRow = { k: string; v: string };

type Props = {
  specs: SpecRow[];
  bikeComponents?: BikeComponent[];
  /** Show Components tab (complete bikes / framesets). */
  showComponentsTab?: boolean;
};

type Tab = "overview" | "components";

export function ItemSpecsCard({
  specs,
  bikeComponents = [],
  showComponentsTab = false,
}: Props) {
  const filled = useMemo(
    () => bikeComponents.filter(componentHasDetails),
    [bikeComponents],
  );
  const canShowComponents = showComponentsTab || filled.length > 0;
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<BikeComponent | null>(null);

  const activeTab = canShowComponents ? tab : "overview";

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="section-title m-0 text-[20px]">Specs</h2>
        {canShowComponents ? (
          <div
            role="tablist"
            aria-label="Specs sections"
            className="inline-flex rounded-[10px] border border-line bg-ground p-0.5"
          >
            {(
              [
                { id: "overview", label: "Overview" },
                { id: "components", label: "Components" },
              ] as const
            ).map((t) => {
              const on = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={`min-h-9 rounded-[8px] px-3.5 text-[13px] font-semibold ${
                    on
                      ? "bg-white text-ink shadow-sm"
                      : "bg-transparent text-muted-2 hover:text-ink"
                  }`}
                >
                  {t.label}
                  {t.id === "components" && filled.length ? (
                    <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted">
                      {filled.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeTab === "overview" ? (
        <dl className="m-0 divide-y divide-line-soft" role="tabpanel">
          {specs.map((s) => (
            <div
              key={s.k}
              className="grid grid-cols-[minmax(7rem,9.5rem)_minmax(0,1fr)] gap-x-5 py-2.5 text-[14px]"
            >
              <dt className="text-muted">{s.k}</dt>
              <dd className="m-0 min-w-0 font-medium text-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-4">
          {filled.length ? (
            <>
              <BuildOriginBadge components={filled} />
              <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                {filled.map((c) => {
                  const origin = componentOrigin(c);
                  return (
                    <li key={c.slot}>
                      <button
                        type="button"
                        onClick={() => setSelected(c)}
                        className="flex w-full flex-col items-start gap-1 rounded-[12px] border border-line bg-white px-3.5 py-3 text-left hover:border-ink"
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                            {BIKE_COMPONENT_LABELS[c.slot]}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase ${
                              origin === "aftermarket"
                                ? "bg-accent-soft text-accent-hover"
                                : "bg-ground text-muted-2"
                            }`}
                          >
                            {BIKE_COMPONENT_ORIGIN_LABELS[origin]}
                          </span>
                        </span>
                        <span className="text-[14px] font-semibold text-ink">
                          {componentSummary(c)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="m-0 rounded-[12px] border border-dashed border-line bg-ground px-4 py-6 text-center text-[14px] text-muted-2">
              No component details yet. Add them when editing this garage item.
            </p>
          )}
        </div>
      )}

      <ComponentDetailModal component={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
