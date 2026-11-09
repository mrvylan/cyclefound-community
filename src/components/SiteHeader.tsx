"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./auth/AccountMenu";
import { SearchTrigger } from "./search/SearchOverlay";
import { Feature } from "./Feature";
import { openCookieSettings } from "@/lib/cookie-consent";
import { subscribeStore } from "@/lib/data/local-store";
import { FEATURES } from "@/lib/features";
import { LEGAL } from "@/lib/legal";

type NavItem = {
  href: string;
  label: string;
  match: "community" | "garages" | "members" | "experts" | "resources" | "market";
};

function betaNav(): NavItem[] {
  return [
    { href: "/", label: "Community", match: "community" },
    { href: "/garages", label: "Garages", match: "garages" },
    { href: "/members", label: "Members", match: "members" },
    { href: "/market", label: "Market", match: "market" },
  ];
}

/** Deferred nav items — kept for when flags flip back on. */
const deferredNav: NavItem[] = [
  { href: "/experts", label: "Experts", match: "experts" },
  { href: "/resources", label: "Resources", match: "resources" },
];

function navItems(): NavItem[] {
  const items = [...betaNav()];
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
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/search")
  ) {
    return null;
  }
  if (pathname === "/" || pathname.startsWith("/q/")) return "community";
  if (
    pathname.startsWith("/garages") ||
    pathname.startsWith("/i/") ||
    pathname.includes("/garage")
  ) {
    return "garages";
  }
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
  /** Home already shows the ask composer — hide the competing header CTA. */
  const hideHeaderAsk = pathname === "/";
  const nextPath = onAuth ? "/" : pathname || "/";
  const active = activeNavFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nav, setNav] = useState<NavItem[]>(() => navItems());

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setNav(navItems());
    return subscribeStore(() => setNav(navItems()));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="relative z-50 border-b border-line bg-white/90 text-ink backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1280px] items-center gap-x-2 px-4 py-2.5 sm:gap-x-3 sm:px-6 sm:py-3 lg:gap-x-7 lg:px-8">
        <Link href="/" aria-label="Cycle Found home" className="shrink-0">
          {/* Mobile: CF mark only — full wordmark from lg. */}
          <Image
            src="/community-logo-mark.png"
            alt="Cycle Found"
            width={76}
            height={40}
            className="h-9 w-auto lg:hidden"
            priority
          />
          <Image
            src="/community-logo.png"
            alt="Cycle Found — Ask, Share, Ride"
            width={313}
            height={45}
            className="hidden h-11 w-auto lg:block"
            priority
          />
        </Link>

        {!onAuth ? (
          <nav
            aria-label="Primary"
            className="hidden min-w-0 flex-1 items-center gap-x-[22px] text-[15px] font-bold lg:flex"
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
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!onAuth ? <SearchTrigger /> : null}
          {!onAuth && !hideHeaderAsk ? (
            <Link
              href="/ask"
              className="hidden h-[42px] shrink-0 items-center rounded-[10px] bg-accent px-[18px] text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white lg:inline-flex"
            >
              Ask the community
            </Link>
          ) : null}
          {!onAuth ? (
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-white text-ink lg:hidden"
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
          className="border-t border-line bg-white px-4 py-4 sm:px-6 lg:hidden"
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
          {!hideHeaderAsk ? (
            <Link
              href="/ask"
              className="mt-3 inline-flex h-[44px] w-full items-center justify-center rounded-[10px] bg-accent text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Ask the community
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-8 py-8 text-center text-[13px] leading-[1.45] text-muted">
      <p className="m-0 max-w-[520px]">
        © 2026 Fault Board Co., LLC. Cycle Found is a trade name of Fault Board Co.,
        LLC.
      </p>
      <nav
        aria-label="Legal"
        className="flex flex-wrap justify-center gap-x-[18px] gap-y-2"
      >
        <Link
          href={LEGAL.communityGuidelines}
          className="text-muted hover:text-accent-hover"
        >
          Guidelines
        </Link>
        <Feature name="spokesCurrency">
          <Link href="/" className="text-muted hover:text-accent-hover">
            How Spokes work
          </Link>
        </Feature>
        <Link href={LEGAL.terms} className="text-muted hover:text-accent-hover">
          Terms
        </Link>
        <Link href={LEGAL.privacy} className="text-muted hover:text-accent-hover">
          Privacy
        </Link>
        <Link href={LEGAL.copyright} className="text-muted hover:text-accent-hover">
          Copyright
        </Link>
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-[13px] text-muted hover:text-accent-hover"
          onClick={() => openCookieSettings()}
        >
          Cookie settings
        </button>
      </nav>
    </footer>
  );
}
