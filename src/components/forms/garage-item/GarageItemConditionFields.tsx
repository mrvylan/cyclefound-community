"use client";

import {
  CONDITION_HELP,
  CONDITIONS,
  type FormCondition,
} from "@/lib/garage/mapAiCategory";
import { garageItemLabel, garageItemSelectField } from "./formStyles";

type Props = {
  condition: FormCondition | "";
  onConditionChange: (v: FormCondition | "") => void;
  aiConditionHint: FormCondition | "";
  onClearConditionHint: () => void;
  hidden?: boolean;
};

/** Condition select + AI hint — grid cell for the What it is section. */
export function GarageItemConditionFields({
  condition,
  onConditionChange,
  aiConditionHint,
  onClearConditionHint,
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;
  const selectField = garageItemSelectField;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <label htmlFor="item-cond" className={label}>
        Condition
      </label>
      {aiConditionHint && !condition ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-accent-soft-border bg-accent-soft px-3 py-2.5">
          <p className="m-0 flex-1 text-[13px] text-ink">
            Photos suggest <strong>{aiConditionHint}</strong> — confirm if that matches what
            you see.
          </p>
          <button
            type="button"
            onClick={() => {
              onConditionChange(aiConditionHint);
              onClearConditionHint();
            }}
            className="inline-flex h-9 items-center rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-white hover:bg-accent-hover"
          >
            Use {aiConditionHint}
          </button>
          <button
            type="button"
            onClick={onClearConditionHint}
            className="inline-flex h-9 items-center rounded-[8px] px-2 text-[13px] font-semibold text-muted-2 hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <select
        id="item-cond"
        value={condition}
        required
        onChange={(e) => {
          const next = (e.target.value || "") as FormCondition | "";
          onConditionChange(next);
          if (next) onClearConditionHint();
        }}
        className={selectField}
      >
        <option value="">Select condition</option>
        {CONDITIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {condition ? (
        <p className="m-0 text-[13px] text-muted-2">{CONDITION_HELP[condition]}</p>
      ) : (
        <p className="m-0 text-[13px] text-muted-2">
          Required — pick the level that best matches how you’d describe it to a buyer.
        </p>
      )}
    </div>
  );
}
