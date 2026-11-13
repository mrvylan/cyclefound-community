"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeHandleInput } from "@/lib/community/handleRules";

type CheckResult = {
  available?: boolean;
  handle?: string;
  error?: string | null;
  suggestions?: string[];
};

type Props = {
  value: string;
  onChange: (handle: string) => void;
  /** Called when availability settles (debounced). */
  onAvailability?: (state: {
    checking: boolean;
    available: boolean;
    error: string;
    suggestions: string[];
  }) => void;
  disabled?: boolean;
};

export function HandlePicker({
  value,
  onChange,
  onAvailability,
  disabled,
}: Props) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    onAvailability?.({ checking, available, error, suggestions });
  }, [checking, available, error, suggestions, onAvailability]);

  useEffect(() => {
    const handle = normalizeHandleInput(value);
    if (!handle) {
      setChecking(false);
      setAvailable(false);
      setError("");
      setSuggestions([]);
      return;
    }

    const my = ++seq.current;
    setChecking(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/profile/handle?handle=${encodeURIComponent(handle)}`,
            { cache: "no-store" },
          );
          const data = (await res.json()) as CheckResult & { error?: string };
          if (my !== seq.current) return;
          if (!res.ok && data.error && data.available === undefined) {
            setAvailable(false);
            setError(data.error);
            setSuggestions([]);
          } else if (data.available) {
            setAvailable(true);
            setError("");
            setSuggestions([]);
          } else {
            setAvailable(false);
            setError(data.error || "That handle isn’t available.");
            setSuggestions(data.suggestions || []);
          }
        } catch {
          if (my !== seq.current) return;
          setAvailable(false);
          setError("Couldn’t check availability. Try again.");
          setSuggestions([]);
        } finally {
          if (my === seq.current) setChecking(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Public handle
        <div className="flex items-center gap-2">
          <span className="font-mono text-[15px] text-muted">@</span>
          <input
            value={value}
            disabled={disabled}
            onChange={(e) =>
              onChange(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "")
                  .slice(0, 20),
              )
            }
            autoComplete="username"
            spellCheck={false}
            maxLength={20}
            className="h-11 flex-1 rounded-[10px] border border-[#D4D3CD] px-3.5 font-mono text-[15px] font-normal outline-none focus:border-accent disabled:opacity-60"
            aria-describedby="handle-help handle-status"
          />
        </div>
      </label>
      <p id="handle-help" className="m-0 text-[13px] text-meta">
        This is how riders see you across Cycle Found. You can change it later.
      </p>
      <p className="m-0 font-mono text-[13px] text-muted-2">
        cyclefound.com/@{value || "…"}
      </p>
      <p
        id="handle-status"
        className={`m-0 text-[13px] ${
          available
            ? "text-accent-hover"
            : error
              ? "text-[#9B2C2C]"
              : "text-meta"
        }`}
        aria-live="polite"
      >
        {checking
          ? "Checking…"
          : available
            ? `✓ @${normalizeHandleInput(value)} is available`
            : error
              ? error.startsWith("Taken")
                ? `✗ ${error}`
                : `✗ ${error}`
              : null}
      </p>
      {suggestions.length ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested handles">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3 font-mono text-[13px] font-semibold text-ink hover:border-ink"
            >
              @{s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
