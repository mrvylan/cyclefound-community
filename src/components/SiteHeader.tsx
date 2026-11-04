"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AccountMenu } from "./auth/AccountMenu";

const nav = [
  { href: "/", label: "Community" },
  { href: "/u/lugged_marco/garage", label: "Garages" },
  { href: "/experts", label: "Experts" },
  { href: "/i/colnago-super-1984", label: "Resources" },
  { href: "/market", label: "Market" },
] as const;

function isNavActive(label: (typeof nav)[number]["label"], pathname: string) {
  switch (label) {
    case "Community":
      return pathname === "/" || pathname.startsWith("/q/");
    case "Garages":
      return pathname.includes("/garage");
    case "Experts":
      return (
        pathname.startsWith("/experts") ||
        (pathname.startsWith("/u/") && !pathname.includes("/garage"))
      );
    case "Resources":
      return pathname.startsWith("/i/");
    case "Market":
      return pathname.startsWith("/market");
    default:
      return false;
  }
}

export function SiteHeader() {
  const pathname = usePathname();
  const onAuth = pathname.startsWith("/auth");
  const nextPath = onAuth ? "/" : pathname || "/";

  return (
    <header className="border-b border-line bg-white/90 text-ink backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-7 gap-y-3.5 px-8 py-3">
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
            className="flex flex-wrap gap-x-[22px] gap-y-1.5 text-[15px] font-bold"
          >
            {nav.map((item) => {
              const on = isNavActive(item.label, pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`py-1.5 no-underline transition-colors ${
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
            className="flex h-[42px] min-w-0 flex-[1_1_240px] items-center gap-2 rounded-[10px] border border-line bg-ground px-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
            <label htmlFor="gsearch" className="sr-only">
              Search people, garages, parts and questions
            </label>
            <input
              id="gsearch"
              type="search"
              placeholder="Search people, garages, parts, questions…"
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-[#929792]"
            />
          </form>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        {!onAuth ? (
          <Link
            href="/q/seized-seatpost"
            className="inline-flex h-[42px] items-center rounded-[10px] bg-accent px-[18px] text-[14px] font-bold text-white no-underline hover:bg-accent-hover hover:text-white"
          >
            Ask the community
          </Link>
        ) : null}

        <AccountMenu nextPath={nextPath} />
      </div>
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
        <Link href="/" className="text-muted hover:text-accent-hover">
          How Spokes work
        </Link>
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
