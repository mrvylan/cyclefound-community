"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { suggestSkillsFromProfile } from "@/lib/skills/suggestClient";
import {
  SKILL_TAXONOMY,
  normalizeSkillLabels,
  type SkillDef,
} from "@/lib/skills/taxonomy";

const MAX = 5;
const HELP_MAX = 160;
const HELP_MIN_FOR_SUGGEST = 15;

/** Default wall before "Show all tags" — curated, non-brand. */
export const POPULAR_ONBOARDING_TAGS = [
  "Wheelbuilding",
  "Vintage restoration",
  "Frame building",
  "Bike fit",
  "Geometry",
  "Modern road",
  "Touring & bikepacking",
  "Vintage steel",
  "Titanium",
  "Electronic shifting",
  "Tubeless",
  "Brazing",
] as const;

/** Expanded catalog group order (Brands is search-only; Systems fold into Skills). */
const DISPLAY_GROUPS = ["Skills", "Bike types", "Eras", "Materials"] as const;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  helpText: string;
  onHelpTextChange: (next: string) => void;
  onContinue: () => void;
  onSkip: () => void;
};

function catalogChipClass(opts: {
  selected: boolean;
  disabled: boolean;
  pending?: boolean;
}) {
  if (opts.selected) {
    return "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-100";
  }
  if (opts.pending) {
    return "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent-soft-border bg-accent-soft px-3.5 py-1.5 text-[13px] font-semibold text-accent-hover";
  }
  if (opts.disabled) {
    return "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted opacity-45";
  }
  // Hover: light border only — distinct from filled selected.
  return "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#D4D3CD] bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-[#C5D6B5]";
}

function displayGroupOf(skill: SkillDef): (typeof DISPLAY_GROUPS)[number] | null {
  if (skill.group === "Brands") return null;
  if (skill.group === "Systems") return "Skills";
  const section = skill.section ?? "Skills";
  if ((DISPLAY_GROUPS as readonly string[]).includes(section)) {
    return section as (typeof DISPLAY_GROUPS)[number];
  }
  return "Skills";
}

export function OnboardingExpertise({
  value,
  onChange,
  helpText,
  onHelpTextChange,
  onContinue,
  onSkip,
}: Props) {
  const selected = useMemo(() => normalizeSkillLabels(value, MAX), [value]);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const full = selected.length >= MAX;
  const q = query.trim().toLowerCase();

  function setSkills(next: string[]) {
    onChange(normalizeSkillLabels(next, MAX));
  }

  function add(label: string) {
    if (selected.includes(label) || selected.length >= MAX) return;
    setSkills([...selected, label]);
    setPending((cur) => cur.filter((s) => s !== label));
  }

  function remove(label: string) {
    setSkills(selected.filter((s) => s !== label));
  }

  function toggle(label: string) {
    if (selected.includes(label)) remove(label);
    else add(label);
  }

  function acceptPending(label: string) {
    add(label);
  }

  function dismissPending(label: string) {
    setPending((cur) => cur.filter((s) => s !== label));
  }

  async function runSuggest() {
    const text = helpText.trim();
    if (text.length < HELP_MIN_FOR_SUGGEST) return;
    setAiError("");
    setAiBusy(true);
    try {
      const result = await suggestSkillsFromProfile({
        bio: text,
        currentSkills: selected,
      });
      const next = result.suggestions
        .filter((s) => !selected.includes(s))
        .slice(0, MAX);
      setPending(next);
      if (!next.length) {
        setAiError("No catalog matches yet — try a few more details, or pick below.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not suggest tags.");
      setPending([]);
    } finally {
      setAiBusy(false);
    }
  }

  const popularDefs = useMemo(() => {
    return POPULAR_ONBOARDING_TAGS.map((label) =>
      SKILL_TAXONOMY.find((s) => s.label === label),
    ).filter((s): s is SkillDef => Boolean(s));
  }, []);

  const searchResults = useMemo(() => {
    if (!q) return [] as SkillDef[];
    return SKILL_TAXONOMY.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
    ).slice(0, 48);
  }, [q]);

  const groupedAll = useMemo(() => {
    const map = new Map<string, SkillDef[]>();
    for (const g of DISPLAY_GROUPS) map.set(g, []);
    for (const skill of SKILL_TAXONOMY) {
      const key = displayGroupOf(skill);
      if (!key) continue;
      map.get(key)!.push(skill);
    }
    return map;
  }, []);

  const canSuggest = helpText.trim().length >= HELP_MIN_FOR_SUGGEST;

  function renderCatalogChip(skill: SkillDef) {
    const on = selected.includes(skill.label);
    const isPending = !on && pending.includes(skill.label);
    const disabled = !on && full;
    return (
      <button
        key={skill.id}
        type="button"
        disabled={disabled}
        aria-pressed={on}
        onClick={() => {
          if (isPending) acceptPending(skill.label);
          else toggle(skill.label);
        }}
        className={catalogChipClass({
          selected: on,
          disabled,
          pending: isPending,
        })}
        title={disabled ? "Remove one to add another." : undefined}
      >
        {on || isPending ? <Check className="size-3.5" aria-hidden /> : null}
        {skill.label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="expertise-help" className="text-[14px] font-semibold">
          What do you help riders with?{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="expertise-help"
          rows={3}
          maxLength={HELP_MAX}
          value={helpText}
          onChange={(e) => onHelpTextChange(e.target.value.slice(0, HELP_MAX))}
          placeholder="e.g. I restore 80s Italian road bikes and build wheels"
          className="resize-none rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[15px] leading-[1.5] outline-none placeholder:text-meta focus:border-accent"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[12px] tabular-nums text-meta">
            {helpText.length}/{HELP_MAX}
          </span>
          {canSuggest ? (
            <button
              type="button"
              onClick={() => void runSuggest()}
              disabled={aiBusy || full}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 text-[13px] font-semibold text-ink hover:bg-ground disabled:opacity-50"
            >
              <Sparkles className="size-3.5 text-accent" aria-hidden />
              {aiBusy ? "Suggesting…" : "Suggest tags"}
            </button>
          ) : null}
        </div>
        {aiError ? (
          <p className="m-0 text-[13px] text-[#9B1C1C]" role="alert">
            {aiError}
          </p>
        ) : null}
        {pending.length ? (
          <div className="rounded-[12px] border border-accent-soft-border bg-accent-soft px-3.5 py-3">
            <p className="m-0 text-[13px] font-semibold text-ink">
              Suggested tags — accept or dismiss
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pending.map((label) => (
                <span key={label} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => acceptPending(label)}
                    disabled={full}
                    className={catalogChipClass({
                      selected: false,
                      disabled: full,
                      pending: true,
                    })}
                  >
                    <Check className="size-3.5" aria-hidden />
                    {label}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissPending(label)}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"
                    aria-label={`Dismiss ${label}`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {selected.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap gap-1.5" role="list" aria-label="Selected tags">
              {selected.map((label) => (
                <button
                  key={label}
                  type="button"
                  role="listitem"
                  onClick={() => remove(label)}
                  className={catalogChipClass({ selected: true, disabled: false })}
                  aria-label={`Remove ${label}`}
                >
                  <Check className="size-3.5" aria-hidden />
                  {label}
                  <X className="size-3.5 opacity-80" aria-hidden />
                </button>
              ))}
            </div>
            <span className="font-mono text-[12px] text-meta">
              {selected.length} of {MAX} selected
            </span>
          </div>
        ) : (
          <span className="font-mono text-[12px] text-meta">
            0 of {MAX} selected
          </span>
        )}
        {full ? (
          <p className="m-0 text-[13px] text-muted-2">Remove one to add another.</p>
        ) : null}

        <label htmlFor="expertise-tag-search" className="text-[14px] font-semibold">
          Search tags
        </label>
        <input
          id="expertise-tag-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim()) setShowAll(false);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const exact = searchResults.find(
              (s) => s.label.toLowerCase() === query.trim().toLowerCase(),
            );
            const pick = exact ?? (searchResults.length === 1 ? searchResults[0] : undefined);
            if (pick) {
              add(pick.label);
              setQuery("");
            }
          }}
          placeholder="Try wheelbuilding, titanium, Campagnolo…"
          className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[15px] outline-none focus:border-accent"
          autoComplete="off"
        />
        {q && !searchResults.length ? (
          <p className="m-0 text-[13px] text-muted-2">
            No tag for &apos;{query.trim()}&apos; yet. Pick the closest one.
          </p>
        ) : null}
      </div>

      {q ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Search results">
          {searchResults.map((skill) => renderCatalogChip(skill))}
        </div>
      ) : showAll ? (
        <div className="flex flex-col gap-4">
          {DISPLAY_GROUPS.map((group) => {
            const items = groupedAll.get(group) ?? [];
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="mb-2 mt-0 font-mono text-[11px] font-medium tracking-[0.12em] text-meta uppercase">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((skill) => renderCatalogChip(skill))}
                </div>
              </div>
            );
          })}
          <p className="m-0 text-[13px] text-muted-2">
            Brands are search-only — type a marque above (e.g. Campagnolo, Colnago).
          </p>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="self-start text-[13px] font-semibold text-accent hover:text-accent-hover"
          >
            Show popular tags
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Popular tags">
            {popularDefs.map((skill) => renderCatalogChip(skill))}
          </div>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="self-start text-[13px] font-semibold text-accent hover:text-accent-hover"
          >
            Show all tags
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-[640px] gap-2 sm:mt-2">
          {selected.length === 0 ? (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-[15px] font-semibold text-ink hover:bg-ground"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[10px] bg-accent px-4 text-[15px] font-bold text-white hover:bg-accent-hover"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
