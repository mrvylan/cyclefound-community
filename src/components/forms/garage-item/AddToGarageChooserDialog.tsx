"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { GarageItemTypeChooser } from "./GarageItemTypeChooser";

type Props = {
  open: boolean;
  onClose: () => void;
  status?: string | null;
};

/**
 * Desktop: centered modal. Mobile: bottom sheet.
 * Cards route to /garage/new?type=… and close the dialog.
 */
export function AddToGarageChooserDialog({ open, onClose, status }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[16px] border border-line bg-surface shadow-[0_-8px_40px_rgba(16,23,27,0.18)] sm:rounded-[16px] sm:shadow-[0_16px_48px_rgba(16,23,27,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3 sm:px-5">
          <p id={titleId} className="m-0 text-[14px] font-semibold text-ink">
            Add to garage
          </p>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close chooser"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-[10px] text-ink hover:bg-ground"
          >
            <X className="size-5" aria-hidden strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <GarageItemTypeChooser compact status={status} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
