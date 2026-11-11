"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import type { GarageItem } from "@/lib/data/seed";
import {
  getGarageCoverItemId,
  setGarageCoverItemId,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  garageCoverCandidates,
  resolveGarageCoverItem,
} from "@/lib/garage/garageCover";
import { itemDisplayTitle } from "@/lib/garage/itemFields";
import { createClient } from "@/lib/supabase/client";

type Props = {
  handle: string;
  items: GarageItem[];
};

/**
 * Owner control: pick which item photo features as the garage cover
 * on /garages and garage spotlights. Defaults to a bike when unset.
 */
export function GarageCoverPicker({ handle, items }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);
  void tick;

  const candidates = useMemo(() => garageCoverCandidates(items), [items]);
  const savedId = getGarageCoverItemId(handle);
  const active = resolveGarageCoverItem(items, savedId);
  const previewUrl = candidates.find((c) => c.item.id === active?.id)?.photoUrl;

  if (!candidates.length) return null;

  async function persist(itemId: string | null) {
    setError("");
    setSaving(true);
    try {
      setGarageCoverItemId(handle, itemId);
      try {
        const supabase = createClient();
        const { error: metaError } = await supabase.auth.updateUser({
          data: {
            garage_cover_item_id: itemId || null,
          },
        });
        if (metaError) throw metaError;
      } catch {
        // Local patch is enough for this browser; auth metadata is best-effort.
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save cover.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex h-[46px] items-center gap-2 rounded-[10px] border border-[#D4D3CD] bg-white px-[18px] font-semibold text-ink hover:bg-ground"
      >
        <ImageIcon className="size-4" aria-hidden />
        {previewUrl ? "Change cover" : "Choose cover"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => {
            if (!saving) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(85vh,640px)] w-full max-w-[520px] overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_20px_50px_rgba(16,23,27,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
              <div>
                <h2 id={titleId} className="section-title m-0 text-[22px]">
                  Garage cover
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-2">
                  This photo shows on the Garages directory. Bikes are used by
                  default when you haven&apos;t picked one.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] text-ink hover:bg-ground disabled:opacity-60"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="max-h-[min(55vh,420px)] overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {candidates.map(({ item, photoUrl, isBike }) => {
                  const selected = active?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        void persist(item.id);
                      }}
                      className={`overflow-hidden rounded-[12px] border text-left disabled:opacity-60 ${
                        selected
                          ? "border-accent ring-2 ring-accent/30"
                          : "border-line hover:border-[#D4D3CD]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="block space-y-0.5 px-2.5 py-2">
                        <span className="line-clamp-2 text-[13px] font-semibold text-ink">
                          {itemDisplayTitle(item.name, item.year)}
                        </span>
                        <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                          {isBike ? "Bike" : "Part / gear"}
                          {selected ? " · Cover" : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
              <button
                type="button"
                disabled={saving || !savedId}
                onClick={() => {
                  void persist(null);
                }}
                className="text-[13px] font-semibold text-muted-2 hover:text-ink disabled:opacity-40"
              >
                Use default (bikes first)
              </button>
              {error ? (
                <p className="m-0 text-[13px] text-[#9B2C2C]">{error}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
