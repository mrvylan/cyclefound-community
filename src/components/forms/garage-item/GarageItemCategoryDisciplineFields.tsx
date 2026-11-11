"use client";

import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/data/categories";
import { DISCIPLINES, type Discipline } from "@/lib/garage/disciplines";
import { garageItemLabel } from "./formStyles";

type Props = {
  category: ItemCategory;
  onCategoryChange: (v: ItemCategory) => void;
  categoryOptions?: readonly ItemCategory[];
  showCategory?: boolean;
  discipline: Discipline | "";
  onDisciplineChange: (updater: Discipline | "" | ((cur: Discipline | "") => Discipline | "")) => void;
  showDiscipline: boolean;
  aiDisciplineHint: Discipline | "";
  onClearDisciplineHint: () => void;
  hidden?: boolean;
};

/** Category radiogroup + optional discipline — grid cells for the What it is section. */
export function GarageItemCategoryDisciplineFields({
  category,
  onCategoryChange,
  categoryOptions = ITEM_CATEGORIES,
  showCategory = true,
  discipline,
  onDisciplineChange,
  showDiscipline,
  aiDisciplineHint,
  onClearDisciplineHint,
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;

  return (
    <>
      {showCategory ? (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <fieldset className="m-0 border-0 p-0">
            <legend className={label}>Category</legend>
            <div
              role="radiogroup"
              aria-label="Category"
              className="mt-2 flex flex-wrap gap-2"
            >
              {categoryOptions.map((c) => {
                const on = category === c;
                return (
                  <label
                    key={c}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-medium ${
                      on
                        ? "border-ink bg-ink text-white"
                        : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={on}
                      onChange={() => onCategoryChange(c)}
                      className="sr-only"
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      ) : null}

      {showDiscipline ? (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <fieldset className="m-0 border-0 p-0">
            <legend className={label}>
              Discipline <span className="font-normal text-muted">(optional)</span>
            </legend>
            <p className="mt-1 mb-2 m-0 text-[13px] text-muted-2">
              Choose how this bike rides — nothing is selected until you pick one. Tap again to
              clear.
            </p>
            {aiDisciplineHint && discipline !== aiDisciplineHint ? (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[12px] border border-accent-soft-border bg-accent-soft px-3 py-2.5">
                <p className="m-0 flex-1 text-[13px] text-ink">
                  Photos suggest <strong>{aiDisciplineHint}</strong> — confirm if that looks
                  right.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onDisciplineChange(aiDisciplineHint);
                    onClearDisciplineHint();
                  }}
                  className="inline-flex h-9 items-center rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-white hover:bg-accent-hover"
                >
                  Use {aiDisciplineHint}
                </button>
                <button
                  type="button"
                  onClick={onClearDisciplineHint}
                  className="inline-flex h-9 items-center rounded-[8px] px-2 text-[13px] font-semibold text-muted-2 hover:text-ink"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
            <div role="group" aria-label="Discipline" className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => {
                const on = discipline === d;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      onDisciplineChange((cur) => {
                        const next = cur === d ? "" : d;
                        if (next === aiDisciplineHint) onClearDisciplineHint();
                        return next;
                      })
                    }
                    className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                      on
                        ? "border-ink bg-ink text-white"
                        : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      ) : null}
    </>
  );
}
