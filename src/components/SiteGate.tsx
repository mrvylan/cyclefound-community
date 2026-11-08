"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MockDataControl } from "@/components/MockDataControl";
import {
  getSiteGatePassword,
  isSiteGateEnabled,
  SITE_GATE_STORAGE_KEY,
} from "@/lib/site-gate";

/**
 * Lightweight Pre-Alpha password wall. Anyone reading page source can bypass it —
 * only keeps casual visitors out of mock/demo content.
 */
export function SiteGate({ children }: { children: React.ReactNode }) {
  const enabled = isSiteGateEnabled();
  const [ready, setReady] = useState(!enabled);
  const [unlocked, setUnlocked] = useState(!enabled);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      // Banner is permanent in Pre-Alpha — clear any prior dismiss preference.
      sessionStorage.removeItem("cf_prealpha_banner_dismissed");
    } catch {
      /* ignore */
    }
    if (!enabled) {
      setReady(true);
      setUnlocked(true);
      return;
    }
    try {
      const ok = sessionStorage.getItem(SITE_GATE_STORAGE_KEY) === "1";
      setUnlocked(ok);
    } catch {
      setUnlocked(false);
    }
    setReady(true);
  }, [enabled]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const expected = getSiteGatePassword();
    if (password.trim() === expected) {
      try {
        sessionStorage.setItem(SITE_GATE_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      setError("");
      return;
    }
    setError("That password doesn’t match. Ask for the Pre-Alpha invite code.");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground text-[15px] text-muted">
        Loading…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ground px-6 py-12">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 sm:p-8">
          <Image
            src="/community-logo.png"
            alt="Cycle Found"
            width={160}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <p className="eyebrow mb-2 mt-6 text-accent">Pre-Alpha · Demo</p>
          <h1 className="section-title m-0 text-[36px] leading-[1.02]">
            Community preview
          </h1>
          <p className="mt-3 mb-0 text-[15px] leading-[1.55] text-muted-2">
            This subdomain is in <strong className="font-semibold text-ink">Pre-Alpha</strong>.
            Names, garages, questions, and market values are{" "}
            <strong className="font-semibold text-ink">demo / mock data</strong> for
            product testing — not a live community.
          </p>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="site-gate-password" className="text-[14px] font-semibold">
              Invite password
            </label>
            <div className="relative">
              <input
                id="site-gate-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter the Pre-Alpha password"
                className="h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white py-0 pr-12 pl-3.5 text-[16px] text-ink outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-ground hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="size-4 stroke-[2]" aria-hidden />
                ) : (
                  <Eye className="size-4 stroke-[2]" aria-hidden />
                )}
              </button>
            </div>
            {error ? (
              <p role="alert" className="m-0 text-[14px] font-medium text-[#9B2C2C]">
                {error}
              </p>
            ) : (
              <p className="m-0 text-[13px] leading-[1.45] text-muted">
                Soft gate only — keeps casual visitors out while we test. Not real
                security.
              </p>
            )}
            <button
              type="submit"
              className="mt-1 inline-flex h-12 items-center justify-center rounded-[10px] bg-accent text-[15px] font-semibold text-white hover:bg-accent-hover"
            >
              Enter preview
            </button>
          </form>
          <p className="mb-0 mt-5 text-[13px] text-muted">
            After you enter, Terms, Privacy, and Community Guidelines live on this site —
            not on a separate domain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-accent-soft-border bg-accent-soft px-4 py-2.5 text-[13px] leading-[1.45] text-ink">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-8">
          <p className="m-0 min-w-0 flex-1">
            <span className="font-mono text-[12px] font-medium tracking-wide uppercase text-accent-hover">
              Pre-Alpha
            </span>
            <span className="mx-2 text-muted">·</span>
            Demo content for testing — not production community data.
          </p>
          <MockDataControl variant="banner" />
        </div>
      </div>
      {children}
    </>
  );
}
