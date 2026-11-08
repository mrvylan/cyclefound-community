"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowRight,
  Bike,
  CircleHelp,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import {
  getMergedPerson,
  subscribeStore,
} from "@/lib/data/local-store";
import {
  groupSearchHits,
  searchLocal,
  type SearchHit,
} from "@/lib/search/localSearch";

const KIND_META: Record<
  SearchHit["kind"],
  { label: string; Icon: typeof UserRound }
> = {
  member: { label: "Members", Icon: UserRound },
  question: { label: "Questions", Icon: CircleHelp },
  item: { label: "Garage & market", Icon: Bike },
};

/** Mix of brands, parts, people, listing filters, and question types. */
const HINTS = ["Campagnolo", "seatpost", "Dylan", "for sale", "repair"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
};

export function SearchOverlay({ open, onOpenChange, initialQuery = "" }: Props) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return subscribeStore(() => setTick((t) => t + 1));
  }, []);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
    };
  }, [open, initialQuery]);

  // Capture-phase Escape: type=search inputs often swallow Esc before React sees it.
  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  // Outside click/tap — listen on document so header stacking / backdrop-blur can't trap hits.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.contains(target)) return;
      close();
    }
    // Defer so the opening click on the trigger doesn't immediately close.
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  void tick;

  const hits = useMemo(() => searchLocal(query).slice(0, 12), [query, tick]);
  const grouped = useMemo(() => groupSearchHits(hits), [hits]);
  const flat = useMemo(
    () => [...grouped.members, ...grouped.questions, ...grouped.items],
    [grouped],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (flat[activeIndex]) {
      goTo(flat[activeIndex]!.href);
      return;
    }
    close();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i + 1) % flat.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      return;
    }
  }

  useEffect(() => {
    if (!open || !flat.length) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flat.length, open]);

  if (!open || !mounted) return null;

  const trimmed = query.trim();
  const indexByKey = new Map<string, number>(
    flat.map((hit, index) => [`${hit.kind}-${hit.id}`, index]),
  );

  const overlay = (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[min(12vh,7rem)] sm:px-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_24px_64px_rgba(16,23,27,0.22)]"
      >
        <h2 id={titleId} className="sr-only">
          Search Cycle Found
        </h2>

        <form
          role="search"
          onSubmit={onSubmit}
          className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5"
        >
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search members, questions, garage items…"
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={
              flat[activeIndex]
                ? `search-hit-${flat[activeIndex]!.kind}-${flat[activeIndex]!.id}`
                : undefined
            }
            className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-[#929792] focus-visible:outline-none"
          />
          {trimmed ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-ground hover:text-ink focus-visible:outline-none focus-visible:bg-ground"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
          <kbd className="hidden rounded-md border border-line bg-ground px-1.5 py-0.5 font-mono text-[11px] text-muted sm:inline">
            esc
          </kbd>
        </form>

        <div
          id="search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain"
        >
          {!trimmed ? (
            <div className="px-4 py-5">
              <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
                Try searching for
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => {
                      setQuery(hint);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-line bg-ground px-3 py-1.5 text-[13px] font-medium text-ink hover:border-ink"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="m-0 text-[15px] font-semibold text-ink">
                No results for “{trimmed}”
              </p>
              <p className="mt-2 m-0 text-[14px] text-muted-2">
                Try another name, part, or tag — or browse the full search page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-2">
              {(
                [
                  ["member", grouped.members],
                  ["question", grouped.questions],
                  ["item", grouped.items],
                ] as const
              ).map(([kind, sectionHits]) => {
                if (!sectionHits.length) return null;
                const { label, Icon } = KIND_META[kind];
                return (
                  <div key={kind} className="px-2">
                    <p className="m-0 flex items-center gap-1.5 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                      <Icon className="size-3.5" aria-hidden />
                      {label}
                    </p>
                    <ul className="m-0 list-none p-0">
                      {sectionHits.map((hit) => {
                        const key = `${hit.kind}-${hit.id}`;
                        const index = indexByKey.get(key) ?? 0;
                        const active = index === activeIndex;
                        const person =
                          hit.kind === "member" ? getMergedPerson(hit.id) : undefined;
                        return (
                          <li key={key} role="presentation">
                            <button
                              type="button"
                              id={`search-hit-${hit.kind}-${hit.id}`}
                              role="option"
                              aria-selected={active}
                              data-search-index={index}
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => goTo(hit.href)}
                              className={`flex w-full items-center gap-3 rounded-[10px] border-0 px-2.5 py-2.5 text-left ${
                                active
                                  ? "bg-accent-soft text-ink"
                                  : "bg-transparent text-ink"
                              }`}
                            >
                              {hit.kind === "member" ? (
                                <Avatar
                                  init={person?.init ?? "??"}
                                  bg={person?.bg ?? "#527D31"}
                                  size={36}
                                  src={person?.avatarUrl}
                                />
                              ) : (
                                <span
                                  className={`inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] ${
                                    active ? "bg-white" : "bg-ground"
                                  }`}
                                >
                                  <Icon
                                    className="size-4 text-muted"
                                    aria-hidden
                                  />
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-semibold">
                                  {hit.title}
                                </span>
                                <span className="block truncate text-[12px] text-muted">
                                  {hit.subtitle}
                                </span>
                              </span>
                              {active ? (
                                <ArrowRight
                                  className="size-4 shrink-0 text-accent"
                                  aria-hidden
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-ground/60 px-4 py-2.5">
          <p className="m-0 hidden text-[12px] text-muted sm:block">
            {flat.length
              ? "↑ ↓ to move · Enter to open"
              : "Press Enter to see all results"}
          </p>
          <Link
            href={trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"}
            onClick={close}
            className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:text-accent-hover"
          >
            {trimmed ? "View all results" : "Browse search"}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/** Icon-only header control that opens the search overlay (⌘K / Ctrl K). */
export function SearchTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState("⌘K");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/i.test(
      navigator.platform || navigator.userAgent,
    );
    setShortcut(isApple ? "⌘K" : "Ctrl K");
  }, []);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex size-[42px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-ink hover:bg-ground ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Search Cycle Found (${shortcut})`}
        title={`Search (${shortcut})`}
      >
        <Search className="size-[18px]" aria-hidden />
      </button>
      <SearchOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}
