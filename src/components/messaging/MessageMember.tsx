"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import {
  getMergedPerson,
  getSessionHandle,
  subscribeStore,
} from "@/lib/data/local-store";
import { messagingService, type GarageActor } from "@/lib/messaging";

type Props = {
  handle: string;
  name: string;
  variant?: "light" | "dark";
};

function buildActor(
  user: ReturnType<typeof useAuth>["user"],
  profile: ReturnType<typeof useAuth>["profile"],
  sessionHandle: string,
): GarageActor | null {
  if (user && profile) {
    return {
      id: user.id,
      name: profile.displayName,
      handle: sessionHandle || undefined,
      emailVerified: Boolean(user.email_confirmed_at),
    };
  }
  if (sessionHandle) {
    const person = getMergedPerson(sessionHandle);
    return {
      id: `handle:${sessionHandle}`,
      name: person?.name || sessionHandle,
      handle: sessionHandle,
      emailVerified: true,
    };
  }
  return null;
}

export function MessageMember({ handle, name, variant = "dark" }: Props) {
  const { ready, configured, user, profile } = useAuth();
  const router = useRouter();
  const [sessionHandle, setSessionHandleState] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSessionHandleState(getSessionHandle());
    return subscribeStore(() => setSessionHandleState(getSessionHandle()));
  }, []);

  const actor = ready ? buildActor(user, profile, sessionHandle) : null;
  const isSelf = Boolean(actor?.handle && actor.handle === handle);
  const nextPath = `/u/${handle}`;
  const needsLogin = ready && configured && !user && !sessionHandle;
  const needsVerify = Boolean(user) && !user?.email_confirmed_at;

  const btnClass =
    variant === "dark"
      ? "inline-flex h-[46px] items-center rounded-[10px] border border-[#4A4F57] bg-transparent px-[18px] font-semibold text-white hover:bg-white/5"
      : "inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 font-semibold text-ink";

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
      router.push(`/messages?id=${encodeURIComponent(result.threadId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <button type="button" disabled className={`${btnClass} opacity-70`}>
        Message
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={btnClass}>
        Message
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,340px)] rounded-[14px] border border-line bg-white p-4 text-ink shadow-[0_12px_32px_rgba(16,23,27,0.12)]">
          <p className="m-0 mb-3 text-[14px] leading-snug text-muted-2">
            {isSelf
              ? "This is your profile."
              : needsLogin
                ? "Log in to message this member in Cycle Found."
                : needsVerify
                  ? "Verify your email before messaging members."
                  : `Message ${name.split(" ")[0]}. Conversation continues in Messages.`}
          </p>
          {needsLogin ? (
            <Link
              href={authHref("login", nextPath)}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
            >
              Log in to message
            </Link>
          ) : null}
          {!isSelf && !needsLogin && !needsVerify ? (
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
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
