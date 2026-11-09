"use client";

import { useMemo, useState } from "react";
import { Eye, Sparkles, X } from "lucide-react";
import { chipClass } from "@/components/ui";
import { suggestSkillsFromProfile } from "@/lib/skills/suggestClient";
import {
  EXPERTISE_SECTIONS,
  MAX_PROFILE_SKILLS,
  SKILL_GROUPS,
  SKILL_TAXONOMY,
  normalizeSkillLabels,
  skillsInGroup,
  type ExpertiseSection,
  type SkillDef,
  type SkillGroup,
} from "@/lib/skills/taxonomy";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Context for AI suggestions */
  bio?: string;
  role?: string;
  city?: string;
  garageHints?: string[];
  /** Compact layout for onboarding */
  compact?: boolean;
  max?: number;
};

function SkillChip({
  skill,
  on,
  full,
  onToggle,
}: {
  skill: SkillDef;
  on: boolean;
  full: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={full}
      onClick={onToggle}
      className={`${chipClass(on)} disabled:opacity-40`}
      aria-pressed={on}
    >
      {skill.label}
    </button>
  );
}

export function SkillsEditor({
  value,
  onChange,
  bio = "",
  role = "",
  city = "",
  garageHints = [],
  compact = false,
  max = MAX_PROFILE_SKILLS,
}: Props) {
  const selected = useMemo(() => normalizeSkillLabels(value, max), [value, max]);
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<SkillGroup | "all">("Expertise");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  function setSkills(next: string[]) {
    onChange(normalizeSkillLabels(next, max));
  }

  function add(label: string) {
    if (selected.includes(label) || selected.length >= max) return;
    setSkills([...selected, label]);
  }

  function remove(label: string) {
    setSkills(selected.filter((s) => s !== label));
  }

  async function runAi() {
    setAiError("");
    setAiBusy(true);
    try {
      const result = await suggestSkillsFromProfile({
        bio,
        role,
        city,
        garageHints,
        currentSkills: selected,
      });
      setAiSuggestions(result.suggestions.filter((s) => !selected.includes(s)));
      setAiReasons(result.reasons ?? {});
      if (!result.suggestions.length) {
        setAiError("No new matches from your bio yet — pick from the catalog below.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not suggest skills.");
      setAiSuggestions([]);
      setAiReasons({});
    } finally {
      setAiBusy(false);
    }
  }

  const q = query.trim().toLowerCase();
  const catalog =
    openGroup === "all"
      ? SKILL_TAXONOMY
      : skillsInGroup(openGroup);
  /** Brands are numerous — require search before listing them (including under All). */
  const brandsNeedQuery =
    !q && (openGroup === "Brands" || openGroup === "all");
  const filtered = (() => {
    const base = q
      ? catalog.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            (s.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
        )
      : catalog;
    if (!q && openGroup === "all") {
      // All without search: show non-brand groups only so the list stays usable.
      return base.filter((s) => s.group !== "Brands");
    }
    if (!q && openGroup === "Brands") return [];
    return base;
  })();

  const showExpertiseSections =
    !q && (openGroup === "Expertise" || openGroup === "all");

  const expertiseBySection = useMemo(() => {
    const map = new Map<ExpertiseSection, SkillDef[]>();
    for (const section of EXPERTISE_SECTIONS) map.set(section, []);
    for (const skill of filtered) {
      if (skill.group !== "Expertise") continue;
      const section = skill.section ?? "Skills";
      map.get(section)?.push(skill);
    }
    return map;
  }, [filtered]);

  const nonExpertiseFiltered = showExpertiseSections
    ? filtered.filter((s) => s.group !== "Expertise")
    : filtered;

  function renderChip(s: SkillDef) {
    const on = selected.includes(s.label);
    const full = !on && selected.length >= max;
    return (
      <SkillChip
        key={s.id}
        skill={s}
        on={on}
        full={full}
        onToggle={() => (on ? remove(s.label) : add(s.label))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-line bg-ground/80 px-4 py-3.5">
        <div className="flex gap-2.5">
          <Eye className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 text-[13px] leading-[1.55] text-muted-2">
            <p className="m-0 font-semibold text-ink">These tags are public</p>
            <p className="m-0 mt-1">
              They appear on your profile and in the Members directory so riders can
              find people who know what they need. Pick what you actually help with —
              not titles or hobbies you want to keep private.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[14px] font-semibold text-ink">
            Your expertise
            <span className="ml-2 font-mono text-[12px] font-normal tracking-wide text-meta">
              {selected.length}/{max}
            </span>
          </span>
          {!compact ? (
            <span className="text-[12px] text-meta">Like a resume — curated, not free-form</span>
          ) : null}
        </div>

        {selected.length ? (
          <ul className="mt-2.5 m-0 flex list-none flex-col gap-2 p-0">
            {selected.map((label, i) => {
              const def = SKILL_TAXONOMY.find((s) => s.label === label);
              return (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-2.5"
                >
                  <span className="font-mono w-5 shrink-0 text-[12px] text-meta">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-ink">{label}</div>
                    {def ? (
                      <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-meta">
                        {def.group}
                        {def.section ? ` · ${def.section}` : ""}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(label)}
                    className="inline-flex size-9 items-center justify-center rounded-[8px] text-muted hover:bg-ground hover:text-ink"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 mt-2.5 rounded-[12px] border border-dashed border-line bg-surface px-3.5 py-4 text-[14px] text-muted-2">
            No expertise tags yet. Search the catalog or let AI suggest from your bio.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runAi()}
            disabled={aiBusy || selected.length >= max}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 text-[14px] font-semibold text-ink hover:bg-ground disabled:opacity-50"
          >
            <Sparkles className="size-4 text-accent" aria-hidden />
            {aiBusy ? "Suggesting…" : "Suggest from my bio"}
          </button>
          <span className="text-[12px] text-meta">
            Uses your bio and garage when available — you confirm every tag
          </span>
        </div>
        {aiError ? (
          <p className="m-0 text-[13px] text-[#9B1C1C]" role="alert">
            {aiError}
          </p>
        ) : null}
        {aiSuggestions.length ? (
          <div className="rounded-[12px] border border-accent-soft-border bg-accent-soft px-3.5 py-3">
            <p className="m-0 text-[13px] font-semibold text-ink">AI suggestions — tap to add</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {aiSuggestions.map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={selected.length >= max || selected.includes(label)}
                  onClick={() => {
                    add(label);
                    setAiSuggestions((cur) => cur.filter((s) => s !== label));
                  }}
                  className="flex items-start justify-between gap-3 rounded-[10px] border border-transparent bg-white/80 px-3 py-2 text-left hover:border-line disabled:opacity-50"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{label}</span>
                    {aiReasons[label] ? (
                      <span className="mt-0.5 block text-[12px] text-muted-2">
                        {aiReasons[label]}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-accent">Add</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="skill-catalog-search" className="text-[14px] font-semibold">
          Search catalog
        </label>
        <input
          id="skill-catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault(); // never submit the parent profile form
            const exact = filtered.find(
              (s) => s.label.toLowerCase() === query.trim().toLowerCase(),
            );
            const pick = exact ?? (filtered.length === 1 ? filtered[0] : undefined);
            if (pick) {
              add(pick.label);
              setQuery("");
            }
          }}
          placeholder="Search first — e.g. wheelbuilding, titanium, Bosch"
          className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[15px] outline-none focus:border-accent"
          autoComplete="off"
        />
        <p className="m-0 text-[12px] text-meta">
          Only curated catalog tags can be added. Brands is a full marque list — search by name
          rather than scrolling. Typing a custom label won&apos;t create a new skill.
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Skill groups"
        >
          <button
            type="button"
            role="tab"
            aria-selected={openGroup === "all"}
            onClick={() => setOpenGroup("all")}
            className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${
              openGroup === "all"
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:bg-ground"
            }`}
          >
            All
          </button>
          {SKILL_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={openGroup === g}
              onClick={() => setOpenGroup(g)}
              className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${
                openGroup === g
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink hover:bg-ground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {showExpertiseSections ? (
          <div className="flex flex-col gap-4" role="group" aria-label="Expertise catalog">
            {EXPERTISE_SECTIONS.map((section) => {
              const items = expertiseBySection.get(section) ?? [];
              if (!items.length) return null;
              return (
                <div key={section}>
                  <p className="mb-2 mt-0 font-mono text-[11px] font-medium tracking-[0.12em] text-meta uppercase">
                    {section}
                  </p>
                  <div className="flex flex-wrap gap-1.5">{items.map(renderChip)}</div>
                </div>
              );
            })}
            {openGroup === "all" && nonExpertiseFiltered.length ? (
              <div>
                <p className="mb-2 mt-0 font-mono text-[11px] font-medium tracking-[0.12em] text-meta uppercase">
                  Systems
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {nonExpertiseFiltered.map(renderChip)}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Skill catalog">
            {filtered.map(renderChip)}
            {brandsNeedQuery ? (
              <p className="m-0 w-full text-[13px] text-muted-2">
                {skillsInGroup("Brands").length}+ brands in the catalog
                {openGroup === "all" ? " (hidden until you search)" : ""} — type a name to filter
                (e.g. Colnago, Campagnolo, Fox).
              </p>
            ) : null}
            {!brandsNeedQuery && !filtered.length ? (
              <p className="m-0 text-[13px] text-muted-2">No catalog matches for that search.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
