"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SellFromGarage } from "@/components/market/SellFromGarage";
import { ITEM_CATEGORIES } from "@/lib/data/categories";
import { hydrateCommunityDirectory } from "@/lib/community/directory-cache";
import {
  getPublicMarketItems,
  getSessionHandle,
  resolvePerson,
  subscribeStore,
} from "@/lib/data/local-store";
import { DISCIPLINES, inferDiscipline } from "@/lib/garage/disciplines";
import { CONDITIONS } from "@/lib/garage/mapAiCategory";
import { cityFromLoc, type GarageItem, type ItemStatus } from "@/lib/data/seed";

const MARKET: ItemStatus[] = ["For sale", "Open to offers", "Trade only"];

type SortKey = "newest" | "price-asc" | "price-desc";
type Facet = "type" | "discipline" | "size" | "price" | "distance" | "cond";
type Filters = Record<Facet, string[]>;

const EMPTY_FILTERS: Filters = {
  type: [],
  discipline: [],
  size: [],
  price: [],
  distance: [],
  cond: [],
};

const FACET_LABEL: Record<Facet, string> = {
  type: "Type",
  discipline: "Discipline",
  size: "Size",
  price: "Price",
  distance: "Distance",
  cond: "Condition",
};

const PRICE_BUCKETS = [
  { value: "0-250", label: "Under $250", min: 0, max: 250 },
  { value: "250-500", label: "$250 – $500", min: 250, max: 500 },
  { value: "500-1000", label: "$500 – $1,000", min: 500, max: 1000 },
  { value: "1000-2500", label: "$1,000 – $2,500", min: 1000, max: 2500 },
  { value: "2500+", label: "$2,500+", min: 2500, max: Number.POSITIVE_INFINITY },
] as const;

/** "$1,200" → 1200; "—" or unparseable → null. */
function askNumber(ask: string): number | null {
  const n = Number(ask.replace(/[^0-9.]/g, ""));
  return /\d/.test(ask) && Number.isFinite(n) ? n : null;
}

function priceBucket(ask: string): string | null {
  const n = askNumber(ask);
  if (n == null) return null;
  const hit = PRICE_BUCKETS.find((b) => n >= b.min && n < b.max);
  return hit?.value ?? null;
}

function FilterFields({
  options,
  filters,
  onToggle,
  idPrefix,
}: {
  options: Record<Facet, { value: string; label?: string; n: number }[]>;
  filters: Filters;
  onToggle: (facet: Facet, value: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {(Object.keys(FACET_LABEL) as Facet[]).map((facet) =>
        options[facet].length ? (
          <fieldset key={facet} className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-1.5 p-0 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-meta">
              {FACET_LABEL[facet]}
            </legend>
            <div className="flex flex-col">
              {options[facet].map((o) => {
                const id = `${idPrefix}-${facet}-${o.value.replace(/\W+/g, "-")}`;
                return (
                  <label
                    key={o.value}
                    htmlFor={id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px] text-ink"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={filters[facet].includes(o.value)}
                      onChange={() => onToggle(facet, o.value)}
                      className="size-[18px] shrink-0 accent-[#527D31]"
                    />
                    <span className="min-w-0 flex-1">{o.label ?? o.value}</span>
                    <span className="font-mono text-[12px] tabular-nums text-meta">{o.n}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null,
      )}
    </div>
  );
}

export default function MarketPage() {
  const [listings, setListings] = useState<GarageItem[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [sessionHandle, setSessionHandle] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setSessionHandle(getSessionHandle());
      setListings(
        getPublicMarketItems()
          .filter((i) => MARKET.includes(i.status))
          .reverse(),
      );
    };
    load();
    const unsub = subscribeStore(load);
    // Don't rely on a race with CommunityDataSync — await listings + photos here.
    void hydrateCommunityDirectory().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const myCity = useMemo(() => {
    if (!sessionHandle) return "";
    const me = resolvePerson(sessionHandle);
    return me ? cityFromLoc(me.loc).trim() : "";
  }, [sessionHandle]);

  const options = useMemo(() => {
    const tally = (pick: (i: GarageItem) => string) => {
      const m = new Map<string, number>();
      for (const i of listings) {
        const v = pick(i);
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return m;
    };
    const withActive = (
      all: { value: string; label?: string; n: number }[],
      active: string[],
    ) => all.filter((o) => o.n > 0 || active.includes(o.value));

    const byType = tally((i) => i.catShort);
    const byDiscipline = tally((i) => inferDiscipline(i));
    const bySize = tally((i) => i.size?.trim() || "");
    const byPrice = tally((i) => priceBucket(i.ask) || "");
    const byCond = tally((i) => i.cond);
    const byCity = tally((i) => {
      const owner = resolvePerson(i.ownerHandle);
      return owner ? cityFromLoc(owner.loc).trim() : "";
    });

    const distanceOpts: { value: string; label?: string; n: number }[] = [];
    if (myCity) {
      const near = listings.filter((i) => {
        const owner = resolvePerson(i.ownerHandle);
        return owner && cityFromLoc(owner.loc).trim() === myCity;
      }).length;
      distanceOpts.push({
        value: `near:${myCity}`,
        label: `Near me (${myCity})`,
        n: near,
      });
    }
    for (const [city, n] of [...byCity.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      if (!city) continue;
      if (myCity && city === myCity) continue;
      distanceOpts.push({ value: `city:${city}`, label: city, n });
    }

    return {
      type: withActive(
        ITEM_CATEGORIES.map((value) => ({
          value,
          n: byType.get(value) ?? 0,
        })),
        filters.type,
      ),
      discipline: withActive(
        DISCIPLINES.map((value) => ({
          value,
          n: byDiscipline.get(value) ?? 0,
        })),
        filters.discipline,
      ),
      size: withActive(
        [...bySize.entries()]
          .filter(([v]) => v)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([value, n]) => ({ value, n })),
        filters.size,
      ),
      price: withActive(
        PRICE_BUCKETS.map((b) => ({
          value: b.value,
          label: b.label,
          n: byPrice.get(b.value) ?? 0,
        })),
        filters.price,
      ),
      distance: withActive(distanceOpts, filters.distance),
      cond: withActive(
        CONDITIONS.map((value) => ({
          value,
          n: byCond.get(value) ?? 0,
        })),
        filters.cond,
      ),
    } satisfies Record<Facet, { value: string; label?: string; n: number }[]>;
  }, [listings, filters, myCity]);

  const visible = useMemo(() => {
    const list = listings.filter((i) => {
      if (filters.type.length && !filters.type.includes(i.catShort)) return false;
      if (filters.discipline.length && !filters.discipline.includes(inferDiscipline(i))) {
        return false;
      }
      if (filters.size.length && !filters.size.includes(i.size?.trim() || "")) return false;
      if (filters.price.length) {
        const bucket = priceBucket(i.ask);
        if (!bucket || !filters.price.includes(bucket)) return false;
      }
      if (filters.distance.length) {
        const owner = resolvePerson(i.ownerHandle);
        const city = owner ? cityFromLoc(owner.loc).trim() : "";
        const ok = filters.distance.some((d) => {
          if (d.startsWith("near:")) return city === d.slice(5);
          if (d.startsWith("city:")) return city === d.slice(5);
          return false;
        });
        if (!ok) return false;
      }
      if (filters.cond.length && !filters.cond.includes(i.cond)) return false;
      return true;
    });
    if (sort === "newest") return list;
    const dir = sort === "price-asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const pa = askNumber(a.ask);
      const pb = askNumber(b.ask);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * dir;
    });
  }, [listings, filters, sort]);

  const activeCount = (Object.keys(filters) as Facet[]).reduce(
    (n, k) => n + filters[k].length,
    0,
  );

  function toggle(facet: Facet, value: string) {
    setFilters((f) => ({
      ...f,
      [facet]: f[facet].includes(value)
        ? f[facet].filter((v) => v !== value)
        : [...f[facet], value],
    }));
  }

  const sortSelect = (
    <div className="flex items-center gap-2">
      <label htmlFor="market-sort" className="text-[13px] font-semibold text-ink">
        Sort
      </label>
      <select
        id="market-sort"
        value={sort}
        onChange={(e) => setSort(e.target.value as SortKey)}
        className="cf-select h-11 rounded-[10px] border border-[#D4D3CD] bg-white pl-3 text-[14px] text-ink"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </div>
  );

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1280px] px-5 pb-8 pt-10 sm:px-8 sm:pt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="section-title m-0 text-[clamp(32px,8vw,64px)] text-balance">
                Parts and bikes from real garages
              </h1>
              <p className="mt-3 m-0 max-w-[640px] text-[16px] leading-[1.55] text-muted-2 sm:mt-4 sm:text-[18px]">
                Listings come from member garages. Every item is tied to a person and the rest of
                what they own.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSellOpen(true)}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover sm:w-auto"
            >
              Sell from your garage
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-5 py-8 pb-16 sm:px-8">
        {listings.length === 0 ? (
          <EmptyState
            title="Nothing for sale yet"
            description="When members list bikes or parts, they show up here."
            actionLabel="Sell from your garage"
            actionHref="/garage/new?status=For%20sale"
          />
        ) : (
          <div className="flex items-start gap-8">
            <aside
              aria-label="Filters"
              className="sticky top-24 hidden w-[240px] shrink-0 rounded-[14px] border border-line bg-surface p-5 lg:block"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="m-0 text-[15px] font-bold normal-case tracking-normal">Filters</h2>
                {activeCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="min-h-8 text-[13px] font-semibold text-accent-hover underline underline-offset-2"
                  >
                    Clear ({activeCount})
                  </button>
                ) : null}
              </div>
              <FilterFields
                idPrefix="rail"
                options={options}
                filters={filters}
                onToggle={toggle}
              />
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-[15px] text-muted-2" aria-live="polite">
                  <strong className="text-ink">{visible.length} available</strong>
                  {activeCount > 0 ? ` of ${listings.length}` : ""} right now
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    aria-haspopup="dialog"
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#D4D3CD] bg-white px-4 text-[14px] font-semibold text-ink hover:border-ink lg:hidden"
                  >
                    <SlidersHorizontal className="size-4" aria-hidden />
                    Filters
                    {activeCount > 0 ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-white">
                        {activeCount}
                      </span>
                    ) : null}
                  </button>
                  {sortSelect}
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line bg-surface px-6 py-10">
                  <h3 className="m-0 text-[17px] font-semibold text-ink">No listings match</h3>
                  <p className="m-0 max-w-[420px] text-[15px] text-muted-2">
                    Loosen a filter to see more of what members have listed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="inline-flex h-11 items-center rounded-[10px] border-0 bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                  {visible.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      photoHeight={180}
                      showOwner
                      showPhotoCount
                      className="hover:border-ink hover:ring-2 hover:ring-ink hover:ring-offset-2 hover:ring-offset-ground"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter listings"
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-surface shadow-[0_-8px_30px_rgba(16,23,27,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="m-0 text-[16px] font-bold normal-case tracking-normal">Filters</h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close filters"
                onClick={() => setSheetOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line bg-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <FilterFields
                idPrefix="sheet"
                options={options}
                filters={filters}
                onToggle={toggle}
              />
            </div>
            <div className="flex gap-3 border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                disabled={activeCount === 0}
                className="h-11 flex-1 rounded-[10px] border border-[#D4D3CD] bg-white text-[14px] font-semibold text-ink disabled:text-meta disabled:opacity-60"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-11 flex-[2] rounded-[10px] border-0 bg-ink text-[14px] font-semibold text-white"
              >
                Show {visible.length} result{visible.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SellFromGarage open={sellOpen} onClose={() => setSellOpen(false)} />
    </>
  );
}
