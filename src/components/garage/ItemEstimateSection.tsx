"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearGarageItemEstimate,
  requestGarageItemEstimate,
  saveOwnerEstimateRange,
} from "@/lib/garage/estimateClient";
import {
  ESTIMATE_DISCLAIMER,
  estimateSourceLabel,
  formatEstimateMidLabel,
  formatEstimateRangeLabel,
  formatUsdCompactFromCents,
  hasEstimate,
  type ItemEstimate,
} from "@/lib/garage/estimates";
import { hydrateCommunityDirectory } from "@/lib/community/directory-cache";

type Props = {
  itemId: string;
  estimate: ItemEstimate | null | undefined;
  isOwner: boolean;
  /** When true, show a Log in path for would-be owners. */
  signedIn?: boolean;
  onEstimateChange?: (next: ItemEstimate | null) => void;
};

/**
 * Optional fair-market value — separate from AI identify / Fill details from photos.
 */
export function ItemEstimateSection({
  itemId,
  estimate,
  isOwner,
  signedIn = false,
  onEstimateChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [lowUsd, setLowUsd] = useState("");
  const [highUsd, setHighUsd] = useState("");
  const [local, setLocal] = useState(estimate);

  const current = local ?? estimate;
  const valued = hasEstimate(current);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#estimate") return;
    const el = document.getElementById("estimate");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function afterChange(next: ItemEstimate | null) {
    setLocal(next);
    onEstimateChange?.(next);
    await hydrateCommunityDirectory({ force: true }).catch(() => undefined);
  }

  async function onGenerate() {
    setError("");
    setBusy(true);
    try {
      const result = await requestGarageItemEstimate(itemId);
      await afterChange(result.estimate);
      setShowManual(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Estimate failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveManual(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await saveOwnerEstimateRange(itemId, {
        lowUsd: Number(lowUsd),
        highUsd: Number(highUsd),
      });
      await afterChange(result.estimate);
      setShowManual(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save range.");
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    setError("");
    setBusy(true);
    try {
      const result = await clearGarageItemEstimate(itemId);
      await afterChange(result.estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear estimate.");
    } finally {
      setBusy(false);
    }
  }

  const loginHref = `/auth?mode=login&next=${encodeURIComponent(`/i/${itemId}#estimate`)}`;

  return (
    <section
      id="estimate"
      className="scroll-mt-24 rounded-2xl border border-accent-soft-border bg-accent-soft/40 p-6"
    >
      <h2 className="section-title mb-1 mt-0 text-[20px]">Estimated value</h2>
      <p className="mt-0 mb-4 text-[14px] text-muted-2">
        Optional fair-market range — separate from photo identify.
      </p>

      {valued ? (
        <div className="rounded-[12px] border border-accent-soft-border bg-white px-4 py-4">
          <p className="eyebrow m-0 text-accent-hover">Estimated fair market value</p>
          <p className="section-title m-0 mt-1 text-[32px]">
            {formatEstimateMidLabel(current)}
          </p>
          <p className="m-0 mt-1 font-mono text-[13px] text-muted-2">
            {formatEstimateRangeLabel(current)} · estimate
            {current?.confidence && current.confidence !== "None"
              ? ` · ${current.confidence} confidence`
              : ""}
            {current?.sampleSize ? ` · ${current.sampleSize} comps` : ""}
            {current?.source
              ? ` · ${estimateSourceLabel(current.source)}`
              : ""}
          </p>
          <p className="m-0 mt-2 text-[12px] leading-snug text-muted-2">
            {current?.disclaimer || ESTIMATE_DISCLAIMER}
          </p>
          {current?.ebayFallbackMessage ? (
            <p className="m-0 mt-2 text-[12px] leading-snug text-muted">
              eBay comps unavailable — used AI instead. {current.ebayFallbackMessage}
            </p>
          ) : null}
          {current?.comps && current.comps.length > 0 ? (
            <ul className="mt-3 m-0 list-none space-y-1.5 border-t border-line-soft p-0 pt-3">
              {current.comps.slice(0, 4).map((comp, i) => (
                <li key={`${comp.itemId || comp.title || i}-${i}`} className="text-[12px]">
                  {comp.itemWebUrl ? (
                    <a
                      href={comp.itemWebUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink no-underline hover:text-accent-hover"
                    >
                      {comp.title || "Sold listing"}
                    </a>
                  ) : (
                    <span className="font-medium text-ink">{comp.title || "Sold listing"}</span>
                  )}
                  <span className="ml-1.5 font-mono text-muted-2">
                    {formatUsdCompactFromCents(comp.adjustedCents ?? comp.soldPriceCents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-accent-soft-border bg-white px-4 py-4">
          <p className="m-0 text-[15px] font-semibold text-ink">No estimate yet</p>
          <p className="m-0 mt-1 text-[14px] text-muted-2">
            {isOwner
              ? "Tap Get estimate to use eBay sold comps when available (AI fallback), or enter your own low–high dollars."
              : signedIn
                ? "Only the owner can add an estimate for this item."
                : "Sign in as the owner to run Get estimate on this item."}
          </p>
          {!isOwner && !signedIn ? (
            <Link
              href={loginHref}
              className="mt-3 inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
            >
              Log in to estimate
            </Link>
          ) : null}
        </div>
      )}

      {isOwner ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onGenerate()}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "Working…" : valued ? "Refresh estimate" : "Get estimate"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowManual((v) => !v)}
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ground disabled:opacity-50"
            >
              {showManual ? "Cancel" : "Enter my own range"}
            </button>
            {valued ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onClear()}
                className="inline-flex h-11 items-center px-2 text-[14px] font-semibold text-muted-2 hover:text-ink disabled:opacity-50"
              >
                Clear estimate
              </button>
            ) : null}
          </div>

          {showManual ? (
            <form
              onSubmit={onSaveManual}
              className="grid grid-cols-1 gap-3 rounded-[12px] border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="est-low" className="text-[13px] font-semibold">
                  Low (USD)
                </label>
                <input
                  id="est-low"
                  inputMode="decimal"
                  value={lowUsd}
                  onChange={(e) => setLowUsd(e.target.value)}
                  placeholder="1900"
                  className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="est-high" className="text-[13px] font-semibold">
                  High (USD)
                </label>
                <input
                  id="est-high"
                  inputMode="decimal"
                  value={highUsd}
                  onChange={(e) => setHighUsd(e.target.value)}
                  placeholder="2900"
                  className="h-11 rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-ink px-4 text-[14px] font-semibold text-white disabled:opacity-50 sm:w-auto"
                >
                  Save range
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="m-0 mt-3 text-[14px] font-medium text-[#9B2C2C]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
