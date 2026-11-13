"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { Feature } from "@/components/Feature";
import { BuildOriginBadge } from "@/components/garage/BuildOriginBadge";
import { PlaceholderPhoto, StatusChip } from "@/components/ui";
import { cityFromLoc, type GarageItem } from "@/lib/data/seed";
import { getItemPhotoUrls, resolvePerson } from "@/lib/data/local-store";
import { FEATURES } from "@/lib/features";
import { inferDiscipline } from "@/lib/garage/disciplines";
import {
  formatEstimateRangeLabel,
  hasEstimate,
} from "@/lib/garage/estimates";
import {
  formatAskPrice,
  itemDisplayTitle,
  itemYearLabel,
} from "@/lib/garage/itemFields";

export function itemTypeLabel(item: GarageItem): string {
  const discipline = inferDiscipline(item);
  if (item.catShort === "Complete bikes" || item.catShort === "Framesets") {
    return discipline !== "Other" ? discipline : item.catShort;
  }
  if (item.catShort === "Other" && discipline !== "Other") return discipline;
  return item.catShort || discipline;
}

function itemMetaLine(item: GarageItem) {
  return [item.size?.trim(), itemYearLabel(item.year), item.cond]
    .filter(Boolean)
    .join(" · ");
}

function hasAsk(item: GarageItem) {
  return Boolean(item.ask && item.ask.trim() && item.ask.trim() !== "—");
}

function AskingLine({ item }: { item: GarageItem }) {
  const showAsk = item.status !== "Not for sale" && !item.archived;
  if (!showAsk) return null;
  if (hasAsk(item)) {
    return (
      <span className="text-right">
        <span className="block text-[11px] text-meta">ASKING</span>
        <span className="font-mono tabular-nums">{formatAskPrice(item.ask)}</span>
      </span>
    );
  }
  if (item.status === "Open to offers") {
    return (
      <span className="text-right">
        <span className="block text-[11px] text-meta">ASKING</span>
        <span className="text-[13px] font-semibold text-status-offers">Make an offer</span>
      </span>
    );
  }
  return null;
}

type Props = {
  item: GarageItem;
  /** Override link target (defaults to `/i/{id}`). */
  href?: string;
  photoHeight?: number;
  /** Market cards: show seller name · city. */
  showOwner?: boolean;
  showDescription?: boolean;
  showPhotoCount?: boolean;
  /**
   * Own garage: turn empty Est. value into a Get estimate CTA that opens
   * the item estimate block.
   */
  estimateCta?: boolean;
  /** Extra chrome above the card body (e.g. owner actions). */
  overlay?: React.ReactNode;
  className?: string;
};

/** Shared listing card — photo, type, title, meta, status, asking. */
export function ItemCard({
  item,
  href,
  photoHeight = 160,
  showOwner = false,
  showDescription = false,
  showPhotoCount = false,
  estimateCta = false,
  overlay,
  className = "",
}: Props) {
  const photos = getItemPhotoUrls(item);
  const title = itemDisplayTitle(item.name, item.year);
  const type = itemTypeLabel(item);
  const meta = itemMetaLine(item);
  const owner = showOwner ? resolvePerson(item.ownerHandle) : undefined;
  const showGetEstimate =
    FEATURES.garageEstimates && estimateCta && !hasEstimate(item.estimate);
  const baseTo = href || `/i/${item.id}`;
  const to = showGetEstimate ? `${baseTo}#estimate` : baseTo;

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface ${className}`}
    >
      {overlay}
      <Link
        href={to}
        className="flex h-full flex-col text-ink no-underline outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {photos[0] ? (
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ height: photoHeight }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="size-full object-cover" />
            {showPhotoCount && photos.length > 1 ? (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-ink/80 px-2 py-1 font-mono text-[12px] text-white">
                <Camera className="size-3.5" aria-hidden />
                {photos.length}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="shrink-0" style={{ height: photoHeight }}>
            <PlaceholderPhoto
              silhouette
              label={meta || type}
              className="h-full"
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[11px] tracking-[0.04em] text-meta uppercase">
              {type}
            </span>
            {item.archived ? (
              <span className="inline-flex items-center rounded-full border border-line bg-ground px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] text-muted-2">
                Archived
              </span>
            ) : (
              <StatusChip status={item.status} />
            )}
          </div>

          <span className="text-[16px] font-semibold leading-snug">{title}</span>
          {meta ? (
            <span className="font-mono text-[12px] text-meta">{meta}</span>
          ) : null}
          {item.bikeComponents?.length ? (
            <BuildOriginBadge components={item.bikeComponents} compact />
          ) : null}
          {showDescription && item.description ? (
            <p className="m-0 line-clamp-2 text-[13px] leading-snug text-muted-2">
              {item.description}
            </p>
          ) : null}
          {owner ? (
            <span className="text-[13px] text-meta">
              {owner.publicHandle
                ? `@${owner.publicHandle}`
                : owner.name}{" "}
              · {cityFromLoc(owner.loc)}
            </span>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-line-soft pt-3 text-[13px]">
            {FEATURES.garageEstimates ? (
              showGetEstimate ? (
                <span>
                  <span className="block text-[11px] text-meta">EST. VALUE</span>
                  <span className="font-semibold text-accent-hover">Get estimate →</span>
                </span>
              ) : (
                <span>
                  <span className="block text-[11px] text-meta">EST. VALUE</span>
                  <span
                    className={`font-mono tabular-nums ${
                      hasEstimate(item.estimate) ? "text-ink" : "text-meta"
                    }`}
                  >
                    {hasEstimate(item.estimate)
                      ? formatEstimateRangeLabel(item.estimate)
                      : "No estimate"}
                  </span>
                </span>
              )
            ) : (
              <Feature name="marketValues">
                <span>
                  <span className="block text-[11px] text-meta">MARKET</span>
                  <span className="font-mono tabular-nums">{item.mkt}</span>
                </span>
              </Feature>
            )}
            <span className="ml-auto">
              <AskingLine item={item} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
