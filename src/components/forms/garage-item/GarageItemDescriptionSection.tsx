"use client";

import { ITEM_DESCRIPTION_MAX } from "@/lib/garage/itemFields";
import { garageItemLabel, garageItemTextarea } from "./formStyles";

type Props = {
  description: string;
  onDescriptionChange: (v: string) => void;
  onDescriptionTouch: () => void;
  notes: string;
  onNotesChange: (v: string) => void;
  provenance: string;
  onProvenanceChange: (v: string) => void;
  title?: string;
  blurb?: string;
  hidden?: boolean;
};

export function GarageItemDescriptionSection({
  description,
  onDescriptionChange,
  onDescriptionTouch,
  notes,
  onNotesChange,
  provenance,
  onProvenanceChange,
  title = "Description",
  blurb = "Shown on your garage listing. AI can draft this from photos — edit before saving.",
  hidden = false,
}: Props) {
  if (hidden) return null;
  const label = garageItemLabel;
  const textarea = garageItemTextarea;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="section-title m-0 text-[20px]">{title}</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">{blurb}</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="item-description" className={label}>
          Public description
        </label>
        <textarea
          id="item-description"
          rows={6}
          value={description}
          maxLength={Math.max(ITEM_DESCRIPTION_MAX, description.length)}
          onChange={(e) => {
            onDescriptionTouch();
            onDescriptionChange(e.target.value);
          }}
          placeholder="Condition, notable features, what’s original…"
          className={textarea}
        />
        <p className="m-0 text-right font-mono text-[12px] tabular-nums text-meta">
          {description.length}/{ITEM_DESCRIPTION_MAX}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="item-notes" className={label}>
            Private notes <span className="font-normal text-muted">(only you)</span>
          </label>
          <textarea
            id="item-notes"
            rows={4}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Reminders, serials, repair plans — not shown publicly."
            className={textarea}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="item-prov" className={label}>
            Where it came from{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="item-prov"
            rows={4}
            value={provenance}
            onChange={(e) => onProvenanceChange(e.target.value)}
            placeholder="Owned since…, previous owners, paperwork…"
            className={textarea}
          />
          <p className="m-0 text-[12px] text-meta">
            Shown on the item page as history when you add it.
          </p>
        </div>
      </div>
    </section>
  );
}
