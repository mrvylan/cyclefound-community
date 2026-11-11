"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AddToGarageChooserDialog } from "./AddToGarageChooserDialog";
import { garageNewHref } from "@/lib/garage/item-types";

type Props = {
  children: ReactNode;
  className?: string;
  status?: string | null;
  /** Use a real link for progressive enhancement / empty states. Default: button opens dialog. */
  asLink?: boolean;
};

/**
 * Primary “Add to garage” control — opens type chooser (modal / bottom sheet).
 * `asLink` navigates to /garage/new (full-page chooser) instead.
 */
export function AddToGarageCta({
  children,
  className,
  status,
  asLink = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const href = garageNewHref({ status });

  if (asLink) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <AddToGarageChooserDialog
        open={open}
        onClose={() => setOpen(false)}
        status={status}
      />
    </>
  );
}
