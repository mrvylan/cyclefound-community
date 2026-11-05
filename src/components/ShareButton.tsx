"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";

type ShareButtonProps = {
  title: string;
  /** Short description for native share sheets / email body */
  text?: string;
  /** Absolute or path URL; defaults to the current page */
  url?: string;
  className?: string;
};

type Feedback = "idle" | "copied" | "shared" | "error";

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("input");
  input.value = value;
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
  if (typeof window === "undefined") return url || "";
  if (!url) return window.location.href;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return window.location.href;
  }
}

/** Native sheet on phones; desktop keeps the copy/email menu even if share exists. */
function shouldUseNativeShare(payload: ShareData) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const touch =
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (!touch) return false;
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare(payload);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Mobile: native share sheet when available.
 * Desktop: compact menu with Copy link + Email, plus confirmation feedback.
 */
export function ShareButton({
  title,
  text,
  url,
  className = "",
}: ShareButtonProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [native, setNative] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>("idle");

  const summary = text?.trim() || title;

  useEffect(() => {
    const probe = resolveUrl(url);
    setNative(
      shouldUseNativeShare({
        title,
        text: summary,
        url: probe || "https://example.com",
      }),
    );
  }, [title, summary, url]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    copyBtnRef.current?.focus();

    function onPointerDown(e: MouseEvent | PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function flash(next: Feedback) {
    setFeedback(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setFeedback("idle"), 2200);
  }

  async function shareNative() {
    const shareUrl = resolveUrl(url);
    const payload: ShareData = { title, text: summary, url: shareUrl };
    try {
      await navigator.share(payload);
      flash("shared");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Fall through to menu if native share fails unexpectedly
      setOpen(true);
    }
  }

  async function copyLink() {
    try {
      await copyToClipboard(resolveUrl(url));
      flash("copied");
      setTimeout(() => setOpen(false), 900);
    } catch {
      flash("error");
    }
  }

  function emailLink() {
    const shareUrl = resolveUrl(url);
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${summary}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  }

  async function onTrigger() {
    if (native) {
      await shareNative();
      return;
    }
    setOpen((v) => !v);
  }

  const triggerLabel =
    feedback === "copied"
      ? "Link copied"
      : feedback === "shared"
        ? "Shared"
        : feedback === "error"
          ? "Couldn’t share"
          : "Share";

  const success = feedback === "copied" || feedback === "shared";

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => void onTrigger()}
        aria-haspopup={native ? undefined : "menu"}
        aria-expanded={native ? undefined : open}
        aria-controls={native || !open ? undefined : menuId}
        aria-label={feedback === "idle" ? `Share: ${title}` : triggerLabel}
        className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-[14px] font-semibold transition-colors ${
          success
            ? "border-accent-soft-border bg-accent-soft text-accent-hover"
            : feedback === "error"
              ? "border-[#E8C4C4] bg-[#FBF1F1] text-[#9B2C2C]"
              : "border-[#D4D3CD] bg-white text-ink hover:border-[#C4C3BD]"
        }`}
      >
        {success ? (
          <Check className="size-3.5 stroke-[2.4]" aria-hidden />
        ) : (
          <Share2 className="size-3.5 stroke-[2.2]" aria-hidden />
        )}
        {triggerLabel}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Share options"
          className="absolute top-[calc(100%+6px)] left-0 z-30 min-w-[200px] rounded-[12px] border border-line bg-surface p-1.5 shadow-[0_8px_24px_rgba(16,23,27,0.08)]"
        >
          <button
            ref={copyBtnRef}
            type="button"
            role="menuitem"
            onClick={() => void copyLink()}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[14px] font-semibold text-ink hover:bg-ground"
          >
            {feedback === "copied" ? (
              <Check className="size-4 shrink-0 text-accent-hover" aria-hidden />
            ) : (
              <Link2 className="size-4 shrink-0 text-muted" aria-hidden />
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{feedback === "copied" ? "Link copied" : "Copy link"}</span>
              {feedback !== "copied" ? (
                <span className="truncate font-mono text-[11px] font-normal text-muted">
                  {typeof window !== "undefined" ? resolveUrl(url).replace(/^https?:\/\//, "") : ""}
                </span>
              ) : null}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={emailLink}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[14px] font-semibold text-ink hover:bg-ground"
          >
            <Mail className="size-4 shrink-0 text-muted" aria-hidden />
            Email
          </button>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {feedback === "idle" ? "" : triggerLabel}
      </span>
    </div>
  );
}
