"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { GarageItem } from "@/lib/data/seed";
import {
  archiveGarageItem,
  deleteGarageItem,
  unarchiveGarageItem,
} from "@/lib/data/local-store";

type Props = {
  item: GarageItem;
  /** denser control for table rows */
  compact?: boolean;
};

/**
 * Own-garage overflow menu: Edit / Archive (or Restore) / Delete.
 * Stops navigation when used inside a card Link.
 */
export function GarageItemActions({ item, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmDelete(false);
      }
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

  return (
    <div ref={rootRef} className="relative" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        aria-label={`Manage ${item.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
          setConfirmDelete(false);
        }}
        className={`inline-flex items-center justify-center rounded-[8px] border border-line bg-white text-ink shadow-sm hover:bg-ground ${
          compact ? "size-9" : "size-10"
        }`}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-30 mt-1.5 w-[11.5rem] overflow-hidden rounded-[10px] border border-line bg-white py-1 shadow-[0_10px_28px_rgba(16,23,27,0.14)]"
        >
          <Link
            role="menuitem"
            href={`/item/${item.id}/edit`}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-ink no-underline hover:bg-ground"
            onClick={() => setOpen(false)}
          >
            <Pencil className="size-3.5 text-muted" aria-hidden />
            Edit
          </Link>

          {item.archived ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-ground"
              onClick={() => {
                unarchiveGarageItem(item.id);
                setOpen(false);
              }}
            >
              <RotateCcw className="size-3.5 text-muted" aria-hidden />
              Restore
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-ground"
              onClick={() => {
                archiveGarageItem(item.id);
                setOpen(false);
              }}
            >
              <Archive className="size-3.5 text-muted" aria-hidden />
              Archive
            </button>
          )}

          <div className="my-1 border-t border-line-soft" role="separator" />

          {!confirmDelete ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-[#9B2C2C] hover:bg-ground"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 px-2.5 py-2">
              <p className="m-0 text-[12px] leading-snug text-muted-2">
                Remove permanently?
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] bg-[#9B2C2C] text-[12px] font-semibold text-white"
                  onClick={() => {
                    deleteGarageItem(item.id);
                    setOpen(false);
                    setConfirmDelete(false);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] border border-line bg-white text-[12px] font-semibold"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
