"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  BIKE_COMPONENT_LABELS,
  BIKE_COMPONENT_SLOTS,
  componentHasDetails,
  componentOrigin,
  normalizeBikeComponents,
  type BikeComponent,
  type BikeComponentOrigin,
  type BikeComponentSlot,
} from "@/lib/garage/bike-components";

type Props = {
  value: BikeComponent[];
  onChange: (next: BikeComponent[]) => void;
};

const field =
  "h-11 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3 text-[15px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const selectField =
  "cf-select h-11 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-3 text-[15px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

function emptyRow(slot?: BikeComponentSlot): BikeComponent {
  return {
    slot: slot || "saddle",
    brand: "",
    model: "",
    notes: "",
    origin: "stock",
  };
}

/** Editable build sheet — shown for complete bikes / framesets on add & edit. */
export function BikeComponentsEditor({ value, onChange }: Props) {
  const rows = value.length ? value : [];
  const used = new Set(rows.map((r) => r.slot));
  const unusedSlots = BIKE_COMPONENT_SLOTS.filter((s) => !used.has(s));
  const [trackAftermarket, setTrackAftermarket] = useState(() =>
    value.some((r) => componentOrigin(r) === "aftermarket"),
  );

  useEffect(() => {
    if (value.some((r) => componentOrigin(r) === "aftermarket")) {
      setTrackAftermarket(true);
    }
  }, [value]);

  function commit(next: BikeComponent[]) {
    onChange(
      next.map((r) => ({
        slot: r.slot,
        brand: String(r.brand || "").trim(),
        model: String(r.model || "").trim(),
        notes: String(r.notes || "").trim(),
        origin: trackAftermarket ? componentOrigin(r) : "stock",
      })),
    );
  }

  function updateRow(index: number, patch: Partial<BikeComponent>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    commit(next);
  }

  function removeRow(index: number) {
    commit(rows.filter((_, i) => i !== index));
  }

  function addRow(slot?: BikeComponentSlot) {
    const pick = slot || unusedSlots[0] || "saddle";
    commit([...rows, emptyRow(pick)]);
  }

  function setHasAftermarket(enabled: boolean) {
    setTrackAftermarket(enabled);
    if (!enabled) {
      onChange(
        rows.map((r) => ({
          ...r,
          brand: String(r.brand || "").trim(),
          model: String(r.model || "").trim(),
          notes: String(r.notes || "").trim(),
          origin: "stock" as const,
        })),
      );
      return;
    }
    if (!rows.length) {
      onChange([emptyRow()]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="section-title m-0 text-[20px]">Components</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">
          Build sheet for this bike. Mark aftermarket parts so garage visitors can tell
          stock vs upgraded at a glance.
        </p>
      </div>

      <fieldset className="m-0 rounded-[14px] border border-line bg-ground px-4 py-3.5">
        <legend className="sr-only">Aftermarket parts</legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-accent"
            checked={trackAftermarket}
            onChange={(e) => setHasAftermarket(e.target.checked)}
          />
          <span>
            <span className="block text-[14px] font-semibold text-ink">
              This bike has aftermarket parts
            </span>
            <span className="mt-0.5 block text-[13px] text-muted-2">
              Leave unchecked if everything listed is stock. When checked, tag each part as
              Stock or Aftermarket.
            </span>
          </span>
        </label>
      </fieldset>

      {rows.length === 0 ? (
        <p className="m-0 rounded-[12px] border border-dashed border-line bg-ground px-4 py-5 text-[14px] text-muted-2">
          No components yet. Run “Fill details from photos” or add a row.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((row, index) => {
            const available = BIKE_COMPONENT_SLOTS.filter(
              (s) => s === row.slot || !used.has(s),
            );
            const origin = componentOrigin(row);
            return (
              <li
                key={`${row.slot}-${index}`}
                className="rounded-[14px] border border-line bg-surface p-3.5"
              >
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[12px] font-semibold text-muted"
                      htmlFor={`comp-slot-${index}`}
                    >
                      Type
                    </label>
                    <select
                      id={`comp-slot-${index}`}
                      value={row.slot}
                      onChange={(e) =>
                        updateRow(index, {
                          slot: e.target.value as BikeComponentSlot,
                        })
                      }
                      className={selectField}
                    >
                      {available.map((s) => (
                        <option key={s} value={s}>
                          {BIKE_COMPONENT_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[12px] font-semibold text-muted"
                      htmlFor={`comp-brand-${index}`}
                    >
                      Brand
                    </label>
                    <input
                      id={`comp-brand-${index}`}
                      value={row.brand || ""}
                      onChange={(e) => updateRow(index, { brand: e.target.value })}
                      placeholder="e.g. Campagnolo"
                      className={`${field} placeholder:text-meta`}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[12px] font-semibold text-muted"
                      htmlFor={`comp-model-${index}`}
                    >
                      Model
                    </label>
                    <input
                      id={`comp-model-${index}`}
                      value={row.model || ""}
                      onChange={(e) => updateRow(index, { model: e.target.value })}
                      placeholder="e.g. Super Record"
                      className={`${field} placeholder:text-meta`}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      aria-label={`Remove ${BIKE_COMPONENT_LABELS[row.slot]}`}
                      onClick={() => removeRow(index)}
                      className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line bg-white text-muted-2 hover:border-ink hover:text-ink"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>

                {trackAftermarket ? (
                  <div
                    className="mt-2.5 inline-flex rounded-[10px] border border-line bg-ground p-0.5"
                    role="group"
                    aria-label={`${BIKE_COMPONENT_LABELS[row.slot]} origin`}
                  >
                    {(
                      [
                        { id: "stock", label: "Stock" },
                        { id: "aftermarket", label: "Aftermarket" },
                      ] as const
                    ).map((opt) => {
                      const on = origin === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updateRow(index, {
                              origin: opt.id as BikeComponentOrigin,
                            })
                          }
                          className={`min-h-9 rounded-[8px] px-3 text-[13px] font-semibold ${
                            on
                              ? opt.id === "aftermarket"
                                ? "bg-accent-soft text-accent-hover"
                                : "bg-white text-ink shadow-sm"
                              : "bg-transparent text-muted-2 hover:text-ink"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-2.5 flex flex-col gap-1">
                  <label
                    className="text-[12px] font-semibold text-muted"
                    htmlFor={`comp-notes-${index}`}
                  >
                    Notes <span className="font-normal">(optional)</span>
                  </label>
                  <input
                    id={`comp-notes-${index}`}
                    value={row.notes || ""}
                    onChange={(e) => updateRow(index, { notes: e.target.value })}
                    placeholder="Year, condition, serial…"
                    className={`${field} placeholder:text-meta`}
                    autoComplete="off"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addRow()}
          disabled={
            unusedSlots.length === 0 && rows.length >= BIKE_COMPONENT_SLOTS.length
          }
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 text-[14px] font-semibold text-ink hover:bg-ground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          Add component
        </button>
        {unusedSlots.slice(0, 4).map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => addRow(slot)}
            className="inline-flex h-11 items-center rounded-full border border-line bg-ground px-3 text-[13px] font-medium text-muted-2 hover:border-ink hover:text-ink"
          >
            + {BIKE_COMPONENT_LABELS[slot]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Keep only rows with real details before save. */
export function bikeComponentsForSave(rows: BikeComponent[]): BikeComponent[] {
  return normalizeBikeComponents(rows.filter(componentHasDetails));
}
