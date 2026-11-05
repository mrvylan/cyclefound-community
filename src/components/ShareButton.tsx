"use client";

import { useEffect, useRef, useState } from "react";

type ShareButtonProps = {
  title: string;
  /** Short description for native share sheets */
  text?: string;
  /** Absolute or path URL; defaults to the current page */
  url?: string;
  className?: string;
};

type Status = "idle" | "shared" | "copied" | "error";

async function copyToClipboard(url: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  // Older browsers / insecure contexts
  const input = document.createElement("input");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(input);
  if (!ok) throw new Error("Copy failed");
}

function resolveUrl(url?: string) {
  if (!url) return window.location.href;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return window.location.href;
  }
}

/**
 * Share via Web Share API when available; otherwise copy the link.
 * Cancelling the native sheet is silent (not an error).
 */
export function ShareButton({
  title,
  text,
  url,
  className = "",
}: ShareButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function flash(next: Status) {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2200);
  }

  async function onShare() {
    const shareUrl = resolveUrl(url);
    const payload: ShareData = {
      title,
      text: text?.trim() || title,
      url: shareUrl,
    };

    try {
      if (typeof navigator.share === "function") {
        const can =
          typeof navigator.canShare !== "function" || navigator.canShare(payload);
        if (can) {
          await navigator.share(payload);
          flash("shared");
          return;
        }
      }
      await copyToClipboard(shareUrl);
      flash("copied");
    } catch (err) {
      // User dismissed the share sheet — not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await copyToClipboard(shareUrl);
        flash("copied");
      } catch {
        flash("error");
      }
    }
  }

  const label =
    status === "copied"
      ? "Link copied"
      : status === "shared"
        ? "Shared"
        : status === "error"
          ? "Couldn’t share"
          : "Share";

  return (
    <>
      <button
        type="button"
        onClick={() => void onShare()}
        aria-label={
          status === "idle"
            ? `Share: ${title}`
            : label
        }
        className={`h-10 rounded-lg border border-[#D4D3CD] bg-white px-3.5 text-[14px] font-semibold text-ink transition-colors ${
          status === "copied" || status === "shared"
            ? "border-accent bg-accent-soft text-accent-hover"
            : status === "error"
              ? "border-[#E8C4C4] bg-[#FBF1F1] text-[#9B2C2C]"
              : ""
        } ${className}`}
      >
        {label}
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "idle" ? "" : label}
      </span>
    </>
  );
}
