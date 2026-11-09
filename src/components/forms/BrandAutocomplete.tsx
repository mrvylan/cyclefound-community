"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BIKE_BRANDS } from "@/lib/skills/brands";
import { resolveSkillTag } from "@/lib/skills/taxonomy";

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const MAX_SUGGESTIONS = 8;

function matchBrands(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return BIKE_BRANDS.slice(0, MAX_SUGGESTIONS);
  const scored = BIKE_BRANDS.map((b) => {
    const label = b.label.toLowerCase();
    const aliasHit = (b.aliases ?? []).some((a) => a.toLowerCase().includes(q));
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 50;
    else if (aliasHit) score = 40;
    return { brand: b, score };
  })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.brand.label.localeCompare(b.brand.label),
    );
  return scored.slice(0, MAX_SUGGESTIONS).map((x) => x.brand);
}

/** Resolve free text onto a catalog brand label when possible. */
export function normalizeBrandLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const skill = resolveSkillTag(trimmed);
  if (skill?.group === "Brands") return skill.label;
  const exact = BIKE_BRANDS.find(
    (b) => b.label.toLowerCase() === trimmed.toLowerCase(),
  );
  return exact?.label || trimmed;
}

/**
 * Catalog brand combobox — links garage items to the same Brands list
 * used for member expertise.
 */
export function BrandAutocomplete({
  id,
  value,
  onChange,
  placeholder = "e.g. Colnago",
  className = "",
  disabled,
}: Props) {
  const autoId = useId();
  const inputId = id || autoId;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => matchBrands(value), [value]);

  useEffect(() => {
    setHighlight(0);
  }, [value, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(label: string) {
    onChange(label);
    setOpen(false);
  }

  function commitNormalize() {
    const next = normalizeBrandLabel(value);
    if (next !== value) onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && suggestions[highlight] ? `${listId}-${highlight}` : undefined
        }
        value={value}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={commitNormalize}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && open && suggestions[highlight]) {
            e.preventDefault();
            pick(suggestions[highlight].label);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[10px] border border-line bg-white py-1 shadow-sm"
        >
          {suggestions.map((b, i) => (
            <li key={b.id} role="presentation">
              <button
                type="button"
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={`flex w-full px-3.5 py-2.5 text-left text-[15px] ${
                  i === highlight ? "bg-accent-soft text-ink" : "text-ink hover:bg-ground"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(b.label)}
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="m-0 mt-1.5 text-[12px] text-meta">
        From the community brand catalog — links items to member expertise.
      </p>
    </div>
  );
}
