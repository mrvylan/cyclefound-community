"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui";
import { abbreviatedDisplayName } from "@/lib/auth/user";
import {
  getSessionHandle,
  listMembers,
  subscribeStore,
} from "@/lib/data/local-store";
import { messagingService } from "@/lib/messaging";
import { buildGarageActor } from "@/lib/messaging/actor";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewMessagePicker({ open, onClose }: Props) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sessionHandle, setSessionHandle] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ handle: string; name: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSessionHandle(getSessionHandle());
    return subscribeStore(() => {
      setSessionHandle(getSessionHandle());
      setTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected(null);
      setMessage("");
      setError("");
    }
  }, [open]);

  const members = useMemo(() => {
    void tick;
    return listMembers()
      .filter((m) => m.handle !== sessionHandle)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionHandle, tick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.handle.toLowerCase().includes(q) ||
          m.skills.some((s) => s.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [members, query]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Pick a member to message.");
      return;
    }
    const actor = buildGarageActor(user, profile, sessionHandle);
    if (!actor) {
      setError("Sign in to send a message.");
      return;
    }
    setSending(true);
    try {
      const result = await messagingService.startMemberThread({
        actor,
        message,
        handle: selected.handle,
        name: selected.name,
      });
      onClose();
      router.push(`/messages?id=${encodeURIComponent(result.threadId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-message-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-[14px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(16,23,27,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="new-message-title" className="section-title m-0 text-[24px]">
              New message
            </h2>
            <p className="m-0 mt-1 text-[13px] text-muted-2">
              Pick a member, then write your note.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-[10px] border border-line text-ink hover:bg-ground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {!selected ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
              Find a member
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, handle, or skill"
                autoFocus
                className="h-11 rounded-[10px] border border-line px-3 text-[15px] font-normal outline-none focus:border-accent"
              />
            </label>
            <ul className="m-0 max-h-[280px] list-none overflow-y-auto p-0">
              {filtered.length === 0 ? (
                <li className="px-1 py-3 text-[14px] text-muted">No members match.</li>
              ) : (
                filtered.map((m) => (
                  <li key={m.handle}>
                    <button
                      type="button"
                      onClick={() => setSelected({ handle: m.handle, name: m.name })}
                      className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-ground"
                    >
                      <Avatar
                        init={m.init}
                        bg={m.bg}
                        size={36}
                        src={m.avatarUrl}
                        label={m.name}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-ink">
                          {abbreviatedDisplayName(m.name)}
                        </span>
                        <span className="block truncate text-[12px] text-meta">
                          @{m.handle}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 rounded-[10px] border border-line bg-ground px-3 py-2.5">
              <p className="m-0 text-[14px] font-semibold text-ink">
                To {abbreviatedDisplayName(selected.name)}
              </p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[13px] font-semibold text-accent hover:text-accent-hover"
              >
                Change
              </button>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
              Message
              <textarea
                rows={4}
                minLength={20}
                maxLength={2000}
                required
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say hello or ask about their garage…"
                className="rounded-[10px] border border-line px-3 py-2.5 text-[15px] font-normal outline-none focus:border-accent"
              />
            </label>
            {error ? (
              <p className="m-0 text-[13px] text-[#9B1C1C]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={sending}
              className="h-11 rounded-[10px] border-0 bg-accent text-[14px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
