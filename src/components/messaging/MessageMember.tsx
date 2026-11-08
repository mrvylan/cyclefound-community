"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveMessageDraft } from "@/lib/auth/drafts";
import { authHref } from "@/lib/auth/redirects";
import { getSessionHandle, subscribeStore } from "@/lib/data/local-store";
import { messagingService } from "@/lib/messaging";
import { buildGarageActor } from "@/lib/messaging/actor";

type Props = {
  handle: string;
  name: string;
  variant?: "light" | "dark";
  /** When set, renders an accent Ask CTA with its own popover. */
  askLabel?: string;
  /** Show Ask/Message even on your own profile (e.g. visitor preview). */
  showWhenSelf?: boolean;
};

type Panel = "ask" | "message" | null;

export function MessageMember({
  handle,
  name,
  variant = "dark",
  askLabel,
  showWhenSelf = false,
}: Props) {
  const { ready, configured, user, profile } = useAuth();
  const router = useRouter();
  const [sessionHandle, setSessionHandleState] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSessionHandleState(getSessionHandle());
    return subscribeStore(() => setSessionHandleState(getSessionHandle()));
  }, []);

  const actor = ready ? buildGarageActor(user, profile, sessionHandle) : null;
  const isSelf = Boolean(actor?.handle && actor.handle === handle);
  /** True own-profile chrome; false when previewing as a visitor. */
  const selfView = isSelf && !showWhenSelf;
  const firstName = name.split(" ")[0] || name;
  const nextPath = `/u/${handle}`;
  const askHref = `/ask?to=${encodeURIComponent(handle)}`;
  const needsLogin = ready && configured && !user && !sessionHandle;
  const needsVerify = Boolean(user) && !user?.email_confirmed_at;

  const messageBtnClass =
    variant === "dark"
      ? "inline-flex h-[46px] items-center rounded-[10px] border border-[#4A4F57] bg-transparent px-[18px] font-semibold text-white hover:bg-white/5"
      : "inline-flex h-[46px] items-center rounded-[10px] border border-line bg-white px-[18px] font-semibold text-ink hover:bg-ground";

  const askBtnClass =
    "inline-flex h-[46px] items-center rounded-[10px] bg-accent px-[22px] font-semibold text-white hover:bg-accent-hover";

  function openPanel(next: "ask" | "message") {
    setError("");
    setPanel((cur) => (cur === next ? null : next));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!actor) {
      setError("Sign in to send a message.");
      return;
    }
    setSending(true);
    try {
      const result = await messagingService.startMemberThread({
        actor,
        message,
        handle,
        name,
      });
      setMessage("");
      setPanel(null);
      router.push(`/messages?id=${encodeURIComponent(result.threadId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="relative flex flex-wrap gap-2.5">
        {askLabel ? (
          <button type="button" disabled className={`${askBtnClass} opacity-70`}>
            {askLabel}
          </button>
        ) : null}
        <button type="button" disabled className={`${messageBtnClass} opacity-70`}>
          Message
        </button>
      </div>
    );
  }

  if (selfView) return null;

  return (
    <div className="relative flex flex-wrap gap-2.5">
      {askLabel ? (
        <button type="button" onClick={() => openPanel("ask")} className={askBtnClass}>
          {askLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => openPanel("message")}
        className={messageBtnClass}
      >
        Message
      </button>

      {panel === "ask" ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,340px)] rounded-[14px] border border-line bg-white p-4 text-ink shadow-[0_12px_32px_rgba(16,23,27,0.12)]">
          <p className="m-0 mb-3 text-[14px] leading-snug text-muted-2">
            {needsLogin
              ? "Log in to ask this member a question."
              : `Ask ${firstName}. Your question will be posted.`}
          </p>
          {needsLogin ? (
            <Link
              href={authHref("join", nextPath)}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
              onClick={() =>
                saveMessageDraft({
                  handle,
                  name,
                  message: "",
                  kind: "member",
                })
              }
            >
              Join to ask
            </Link>
          ) : (
            <Link
              href={askHref}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
            >
              Ask
            </Link>
          )}
        </div>
      ) : null}

      {panel === "message" ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,340px)] rounded-[14px] border border-line bg-white p-4 text-ink shadow-[0_12px_32px_rgba(16,23,27,0.12)]">
          <p className="m-0 mb-3 text-[14px] leading-snug text-muted-2">
            {needsLogin
              ? "Log in to message this member in Cycle Found."
              : needsVerify
                ? "Verify your email before messaging members."
                : `Message ${firstName}. Conversation continues in Messages.`}
          </p>
          {needsLogin ? (
            <div className="flex flex-col gap-2.5">
              <textarea
                rows={3}
                minLength={20}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say hello or ask about their garage…"
                className="rounded-[10px] border border-line px-3 py-2.5 text-[15px] font-normal outline-none focus:border-accent"
              />
              <Link
                href={authHref("join", nextPath)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                onClick={() =>
                  saveMessageDraft({
                    handle,
                    name,
                    message,
                    kind: "member",
                  })
                }
              >
                Join to message
              </Link>
            </div>
          ) : null}
          {!needsLogin && !needsVerify ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Message
                <textarea
                  rows={4}
                  minLength={20}
                  maxLength={2000}
                  required
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
                {sending ? "Sending…" : "Message"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
