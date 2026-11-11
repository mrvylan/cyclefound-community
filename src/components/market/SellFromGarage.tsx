"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PlaceholderPhoto } from "@/components/ui";
import { authHref } from "@/lib/auth/redirects";
import {
  getGarageItemsFor,
  getItemPhotoUrls,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";
import { formatAskPrice, itemYearLabel } from "@/lib/garage/itemFields";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Pick a garage item and jump to edit with For sale status. */
export function SellFromGarage({ open, onClose }: Props) {
  const router = useRouter();
  const { ready, configured, user } = useAuth();
  const [handle, setHandle] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setHandle(getSessionHandle());
    return subscribeStore(() => {
      setHandle(getSessionHandle());
      setTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    void tick;
    if (!handle) return [];
    return getGarageItemsFor(handle).filter((i) => !i.archived);
  }, [handle, tick]);

  if (!open) return null;

  const needsLogin = ready && configured && !user && !handle;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sell-garage-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_16px_40px_rgba(16,23,27,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div>
            <h2 id="sell-garage-title" className="section-title m-0 text-[22px]">
              Sell from your garage
            </h2>
            <p className="m-0 mt-1 text-[13px] text-muted-2">
              Pick an item, then set it to For sale.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line text-ink hover:bg-ground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {needsLogin ? (
            <div className="flex flex-col gap-3 py-4">
              <p className="m-0 text-[15px] text-muted-2">
                Log in to list something you already documented in your garage.
              </p>
              <Link
                href={authHref("login", "/market")}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                onClick={onClose}
              >
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col gap-3 py-4">
              <p className="m-0 text-[15px] text-muted-2">
                Your garage is empty — document a bike or part first, then list it here.
              </p>
              <Link
                href="/garage/new?status=For%20sale"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                onClick={onClose}
              >
                Add to garage for sale
              </Link>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items.map((item) => {
                const photo = getItemPhotoUrls(item)[0];
                const year = itemYearLabel(item.year);
                const meta = [item.size?.trim(), year, item.cond].filter(Boolean).join(" · ");
                const listed = item.status !== "Not for sale";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(
                          `/item/${item.id}/edit?status=${encodeURIComponent("For sale")}`,
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-[12px] border border-line bg-white p-2.5 text-left hover:border-ink hover:bg-ground"
                    >
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt=""
                          className="size-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <PlaceholderPhoto className="size-14 shrink-0 rounded-lg" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-ink">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-meta">
                          {meta || item.catShort}
                          {listed ? ` · ${item.status}` : ""}
                          {hasAsk(item) ? ` · ${formatAskPrice(item.ask)}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-accent">
                        {listed ? "Edit listing" : "List"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!needsLogin ? (
          <div className="border-t border-line-soft px-5 py-3">
            <Link
              href="/garage/new?status=For%20sale"
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-line bg-white text-[14px] font-semibold text-ink no-underline hover:bg-ground"
              onClick={onClose}
            >
              Or document a new item
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function hasAsk(item: { ask: string }) {
  return Boolean(item.ask && item.ask.trim() && item.ask.trim() !== "—");
}
