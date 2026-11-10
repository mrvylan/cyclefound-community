"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  getCommunityGarageItem,
  getMarketplaceItem,
  hydrateCommunityDirectory,
  removeCommunityGarageItem,
  removeMarketplaceItem,
  upsertCommunityGarageItem,
} from "@/lib/community/directory-cache";
import type { GarageItem } from "@/lib/data/seed";
import {
  archiveGarageItem,
  deleteGarageItem,
  isMarketplaceListingItem,
  unarchiveGarageItem,
} from "@/lib/data/local-store";
import {
  deleteRemoteGarageItem,
  setRemoteGarageArchived,
} from "@/lib/garage/garageRemote";
import { RemoveListingDialog } from "@/components/garage/RemoveListingDialog";
import { CLASSIC_ORIGIN } from "@/lib/legal";

type Props = {
  item: GarageItem;
  /** denser control for table rows */
  compact?: boolean;
};

/**
 * Own-garage overflow menu: Edit / Archive (or Restore) / Delete.
 * Marketplace removals open a typed confirmation dialog (not a one-tap menu).
 */
export function GarageItemActions({ item, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const marketplace = isMarketplaceListingItem(item);
  const communityGarage = Boolean(getCommunityGarageItem(item.id));
  const listingId =
    getMarketplaceItem(item.id)?.listingId ||
    (item as { listingId?: string }).listingId ||
    item.id;
  const editHref = marketplace
    ? `${CLASSIC_ORIGIN}/sell.html?id=${encodeURIComponent(listingId)}`
    : `/item/${item.id}/edit`;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function stop(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function openRemoveDialog() {
    setOpen(false);
    setError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    if (busy) return;
    setDialogOpen(false);
    setError("");
  }

  async function onArchive() {
    setError("");
    setBusy(true);
    try {
      if (communityGarage) {
        await setRemoteGarageArchived(item.id, true);
        const cached = getCommunityGarageItem(item.id);
        if (cached) upsertCommunityGarageItem({ ...cached, archived: true });
      } else {
        archiveGarageItem(item.id);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive.");
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setError("");
    setBusy(true);
    try {
      if (communityGarage) {
        await setRemoteGarageArchived(item.id, false);
        const cached = getCommunityGarageItem(item.id);
        if (cached) upsertCommunityGarageItem({ ...cached, archived: false });
      } else {
        unarchiveGarageItem(item.id);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore.");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmRemove() {
    setError("");
    setBusy(true);
    try {
      if (marketplace) {
        const listingId =
          (item as { listingId?: string }).listingId || item.id;
        const res = await fetch(
          `/api/community/listings/${encodeURIComponent(listingId)}`,
          {
            method: "DELETE",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: "REMOVE" }),
          },
        );
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(payload.error || "Could not remove marketplace listing.");
        }
        removeMarketplaceItem(listingId);
        deleteGarageItem(item.id);
        // Refresh directory so Market / garage stop showing the paused listing.
        await hydrateCommunityDirectory({ force: true }).catch(() => undefined);
      } else if (communityGarage) {
        await deleteRemoteGarageItem(item.id);
        removeCommunityGarageItem(item.id);
        deleteGarageItem(item.id);
      } else {
        deleteGarageItem(item.id);
      }
      setDialogOpen(false);
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/i/")) {
          window.location.href = marketplace ? "/market" : "/garages";
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative" onClick={stop} onKeyDown={stop}>
        <button
          type="button"
          aria-label={`Manage ${item.name}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={busy}
          onClick={(e) => {
            stop(e);
            setOpen((v) => !v);
          }}
          className={`inline-flex items-center justify-center rounded-[8px] border border-line bg-white text-ink shadow-sm hover:bg-ground disabled:opacity-60 ${
            compact ? "size-9" : "size-10"
          }`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 z-30 mt-1.5 w-[13rem] overflow-hidden rounded-[10px] border border-line bg-white py-1 shadow-[0_10px_28px_rgba(16,23,27,0.14)]"
          >
            <Link
              role="menuitem"
              href={editHref}
              {...(marketplace
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-ink no-underline hover:bg-ground"
              onClick={() => setOpen(false)}
            >
              <Pencil className="size-3.5 text-muted" aria-hidden />
              Edit
            </Link>

            {!marketplace ? (
              item.archived ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-ground disabled:opacity-60"
                  onClick={() => {
                    void onRestore();
                  }}
                >
                  <RotateCcw className="size-3.5 text-muted" aria-hidden />
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-ground disabled:opacity-60"
                  onClick={() => {
                    void onArchive();
                  }}
                >
                  <Archive className="size-3.5 text-muted" aria-hidden />
                  Archive
                </button>
              )
            ) : null}

            <div className="my-1 border-t border-line-soft" role="separator" />

            <button
              type="button"
              role="menuitem"
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-[#9B2C2C] hover:bg-ground disabled:opacity-60"
              onClick={openRemoveDialog}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {marketplace ? "Remove from Market" : "Delete"}
            </button>
          </div>
        ) : null}
      </div>

      <RemoveListingDialog
        open={dialogOpen}
        title={item.name}
        mode={marketplace ? "marketplace" : "garage"}
        busy={busy}
        error={error}
        onCancel={closeDialog}
        onConfirm={() => {
          void onConfirmRemove();
        }}
      />
    </>
  );
}
