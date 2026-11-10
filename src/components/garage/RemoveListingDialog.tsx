"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  /** marketplace pause vs permanent garage delete */
  mode: "marketplace" | "garage";
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Destructive confirmation with typed acknowledgment — harder to mis-tap than a menu button.
 */
export function RemoveListingDialog({
  open,
  title,
  mode,
  busy = false,
  error = "",
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const confirmWord = "REMOVE";
  const ready = typed.trim().toUpperCase() === confirmWord;

  useEffect(() => {
    if (!open) {
      setTyped("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow m-0 text-[#9B2C2C]">
              {mode === "marketplace" ? "Remove from Market" : "Delete garage item"}
            </p>
            <h2 id={titleId} className="section-title m-0 mt-1 text-[22px] leading-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-ink hover:bg-ground disabled:opacity-60"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {mode === "marketplace" ? (
          <ul className="m-0 mb-4 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.5] text-muted-2">
            <li>This pauses the classic marketplace listing.</li>
            <li>It will leave Community Market for everyone.</li>
            <li>Photos and listing data stay in your seller account so you can resume later on Classic.</li>
            <li>This cannot be undone from this screen.</li>
          </ul>
        ) : (
          <ul className="m-0 mb-4 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.5] text-muted-2">
            <li>This permanently deletes the Community garage item and its photos.</li>
            <li>Marketplace listings (if any) are not changed by this action.</li>
            <li>This cannot be undone.</li>
          </ul>
        )}

        <label htmlFor="confirm-remove" className="block text-[14px] font-semibold text-ink">
          Type <span className="font-mono tracking-wide">{confirmWord}</span> to confirm
        </label>
        <input
          ref={inputRef}
          id="confirm-remove"
          value={typed}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-2 h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent disabled:opacity-60"
          placeholder={confirmWord}
        />

        {error ? (
          <p className="mt-3 m-0 text-[14px] font-medium text-[#9B2C2C]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ground disabled:opacity-60"
          >
            Keep listing
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#9B2C2C] px-4 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            {busy
              ? "Removing…"
              : mode === "marketplace"
                ? "Pause and remove from Market"
                : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
