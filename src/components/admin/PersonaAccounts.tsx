"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PersonaRow = {
  slug: string;
  email: string;
  handle: string;
  displayName: string;
  fullName: string;
  city?: string;
  state?: string;
  passwordEnvKey: string;
  enabled: boolean | null;
  passwordSet: boolean;
  password: string | null;
};

export function PersonaAccounts() {
  const [rows, setRows] = useState<PersonaRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/personas", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          personas?: PersonaRow[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Could not load personas.");
        if (!cancelled) setRows(data.personas || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load personas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signInAs(slug: string) {
    setBusySlug(slug);
    setError("");
    try {
      const res = await fetch("/api/admin/personas/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        loginUrl?: string;
        email?: string;
        error?: string;
      };
      if (!res.ok || !data.loginUrl) {
        // Fallback: password sign-in when magic link fails.
        const row = rows.find((r) => r.slug === slug);
        if (row?.email && row.password) {
          const supabase = createClient();
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email: row.email,
            password: row.password,
          });
          if (signErr) throw new Error(signErr.message || data.error);
          window.location.href = `/u/${row.handle}`;
          return;
        }
        throw new Error(data.error || "Could not sign in as persona.");
      }
      window.location.href = data.loginUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusySlug(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <p className="m-0 text-[15px] text-muted">Loading personas…</p>;
  }

  if (!rows.length) {
    return (
      <p className="m-0 text-[15px] text-muted-2">
        No persona JSON files found in <code className="font-mono">bots/personas/</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[14px] leading-snug text-muted-2">
        Passwords live in <code className="font-mono">.env.local</code> / Vercel as{" "}
        <code className="font-mono">BOT_&lt;SLUG&gt;_PASSWORD</code>. Use Sign in
        as to switch sessions without typing them.
      </p>
      {error ? (
        <p className="m-0 text-[14px] text-[#9B1C1C]" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((p) => {
          const showPw = Boolean(revealed[p.slug]);
          const loc = [p.city, p.state].filter(Boolean).join(", ");
          return (
            <li
              key={p.slug}
              className="rounded-[12px] border border-line bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-[17px] font-semibold text-ink">
                    {p.displayName || p.fullName || p.handle}
                  </p>
                  <p className="m-0 mt-0.5 font-mono text-[13px] text-muted">
                    @{p.handle}
                    {loc ? ` · ${loc}` : ""}
                    {p.enabled === false ? " · disabled" : ""}
                    {p.enabled === true ? " · enabled" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/u/${p.handle}`}
                    className="inline-flex h-10 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] font-semibold text-ink no-underline hover:bg-ground"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    disabled={busySlug === p.slug}
                    onClick={() => void signInAs(p.slug)}
                    className="inline-flex h-10 items-center rounded-[10px] bg-accent px-3 text-[13px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                  >
                    {busySlug === p.slug ? "Signing in…" : "Sign in as"}
                  </button>
                </div>
              </div>
              <dl className="m-0 mt-3 grid gap-2 text-[13px]">
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="m-0 font-semibold text-muted-2">Email</dt>
                  <dd className="m-0 font-mono text-ink">{p.email || "—"}</dd>
                  {p.email ? (
                    <button
                      type="button"
                      onClick={() => void copy(p.email)}
                      className="text-[12px] font-semibold text-accent"
                    >
                      Copy
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="m-0 font-semibold text-muted-2">Password</dt>
                  <dd className="m-0 font-mono text-ink">
                    {!p.passwordSet
                      ? `Set ${p.passwordEnvKey} in env`
                      : showPw
                        ? p.password
                        : "••••••••••••"}
                  </dd>
                  {p.passwordSet ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((prev) => ({
                            ...prev,
                            [p.slug]: !prev[p.slug],
                          }))
                        }
                        className="text-[12px] font-semibold text-accent"
                      >
                        {showPw ? "Hide" : "Reveal"}
                      </button>
                      {p.password ? (
                        <button
                          type="button"
                          onClick={() => void copy(p.password!)}
                          className="text-[12px] font-semibold text-accent"
                        >
                          Copy
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="m-0 font-semibold text-muted-2">Env key</dt>
                  <dd className="m-0 font-mono text-muted">{p.passwordEnvKey}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
