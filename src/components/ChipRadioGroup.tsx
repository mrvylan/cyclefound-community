"use client";

import { useRef } from "react";
import { FilterChip } from "./ui";

/** Single-select chips as a radiogroup with roving tabindex + arrow-key navigation. */
export function ChipRadioGroup({
  options,
  value,
  onChange,
  ariaLabel,
  className = "flex flex-wrap gap-2",
  /** Allow clearing the selection by clicking the active chip again. */
  allowEmpty = false,
}: {
  options: { value: string; label?: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  className?: string;
  allowEmpty?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const found = options.findIndex((o) => o.value === value);
  const activeIdx = found >= 0 ? found : 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (i - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className}>
      {options.map((o, i) => (
        <FilterChip
          key={o.value}
          role="radio"
          active={o.value === value}
          tabIndex={i === activeIdx ? 0 : -1}
          chipRef={(el) => {
            refs.current[i] = el;
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          onClick={() => {
            if (allowEmpty && o.value === value) onChange("");
            else onChange(o.value);
          }}
        >
          {o.label ?? o.value}
          {o.count != null ? (
            <span className="font-mono text-[11px] opacity-80">{o.count}</span>
          ) : null}
        </FilterChip>
      ))}
    </div>
  );
}
