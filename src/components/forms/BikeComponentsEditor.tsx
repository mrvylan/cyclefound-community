"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  BIKE_COMPONENT_GROUPS,
  BIKE_COMPONENT_LABELS,
  BIKE_COMPONENT_SLOTS,
  componentHasDetails,
  componentOrigin,
  componentSummary,
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
  /** Drive e-bike vs acoustic functional list. */
  discipline?: Discipline | "";
  /** Framesets use a short frame+fork sheet; complete bikes use the full list. */
  category?: string;
};

type RowRef = { row: BikeComponent; index: number };

const field =
  "h-11 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

/** Editable build sheet — accordion UX for complete bikes / framesets. */
export function BikeComponentsEditor({
  value,
  onChange,
  discipline = "",
  category = "Complete bikes",
}: Props) {
  const template = resolveComponentTemplate({
    discipline: discipline || null,
    category,
  });
  const templateSlots = useMemo(() => slotsForTemplate(template), [template]);
  const templateSlotSet = useMemo(() => new Set(templateSlots), [templateSlots]);
  const lastTemplateRef = useRef(template);
  const baseId = useId();

  const rows = value.length ? value : [];
  const used = new Set(rows.map((r) => r.slot));
  const unusedSlots = BIKE_COMPONENT_SLOTS.filter(
    (s) => !used.has(s) && !templateSlotSet.has(s),
  );

  const [trackAftermarket, setTrackAftermarket] = useState(() =>
    value.some((r) => componentOrigin(r) === "aftermarket"),
  );
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [openSlot, setOpenSlot] = useState<BikeComponentSlot | null>(null);

  useEffect(() => {
    if (value.some((r) => componentOrigin(r) === "aftermarket")) {
      setTrackAftermarket(true);
    }
  }, [value]);

  // Seed the list on open; remesh when switching complete bike / frameset / e-bike.
  useEffect(() => {
    const templateChanged = lastTemplateRef.current !== template;
    lastTemplateRef.current = template;
    const missingTemplateSlot = templateSlots.some(
      (slot) => !value.some((r) => r.slot === slot),
    );
    if (!value.length || templateChanged || missingTemplateSlot) {
      onChange(
        mergeComponentsWithTemplate(value, {
          discipline: discipline || null,
          category,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remesh on template / incomplete list only
  }, [template, discipline, category, templateSlots]);

  const groups = useMemo(() => {
    const mapped = BIKE_COMPONENT_GROUPS.map((g) => ({
      ...g,
      rows: g.slots
        .map((slot) => {
          const index = rows.findIndex((r) => r.slot === slot);
          return index >= 0 ? { row: rows[index]!, index } : null;
        })
        .filter((x): x is RowRef => Boolean(x)),
    })).filter((g) => g.rows.length > 0);

    const extras = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !BIKE_COMPONENT_GROUPS.some((g) => g.slots.includes(row.slot)));

    if (extras.length) {
      mapped.push({
        id: "additional",
        label: "Additional",
        slots: extras.map((e) => e.row.slot),
        rows: extras,
      });
    }
    return mapped;
  }, [rows]);

  // Open the first incomplete group once rows exist.
  useEffect(() => {
    if (!groups.length) return;
    if (openGroupId === "__all__") return;
    if (openGroupId && groups.some((g) => g.id === openGroupId)) return;
    const firstIncomplete =
      groups.find((g) => g.rows.some(({ row }) => !componentHasDetails(row))) ||
      groups[0];
    setOpenGroupId(firstIncomplete?.id ?? null);
  }, [groups, openGroupId]);

  const filledCount = rows.filter(componentHasDetails).length;
  const totalCount = rows.length;
  const progress = totalCount ? Math.round((filledCount / totalCount) * 100) : 0;

  function commit(next: BikeComponent[]) {
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
    commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function clearRow(index: number) {
    const row = rows[index];
    if (!row) return;
    if (templateSlotSet.has(row.slot)) {
      updateRow(index, { brand: "", model: "", notes: "", origin: "stock" });
      return;
    }
    commit(rows.filter((_, i) => i !== index));
    if (openSlot === row.slot) setOpenSlot(null);
  }

  function addRow(slot?: BikeComponentSlot) {
    const pick = slot || unusedSlots[0];
    if (!pick) return;
    commit([...rows, emptyComponentRow(pick)]);
    const group =
      BIKE_COMPONENT_GROUPS.find((g) => g.slots.includes(pick))?.id || "additional";
    setOpenGroupId(group);
    setOpenSlot(pick);
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

  function toggleGroup(id: string) {
    setOpenGroupId((cur) => (cur === id ? null : id));
    setOpenSlot(null);
  }

  function expandAll() {
    // Open every group visually by flipping to a sentinel — we use multi-open set.
    setOpenGroupId("__all__");
  }

  function collapseAll() {
    setOpenGroupId(null);
    setOpenSlot(null);
  }

  function isGroupOpen(id: string) {
    return openGroupId === "__all__" || openGroupId === id;
  }

  function openNextIncomplete(fromSlot: BikeComponentSlot) {
    const flat = groups.flatMap((g) => g.rows.map((r) => ({ ...r, groupId: g.id })));
    const start = flat.findIndex((r) => r.row.slot === fromSlot);
    const next =
      flat.slice(start + 1).find((r) => !componentHasDetails(r.row)) ||
      flat.find((r) => !componentHasDetails(r.row));
    if (!next) {
      setOpenSlot(null);
      return;
    }
    setOpenGroupId(next.groupId);
    setOpenSlot(next.row.slot);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="section-title m-0 text-[20px]">Components</h2>
          <p className="mt-1 m-0 max-w-[40rem] text-[14px] leading-relaxed text-muted-2">
            {template === "frameset"
              ? "Frameset sheet — frame, fork, and the usual smalls. Add optional parts if your frameset includes more."
              : template === "ebike"
                ? "E-bike build sheet — open a section, fill what you know, skip the rest."
                : "Open a section and fill brand and model as you go. Blank is fine for unknowns."}
          </p>
        </div>
        <span
          className={`inline-flex h-8 items-center rounded-full px-3 font-mono text-[11px] font-medium tracking-[0.08em] uppercase ${
            template === "ebike"
              ? "border border-accent-soft-border bg-accent-soft text-accent-hover"
              : "border border-line bg-ground text-muted-2"
          }`}
        >
          {template === "frameset"
            ? "Frameset list"
            : template === "ebike"
              ? "E-bike list"
              : "Functional bike"}
        </span>
      </div>

      {/* Progress + controls */}
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProgressRing value={progress} label={`${filledCount} of ${totalCount}`} />
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-semibold text-ink">
                {filledCount === 0
                  ? "Start with any section"
                  : filledCount === totalCount
                    ? "Build sheet complete"
                    : `${filledCount} of ${totalCount} parts filled`}
              </p>
              <p className="m-0 text-[13px] text-muted-2">
                Collapse sections you are done with — expand one at a time to stay focused.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex h-9 items-center rounded-[8px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex h-9 items-center rounded-[8px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-ground"
            >
              Collapse all
            </button>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[12px] border border-line-soft bg-ground px-3.5 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-accent"
            checked={trackAftermarket}
            onChange={(e) => setHasAftermarket(e.target.checked)}
          />
          <span>
            <span className="block text-[14px] font-semibold text-ink">
              This bike has aftermarket parts
            </span>
            <span className="mt-0.5 block text-[13px] text-muted-2">
              When on, each part can be tagged Stock or Aftermarket for garage visitors.
            </span>
          </span>
        </label>
      </div>

      {/* Group accordions */}
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
        {groups.map((group, gi) => {
          const open = isGroupOpen(group.id);
          const filledInGroup = group.rows.filter(({ row }) =>
            componentHasDetails(row),
          ).length;
          const panelId = `${baseId}-panel-${group.id}`;
          const headerId = `${baseId}-header-${group.id}`;
          return (
            <div
              key={group.id}
              className={gi > 0 ? "border-t border-line-soft" : undefined}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    open
                      ? "bg-ground/70"
                      : "bg-surface hover:bg-ground/50"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold tabular-nums ${
                      filledInGroup === group.rows.length && group.rows.length
                        ? "bg-accent-soft text-accent-hover"
                        : "bg-ground text-muted-2"
                    }`}
                  >
                    {filledInGroup === group.rows.length && group.rows.length ? (
                      <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
                    ) : (
                      filledInGroup
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">
                      {group.label}
                    </span>
                    <span className="block font-mono text-[12px] tabular-nums text-meta">
                      {filledInGroup}/{group.rows.length} filled
                      <span className="text-muted"> · {open ? "Expanded" : "Collapsed"}</span>
                    </span>
                  </span>
                  <ExpandToggle open={open} />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                hidden={!open}
                className={open ? "border-t border-line-soft bg-ground/40" : undefined}
              >
                {open ? (
                  <ul
                    className="m-0 flex list-none flex-col p-0"
                    role="radiogroup"
                    aria-label={`${group.label} components`}
                  >
                    {group.rows.map(({ row, index }, ri) => (
                      <ComponentAccordionRow
                        key={row.slot}
                        row={row}
                        index={index}
                        open={openSlot === row.slot}
                        trackAftermarket={trackAftermarket}
                        required={templateSlotSet.has(row.slot)}
                        isLast={ri === group.rows.length - 1}
                        onToggle={() =>
                          setOpenSlot((cur) => (cur === row.slot ? null : row.slot))
                        }
                        onUpdate={updateRow}
                        onClear={() => clearRow(index)}
                        onDone={() => openNextIncomplete(row.slot)}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          );
        })}
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

/** Labeled expand/collapse control — chevron alone is too easy to miss. */
function ExpandToggle({
  open,
  expandLabel = "Expand",
  collapseLabel = "Collapse",
}: {
  open: boolean;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  return (
    <span
      className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-[8px] border px-2.5 text-[12px] font-semibold ${
        open
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink"
      }`}
      aria-hidden
    >
      {open ? collapseLabel : expandLabel}
      {open ? (
        <ChevronUp className="size-3.5" strokeWidth={2.25} />
      ) : (
        <ChevronDown className="size-3.5" strokeWidth={2.25} />
      )}
    </span>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative size-12 shrink-0" aria-label={label}>
      <svg viewBox="0 0 40 40" className="size-12 -rotate-90" aria-hidden>
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          className="stroke-line"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          className="stroke-accent transition-[stroke-dashoffset] duration-300"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold tabular-nums text-ink">
        {value}%
      </span>
    </div>
  );
}

function ComponentAccordionRow({
  row,
  index,
  open,
  trackAftermarket,
  required,
  isLast,
  onToggle,
  onUpdate,
  onClear,
  onDone,
}: {
  row: BikeComponent;
  index: number;
  open: boolean;
  trackAftermarket: boolean;
  required: boolean;
  isLast: boolean;
  onToggle: () => void;
  onUpdate: (index: number, patch: Partial<BikeComponent>) => void;
  onClear: () => void;
  onDone: () => void;
}) {
  const filled = componentHasDetails(row);
  const origin = componentOrigin(row);
  const brandRef = useRef<HTMLInputElement>(null);
  const panelId = `comp-panel-${row.slot}`;
  const headerId = `comp-header-${row.slot}`;
  const summary = filled ? componentSummary(row) : "Not filled yet";

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => brandRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <li
      className={`${!isLast ? "border-b border-line-soft" : ""} ${
        open ? "bg-white ring-1 ring-inset ring-ink/10" : ""
      }`}
    >
      <button
        type="button"
        id={headerId}
        role="radio"
        aria-checked={open}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors ${
          open
            ? "border-l-accent bg-white"
            : "border-l-transparent hover:bg-white/80"
        }`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center" aria-hidden>
          {open ? (
            <span className="flex size-5 items-center justify-center rounded-full border-[5px] border-ink bg-white" />
          ) : filled ? (
            <span
              className={`flex size-5 items-center justify-center rounded-full ${
                origin === "aftermarket" && trackAftermarket
                  ? "bg-accent-soft text-accent-hover"
                  : "bg-ink text-white"
              }`}
            >
              <Check className="size-3" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="size-5 rounded-full border-2 border-[#D4D3CD] bg-white" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[14px] font-semibold ${open ? "text-ink" : "text-ink"}`}
            >
              {BIKE_COMPONENT_LABELS[row.slot]}
            </span>
            {open ? (
              <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-white uppercase">
                Editing
              </span>
            ) : trackAftermarket && filled ? (
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase ${
                  origin === "aftermarket"
                    ? "bg-accent-soft text-accent-hover"
                    : "bg-ground text-muted-2"
                }`}
              >
                {origin === "aftermarket" ? "Aftermarket" : "Stock"}
              </span>
            ) : null}
          </span>
          <span
            className={`mt-0.5 block truncate text-[13px] ${
              filled ? "text-muted-2" : "text-meta"
            }`}
          >
            {summary}
          </span>
        </span>
        <ExpandToggle open={open} expandLabel="Edit" collapseLabel="Close" />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className={open ? "border-t border-line-soft bg-white px-4 pb-4 pt-3" : undefined}
      >
        {open ? (
          <div className="rounded-[12px] border border-line bg-ground/40 p-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[12px] font-semibold text-muted"
                  htmlFor={`comp-brand-${index}`}
                >
                  Brand
                </label>
                <input
                  ref={brandRef}
                  id={`comp-brand-${index}`}
                  value={row.brand || ""}
                  onChange={(e) => onUpdate(index, { brand: e.target.value })}
                  placeholder="e.g. Campagnolo"
                  className={`${field} placeholder:text-meta`}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[12px] font-semibold text-muted"
                  htmlFor={`comp-model-${index}`}
                >
                  Model
                </label>
                <input
                  id={`comp-model-${index}`}
                  value={row.model || ""}
                  onChange={(e) => onUpdate(index, { model: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onDone();
                    }
                  }}
                  placeholder="e.g. Super Record"
                  className={`${field} placeholder:text-meta`}
                  autoComplete="off"
                />
              </div>
            </div>

            {trackAftermarket ? (
              <fieldset className="mt-3 m-0 border-0 p-0">
                <legend className="mb-1.5 text-[12px] font-semibold text-muted">
                  Origin
                </legend>
                <div
                  role="radiogroup"
                  aria-label={`${BIKE_COMPONENT_LABELS[row.slot]} origin`}
                  className="grid grid-cols-2 gap-2"
                >
                  {(
                    [
                      { id: "stock", label: "Stock", hint: "As the bike shipped" },
                      {
                        id: "aftermarket",
                        label: "Aftermarket",
                        hint: "Added or replaced later",
                      },
                    ] as const
                  ).map((opt) => {
                    const on = origin === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border px-3 py-2.5 transition-colors ${
                          on
                            ? opt.id === "aftermarket"
                              ? "border-accent bg-accent-soft"
                              : "border-ink bg-ink text-white"
                            : "border-line bg-white text-ink hover:border-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            className="sr-only"
                            name={`comp-origin-${row.slot}`}
                            value={opt.id}
                            checked={on}
                            onChange={() =>
                              onUpdate(index, {
                                origin: opt.id as BikeComponentOrigin,
                              })
                            }
                          />
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              on
                                ? opt.id === "aftermarket"
                                  ? "border-accent bg-accent"
                                  : "border-white bg-white"
                                : "border-[#D4D3CD] bg-white"
                            }`}
                            aria-hidden
                          >
                            {on ? (
                              <span
                                className={`size-1.5 rounded-full ${
                                  opt.id === "aftermarket" ? "bg-white" : "bg-ink"
                                }`}
                              />
                            ) : null}
                          </span>
                          <span className="text-[13px] font-semibold">{opt.label}</span>
                        </span>
                        <span
                          className={`pl-6 text-[12px] ${
                            on && opt.id === "stock" ? "text-white/75" : "text-muted-2"
                          }`}
                        >
                          {opt.hint}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="mt-3 flex flex-col gap-1.5">
              <label
                className="text-[12px] font-semibold text-muted"
                htmlFor={`comp-notes-${index}`}
              >
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

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-10 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-semibold text-muted-2 hover:text-ink"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {required ? "Clear" : "Remove"}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[13px] font-semibold text-white hover:bg-accent-hover"
              >
                {filled ? "Done — next" : "Skip — next"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/** Keep only rows with real details before save. */
export function bikeComponentsForSave(rows: BikeComponent[]): BikeComponent[] {
  return normalizeBikeComponents(rows.filter(componentHasDetails));
}
