"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  photos: string[];
  index: number;
  alt?: string;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/**
 * Full-viewport photo viewer for garage item images.
 * Escape / backdrop / close button dismiss; arrows cycle when multiple photos.
 */
export function PhotoLightbox({
  photos,
  index,
  alt = "",
  open,
  onClose,
  onIndexChange,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (photos.length < 2) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange((index - 1 + photos.length) % photos.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange((index + 1) % photos.length);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, photos.length, index, onClose, onIndexChange]);

  if (!mounted || !open || !photos.length) return null;

  const src = photos[index] ?? photos[0];
  const multi = photos.length > 1;

  function go(delta: number) {
    if (!multi) return;
    onIndexChange((index + delta + photos.length) % photos.length);
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-ink/92"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p
          id={titleId}
          className="m-0 font-mono text-[13px] tabular-nums tracking-[0.04em] text-on-dark-muted"
        >
          {index + 1} / {photos.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close photo"
          onClick={onClose}
          className="inline-flex size-11 items-center justify-center rounded-[10px] text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-5" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {multi ? (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
          >
            <ChevronLeft className="size-6" strokeWidth={1.8} aria-hidden />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {multi ? (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
          >
            <ChevronRight className="size-6" strokeWidth={1.8} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
