"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { AccountMenu } from "./auth/AccountMenu";
import { Feature } from "./Feature";
import { FEATURES } from "@/lib/features";

type NavItem = {
  href: string;
  label: string;
  match: "community" | "garages" | "members" | "experts" | "resources" | "market";
};

const betaNav: NavItem[] = [
  { href: "/", label: "Community", match: "community" },
  { href: "/u/lugged_marco/garage", label: "Garages", match: "garages" },
  { href: "/members", label: "Members", match: "members" },
  { href: "/market", label: "Market", match: "market" },
];

/** Deferred nav items — kept for when flags flip back on. */
const deferredNav: NavItem[] = [
  { href: "/experts", label: "Experts", match: "experts" },
  { href: "/resources", label: "Resources", match: "resources" },
];

function navItems(): NavItem[] {
  const items = [...betaNav];
  if (FEATURES.expertsDirectory) {
    const membersIdx = items.findIndex((i) => i.match === "members");
    if (membersIdx >= 0) items.splice(membersIdx, 1);
    items.splice(2, 0, deferredNav[0]);
  }
  if (FEATURES.resourceHub) {
    items.splice(items.length - 1, 0, deferredNav[1]);
  }
  return items;
}

/** Derive the active primary nav section from the current path. */
export function activeNavFromPath(pathname: string): NavItem["match"] | null {
  if (pathname.startsWith("/auth")) return null;
  if (pathname === "/" || pathname.startsWith("/q/")) return "community";
  if (pathname.startsWith("/i/") || pathname.includes("/garage")) return "garages";
  if (pathname.startsWith("/members")) return "members";
  if (pathname.startsWith("/experts") || (pathname.startsWith("/u/") && !pathname.includes("/garage"))) {
    return FEATURES.expertsDirectory ? "experts" : "members";
  }
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/market")) return "market";
  return null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const onAuth = pathname.startsWith("/auth");
  const nextPath = onAuth ? "/" : pathname || "/";
  const active = activeNavFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = navItems();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="border-b border-line bg-white/90 text-ink backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1280px] items-center gap-x-5 px-8 py-3 lg:gap-x-7">
        <Link href="/" aria-label="Cycle Found home" className="shrink-0">
          <Image
            src="/community-logo.png"
            alt="Cycle Found — Ask, Share, Ride"
            width={313}
            height={45}
            className="h-9 w-auto sm:h-11"
            priority
          />
        </Link>

        {!onAuth ? (
          <nav
            aria-label="Primary"
            className="hidden min-w-0 shrink items-center gap-x-[22px] text-[15px] font-bold lg:flex"
          >
            {nav.map((item) => {
              const on = active === item.match;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`whitespace-nowrap py-1.5 no-underline transition-colors ${
                    on
                      ? "border-b-2 border-accent text-accent"
                      : "text-ink hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {!onAuth ? (
          <form
            role="search"
            className="flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-line bg-ground px-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
            <label htmlFor="gsearch" className="sr-only">
              Search Cycle Found
            </label>
            <input
              id="gsearch"
              type="search"
              placeholder="Search Cycle Found"
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-[#929792]"
            />
          </form>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        {!onAuth ? (
          <Link
            href="/ask"
            className="hidden h-[42px] shrink-0 items-center rounded-[10px] bg-accent px-[18px] text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white lg:inline-flex"
          >
            Ask the community
          </Link>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          {!onAuth ? (
            <button
              type="button"
              className="inline-flex size-[42px] items-center justify-center rounded-[10px] border border-line bg-white text-ink lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </button>
          ) : null}
          <AccountMenu nextPath={nextPath} />
        </div>
      </div>

      {!onAuth && menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-white px-8 py-4 lg:hidden"
        >
          <nav aria-label="Primary mobile" className="flex flex-col gap-1">
            {nav.map((item) => {
              const on = active === item.match;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-[10px] px-3 py-3 text-[15px] font-bold no-underline ${
                    on
                      ? "bg-accent-soft text-accent"
                      : "text-ink hover:bg-ground"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/ask"
            className="mt-3 inline-flex h-[44px] w-full items-center justify-center rounded-[10px] bg-accent text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Ask the community
          </Link>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-x-6 gap-y-3 px-8 py-8 text-[13px] text-muted">
      <span>© Cycle Found · Northern California</span>
      <span className="flex flex-wrap gap-[18px]">
        <Link href="/" className="text-muted hover:text-accent-hover">
          Community guidelines
        </Link>
        <Feature name="spokesCurrency">
          <Link href="/" className="text-muted hover:text-accent-hover">
            How Spokes work
          </Link>
        </Feature>
        <Link href="/" className="text-muted hover:text-accent-hover">
          Terms
        </Link>
        <Link href="/" className="text-muted hover:text-accent-hover">
          Privacy
        </Link>
      </span>
    </footer>
  );
}
