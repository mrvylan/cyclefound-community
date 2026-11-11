"use client";

import { Sparkles } from "lucide-react";
import { PhotoPicker } from "@/components/forms/PhotoPicker";

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  identifying: boolean;
  canIdentify: boolean;
  aiApplied: boolean;
  identifyError: string;
  onIdentify: () => void;
  title?: string;
  tip?: string;
  hidden?: boolean;
};

export function GarageItemPhotosSection({
  photos,
  onChange,
  identifying,
  canIdentify,
  aiApplied,
  identifyError,
  onIdentify,
  title = "Photos",
  tip = "Drive side, non-drive, and a close-up of markings work best.",
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="section-title m-0 text-[20px]">{title}</h2>
        <p className="mt-1 m-0 text-[14px] text-muted-2">{tip}</p>
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <PhotoPicker photos={photos} onChange={onChange} max={8} reorder />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canIdentify}
          title={!photos.length ? "Add a photo first" : undefined}
          aria-disabled={!canIdentify}
          onClick={onIdentify}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-accent-soft-border bg-accent-soft px-4 text-[14px] font-semibold text-accent-hover hover:bg-[#e4edd9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="size-4" aria-hidden />
          {identifying ? "Reading photos…" : "Fill details from photos"}
        </button>
        {!photos.length ? (
          <p className="m-0 text-[13px] text-muted-2">Add a photo first</p>
        ) : aiApplied ? (
          <p className="m-0 text-[13px] text-muted-2">
            Suggested fields filled — edit anything below before saving.
          </p>
        ) : null}
      </div>
      {identifyError ? (
        <p className="m-0 text-[13px] font-medium text-[#9B2C2C]" role="alert">
          {identifyError}
        </p>
      ) : null}
      <p className="m-0 text-[12px] leading-snug text-meta">
        AI may be wrong. You stay in control of every field.
      </p>
    </section>
  );
}
