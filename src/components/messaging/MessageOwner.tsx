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
  itemId: string;
  itemName: string;
  priceLabel?: string;
  ownerHandle: string;
  ownerName: string;
  listingId?: string | null;
  /** Extra CTAs rendered in the same button row (Ask about this, Watch, etc.). */
  children?: React.ReactNode;
};

export function MessageOwner({
  itemId,
  itemName,
  priceLabel,
  ownerHandle,
  ownerName,
  listingId,
  children,
}: Props) {
  const { ready, configured, user, profile } = useAuth();
  const router = useRouter();
  const [sessionHandle, setSessionHandle] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSessionHandle(getSessionHandle());
    return subscribeStore(() => setSessionHandle(getSessionHandle()));
  }, []);

  const actor = ready ? buildGarageActor(user, profile, sessionHandle) : null;
  const isOwner =
    Boolean(actor?.handle && actor.handle === ownerHandle) ||
    Boolean(actor?.id === ownerHandle);
  const nextPath = `/i/${itemId}`;
  const needsLogin = ready && configured && !user && !sessionHandle;
  const needsVerify = Boolean(user) && !user?.email_confirmed_at;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!actor) {
      setError("Sign in to message the owner.");
      return;
    }
    if (needsVerify) {
      setError("Verify your email before messaging members.");
      return;
    }
    setSending(true);
    try {
      const result = await messagingService.startGarageThread({
        actor,
        message,
        itemId,
        itemTitle: itemName,
        itemHref: `/i/${itemId}`,
        priceLabel,
        ownerHandle,
        ownerName,
        listingId,
      });
      setMessage("");
      router.push(`/messages?id=${encodeURIComponent(result.threadId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-[10px] border-0 bg-accent px-4 text-[15px] font-semibold text-white hover:bg-accent-hover disabled:opacity-70"
        >
          Message owner
        </button>
        {children}
      </div>

      {open ? (
        <div className="w-full rounded-[14px] border border-line bg-white p-4">
          <p className="m-0 mb-3 text-[14px] leading-snug text-muted-2">
            {!ready
              ? "Loading…"
              : isOwner
                ? "This is your item. When someone messages you, the conversation shows up in Messages."
                : needsLogin
                  ? "Log in to message the owner in Cycle Found. They will not see your email address."
                  : needsVerify
                    ? "Verify your email before messaging members."
                    : "Send a message in Cycle Found. You both continue in Messages — they will not see your email address."}
          </p>

          {needsLogin ? (
            <div className="flex flex-col gap-2.5">
              <textarea
                rows={3}
                minLength={20}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about condition, meetup area, or availability…"
                className="rounded-[10px] border border-line bg-white px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              />
              <Link
                href={authHref("join", nextPath)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
                onClick={() =>
                  saveMessageDraft({
                    handle: ownerHandle,
                    name: ownerName,
                    message,
                    kind: "garage",
                    itemId,
                  })
                }
              >
                Join to message owner
              </Link>
            </div>
          ) : null}

          {isOwner && !needsLogin ? (
            <Link
              href="/messages"
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink no-underline hover:bg-ground"
            >
              Open Messages
            </Link>
          ) : null}

          {ready && !isOwner && !needsLogin && !needsVerify ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
                Message
                <textarea
                  name="message"
                  rows={4}
                  minLength={20}
                  maxLength={2000}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about condition, meetup area, or availability…"
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
                />
              </label>
              <p className="m-0 text-[12px] leading-snug text-muted">
                Reply stays in Messages. They will not see your email address. Payment stays
                off-platform.
              </p>
              {error ? (
                <p className="m-0 text-[13px] text-[#9B1C1C]" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-11 min-w-[140px] flex-1 items-center justify-center rounded-[10px] border-0 bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError("");
                  }}
                  className="h-11 rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {needsVerify && !isOwner ? (
            <p className="m-0 text-[13px] text-muted-2">
              Check your inbox for a verification link, then return here to message{" "}
              {ownerName.split(" ")[0]}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
