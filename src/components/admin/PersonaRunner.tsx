"use client";

import { useState } from "react";

type TickResult = {
  bot: string;
  skipped?: string;
  action?: string;
  targetId?: string;
  error?: string;
};

type TickResponse = {
  ok?: boolean;
  results?: TickResult[];
  disabled?: boolean;
  forced?: boolean;
  error?: string;
};

export function PersonaRunner() {
  const [busy, setBusy] = useState(false);
  const [preferMessage, setPreferMessage] = useState(true);
  const [log, setLog] = useState<string>("");

  async function run() {
    setBusy(true);
    setLog("");
    try {
      const res = await fetch("/api/bots/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, preferMessage }),
      });
      const data = (await res.json().catch(() => ({}))) as TickResponse;
      if (!res.ok) {
        setLog(data.error || `Request failed (${res.status})`);
        return;
      }
      if (data.disabled) {
        setLog("Personas paused (BOTS_ENABLED=0).");
        return;
      }
      const lines = (data.results || []).map((r) => {
        if (r.error) return `${r.bot}: error — ${r.error}`;
        if (r.skipped) return `${r.bot}: skipped (${r.skipped})`;
        return `${r.bot}: ${r.action}${r.targetId ? ` → ${r.targetId}` : ""}`;
      });
      setLog(
        lines.length
          ? lines.join("\n")
          : "No enabled personas in bot_accounts.",
      );
    } catch (err) {
      setLog(err instanceof Error ? err.message : "Could not run personas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-start gap-2.5 text-[15px] text-ink">
        <input
          type="checkbox"
          checked={preferMessage}
          onChange={(e) => setPreferMessage(e.target.checked)}
          className="mt-1 size-4 accent-accent"
        />
        <span>
          Prefer messages this run
          <span className="mt-0.5 block text-[13px] text-muted-2">
            Biases toward persona↔persona DMs when more than one is enabled.
          </span>
        </span>
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="inline-flex h-12 items-center justify-center self-start rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? "Running…" : "Run personas now"}
      </button>
      {log ? (
        <pre className="m-0 overflow-x-auto rounded-[10px] border border-line bg-ground p-3 font-mono text-[13px] leading-relaxed text-ink whitespace-pre-wrap">
          {log}
        </pre>
      ) : null}
    </div>
  );
}
