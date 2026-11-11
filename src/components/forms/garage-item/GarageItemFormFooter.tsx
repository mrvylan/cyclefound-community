"use client";

import Link from "next/link";

type Props = {
  needsAuth: boolean;
  saving: boolean;
  cancelHref: string;
  error?: string;
  submitLabelAuth?: string;
  submitLabelSaving?: string;
  submitLabelDefault?: string;
  cancelLabel?: string;
};

/** Error alert + submit/cancel row from the original Add form. */
export function GarageItemFormFooter({
  needsAuth,
  saving,
  cancelHref,
  error = "",
  submitLabelAuth = "Join & add to garage",
  submitLabelSaving = "Saving to your account…",
  submitLabelDefault = "Add to garage",
  cancelLabel = "Cancel",
}: Props) {
  return (
    <>
      {error ? (
        <p className="m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-[10px] bg-accent px-6 text-[16px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {needsAuth
            ? submitLabelAuth
            : saving
              ? submitLabelSaving
              : submitLabelDefault}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-muted-2 no-underline hover:text-ink"
        >
          {cancelLabel}
        </Link>
      </div>
    </>
  );
}
