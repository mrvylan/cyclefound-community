"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  BIKE_COMPONENT_GROUPS,
  BIKE_COMPONENT_LABELS,
  BIKE_COMPONENT_SLOTS,
  componentHasDetails,
  componentOrigin,
  emptyComponentRow,
  mergeComponentsWithTemplate,
  normalizeBikeComponents,
  resolveComponentTemplate,
  slotsForTemplate,
  type BikeComponent,
  type BikeComponentOrigin,
  type BikeComponentSlot,
} from "@/lib/garage/bike-components";
import type { Discipline } from "@/lib/garage/disciplines";

type Props = {
  value: BikeComponent[];
  onChange: (next: BikeComponent[]) => void;
  /** Drive template: standard functional bike vs e-bike electrical list. */
  discipline?: Discipline | "";
};

const field =
  "h-11 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3 text-[15px] text-ink outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

/** Editable build sheet — shown for complete bikes / framesets on add & edit. */
export function BikeComponentsEditor({ value, onChange, discipline = "" }: Props) {
  const template = resolveComponentTemplate(discipline || null);
  const templateSlots = useMemo(() => slotsForTemplate(template), [template]);
  const templateSlotSet = useMemo(() => new Set(templateSlots), [templateSlots]);
  const lastTemplateRef = useRef(template);

  const rows = value.length ? value : [];
  const used = new Set(rows.map((r) => r.slot));
  const unusedSlots = BIKE_COMPONENT_SLOTS.filter(
    (s) => !used.has(s) && !templateSlotSet.has(s),
  );

  const [trackAftermarket, setTrackAftermarket] = useState(() =>
    value.some((r) => componentOrigin(r) === "aftermarket"),
  );

  useEffect(() => {
    if (value.some((r) => componentOrigin(r) === "aftermarket")) {
      setTrackAftermarket(true);
    }
  }, [value]);

  // Seed the functional list on open, and remesh when switching to/from e-bike.
  useEffect(() => {
    const templateChanged = lastTemplateRef.current !== template;
    lastTemplateRef.current = template;
    const missingTemplateSlot = templateSlots.some(
      (slot) => !value.some((r) => r.slot === slot),
    );
    if (!value.length || templateChanged || missingTemplateSlot) {
      onChange(mergeComponentsWithTemplate(value, discipline || null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remesh on template / incomplete list only
  }, [template, discipline, templateSlots]);

  function commit(next: BikeComponent[]) {
    // Don't trim while typing — trailing spaces are needed for multi-word brands/models.
    onChange(
      next.map((r) => ({
        slot: r.slot,
        brand: String(r.brand || ""),
        model: String(r.model || ""),
        notes: String(r.notes || ""),
        origin: trackAftermarket ? componentOrigin(r) : "stock",
      })),
    );
  }

  function updateRow(index: number, patch: Partial<BikeComponent>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    commit(next);
  }

  function clearRow(index: number) {
    const row = rows[index];
    if (!row) return;
    if (templateSlotSet.has(row.slot)) {
      updateRow(index, { brand: "", model: "", notes: "", origin: "stock" });
      return;
    }
    commit(rows.filter((_, i) => i !== index));
  }

  function addRow(slot?: BikeComponentSlot) {
    const pick = slot || unusedSlots[0];
    if (!pick) return;
    commit([...rows, emptyComponentRow(pick)]);
  }

  function setHasAftermarket(enabled: boolean) {
    setTrackAftermarket(enabled);
    if (!enabled) {
      onChange(
        rows.map((r) => ({
          ...r,
          brand: String(r.brand || ""),
          model: String(r.model || ""),
          notes: String(r.notes || ""),
          origin: "stock" as const,
        })),
      );
    }
  }

  const groups = BIKE_COMPONENT_GROUPS.map((g) => ({
    ...g,
    rows: g.slots
      .map((slot) => {
        const index = rows.findIndex((r) => r.slot === slot);
        return index >= 0 ? { row: rows[index]!, index } : null;
      })
      .filter((x): x is { row: BikeComponent; index: number } => Boolean(x)),
  })).filter((g) => g.rows.length > 0);

  const extras = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !BIKE_COMPONENT_GROUPS.some((g) => g.slots.includes(row.slot)));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="section-title m-0 text-[20px]">Components</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">
          {template === "ebike"
            ? "E-bike build sheet — functional bike parts plus motor, battery, and controls. Mid-drive replaces the bottom bracket."
            : "Everything needed for a functional bike. Fill brand and model as you know them; leave blank if unknown."}
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

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2.5">
            <h3 className="eyebrow m-0 text-muted">{group.label}</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {group.rows.map(({ row, index }) => (
                <ComponentRow
                  key={row.slot}
                  row={row}
                  index={index}
                  trackAftermarket={trackAftermarket}
                  required={templateSlotSet.has(row.slot)}
                  onUpdate={updateRow}
                  onClear={() => clearRow(index)}
                />
              ))}
            </ul>
          </div>
        ))}

        {extras.length ? (
          <div className="flex flex-col gap-2.5">
            <h3 className="eyebrow m-0 text-muted">Additional</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {extras.map(({ row, index }) => (
                <ComponentRow
                  key={`${row.slot}-${index}`}
                  row={row}
                  index={index}
                  trackAftermarket={trackAftermarket}
                  required={false}
                  onUpdate={updateRow}
                  onClear={() => clearRow(index)}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {unusedSlots.length ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addRow()}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 text-[14px] font-semibold text-ink hover:bg-ground"
          >
            <Plus className="size-4" aria-hidden />
            Add optional part
          </button>
          {unusedSlots.slice(0, 5).map((slot) => (
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
      ) : null}
    </div>
  );
}

function ComponentRow({
  row,
  index,
  trackAftermarket,
  required,
  onUpdate,
  onClear,
}: {
  row: BikeComponent;
  index: number;
  trackAftermarket: boolean;
  required: boolean;
  onUpdate: (index: number, patch: Partial<BikeComponent>) => void;
  onClear: () => void;
}) {
  const origin = componentOrigin(row);
  return (
    <li className="rounded-[14px] border border-line bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink">
          {BIKE_COMPONENT_LABELS[row.slot]}
        </span>
        <button
          type="button"
          aria-label={
            required
              ? `Clear ${BIKE_COMPONENT_LABELS[row.slot]}`
              : `Remove ${BIKE_COMPONENT_LABELS[row.slot]}`
          }
          onClick={onClear}
          className="inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-white text-muted-2 hover:border-ink hover:text-ink"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-semibold text-muted" htmlFor={`comp-brand-${index}`}>
            Brand
          </label>
          <input
            id={`comp-brand-${index}`}
            value={row.brand || ""}
            onChange={(e) => onUpdate(index, { brand: e.target.value })}
            placeholder="e.g. Campagnolo"
            className={`${field} placeholder:text-meta`}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-semibold text-muted" htmlFor={`comp-model-${index}`}>
            Model
          </label>
          <input
            id={`comp-model-${index}`}
            value={row.model || ""}
            onChange={(e) => onUpdate(index, { model: e.target.value })}
            placeholder="e.g. Super Record"
            className={`${field} placeholder:text-meta`}
            autoComplete="off"
          />
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
                  onUpdate(index, { origin: opt.id as BikeComponentOrigin })
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
        <label className="text-[12px] font-semibold text-muted" htmlFor={`comp-notes-${index}`}>
          Notes <span className="font-normal">(optional)</span>
        </label>
        <input
          id={`comp-notes-${index}`}
          value={row.notes || ""}
          onChange={(e) => onUpdate(index, { notes: e.target.value })}
          placeholder="Year, condition, serial…"
          className={`${field} placeholder:text-meta`}
          autoComplete="off"
        />
      </div>
    </li>
  );
}

/** Keep only rows with real details before save. */
export function bikeComponentsForSave(rows: BikeComponent[]): BikeComponent[] {
  return normalizeBikeComponents(rows.filter(componentHasDetails));
}
