"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import { SessionPicker } from "@/components/forms/SessionPicker";
import { getSessionHandle, subscribeStore } from "@/lib/data/local-store";
import {
  messagingService,
  subscribeMessages,
  type ThreadDetail,
  type ThreadListItem,
} from "@/lib/messaging";
import { buildGarageActor } from "@/lib/messaging/actor";

function formatWhen(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  if (status === "closed" || status === "withdrawn") return "Closed";
  return "Open";
}

function roleLabel(row: ThreadListItem) {
  if (row.kind === "listing") {
    return row.role === "seller" ? "Your listing" : "Your inquiry";
  }
  if (row.kind === "member") {
    return row.role === "seller" ? "Your profile" : "Direct message";
  }
  return row.role === "seller" ? "Your item" : "Your inquiry";
}

function MessagesInner() {
  const { ready, configured, user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id") || "";

  const [sessionHandle, setSessionHandle] = useState("");
  const [rows, setRows] = useState<ThreadListItem[]>([]);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSessionHandle(getSessionHandle());
    return subscribeStore(() => setSessionHandle(getSessionHandle()));
  }, []);

  const actor = ready ? buildGarageActor(user, profile, sessionHandle) : null;
  const actorId = actor?.id ?? "";
  const needsLogin = ready && configured && !user && !sessionHandle;

  const refresh = useCallback(async () => {
    const nextActor = buildGarageActor(user, profile, sessionHandle);
    if (!nextActor) {
      setRows([]);
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const list = await messagingService.listThreads(nextActor);
      setRows(list);
      if (threadId) {
        const next = await messagingService.getThread(threadId, nextActor);
        setDetail(next);
        if (!next) setError("Conversation not found.");
      } else {
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [user, profile, sessionHandle, threadId]);

  useEffect(() => {
    if (!ready || !actorId) {
      if (ready) setLoading(false);
      return;
    }
    void refresh();
  }, [ready, actorId, refresh]);

  useEffect(() => {
    return subscribeMessages(() => {
      void refresh();
    });
  }, [refresh]);

  async function onReply(event: React.FormEvent) {
    event.preventDefault();
    if (!actor || !detail) return;
    setReplyError("");
    setSending(true);
    try {
      await messagingService.reply({
        threadId: detail.thread.id,
        message: reply,
        actor,
        kind: detail.kind,
      });
      setReply("");
      await refresh();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
        Loading messages…
      </div>
    );
  }

  if (needsLogin || !actor) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          Messages
        </p>
        <h1 className="font-display mt-2 text-[44px] font-extrabold uppercase leading-[0.95] text-ink [font-stretch:75%]">
          Your conversations
        </h1>
        <p className="mt-4 text-[16px] text-muted-2">
          Log in to message garage owners and continue conversations in Cycle Found. They will
          not see your email address.
        </p>
        <Link
          href={authHref("login", "/messages")}
          className="mt-6 inline-flex h-12 items-center rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
        >
          Log in to view Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-10">
      <div className="mb-4">
        <SessionPicker />
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            Messages
          </p>
          <h1 className="font-display m-0 text-[36px] font-extrabold uppercase leading-[0.95] text-ink [font-stretch:75%] sm:text-[44px]">
            {detail ? detail.subject.title : "Inbox"}
          </h1>
          {detail ? (
            <p className="mt-2 text-[14px] text-muted-2">
              {[
                detail.kind === "member" ? "Direct message" : detail.subject.priceLabel,
                statusLabel(detail.thread.status),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : (
            <p className="mt-2 text-[15px] text-muted-2">
              Message members and garage owners. Conversations stay in Cycle Found.
            </p>
          )}
        </div>
        {detail ? (
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="h-10 rounded-[10px] border border-line bg-white px-3 text-[14px] font-semibold text-ink"
          >
            Back to inbox
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-[10px] border border-[#F1D0D0] bg-[#FDF2F2] px-3 py-2 text-[14px] text-[#9B1C1C]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-6">
        <aside className="w-full max-w-[360px] flex-[1_1_280px]">
          {loading && rows.length === 0 ? (
            <p className="text-[14px] text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-white p-5 text-[15px] text-muted-2">
              No conversations yet. Message a member or garage owner — replies show up here.
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {rows.map((row) => {
                const active = row.threadId === threadId;
                const metaBits =
                  row.kind === "member"
                    ? [roleLabel(row), statusLabel(row.status)]
                    : [roleLabel(row), statusLabel(row.status), row.otherDisplayName];
                return (
                  <li key={row.threadId}>
                    <Link
                      href={`/messages?id=${encodeURIComponent(row.threadId)}`}
                      className={`block rounded-[14px] border px-3.5 py-3 no-underline transition-colors ${
                        active
                          ? "border-accent bg-accent-soft"
                          : row.unread
                            ? "border-line bg-white"
                            : "border-line bg-white hover:bg-ground"
                      }`}
                    >
                      <p
                        className={`m-0 text-[15px] font-semibold text-ink ${
                          row.unread ? "font-bold" : ""
                        }`}
                      >
                        {row.title}
                      </p>
                      <p className="m-0 mt-0.5 text-[12px] text-muted">
                        {metaBits.filter(Boolean).join(" · ")}
                      </p>
                      <p className="m-0 mt-1 line-clamp-2 text-[13px] text-muted-2">
                        {row.lastBody || "No messages yet."}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="min-w-[280px] flex-[2_1_420px]">
          {!threadId ? (
            <div className="rounded-[14px] border border-dashed border-line bg-white p-8 text-[15px] text-muted-2">
              Select a conversation, or message a member or garage owner.
            </div>
          ) : detail ? (
            <div className="rounded-[14px] border border-line bg-white">
              <div className="border-b border-line-soft px-5 py-4">
                <p className="m-0 text-[16px] font-semibold text-ink">{detail.subject.title}</p>
                <p className="m-0 mt-1 text-[13px] text-muted">
                  {[detail.subject.meta, detail.subject.priceLabel].filter(Boolean).join(" · ")}
                </p>
                <Link
                  href={detail.subject.href}
                  className="mt-2 inline-block text-[13px] font-semibold text-accent no-underline hover:text-accent-hover"
                >
                  View {detail.kind === "member" ? "profile" : "item"}
                </Link>
                {detail.kind === "member" ? (
                  <p className="mt-3 rounded-[8px] bg-ground px-3 py-2 text-[13px] text-muted-2">
                    Private message. They will not see your email address.
                  </p>
                ) : (
                  <p className="mt-3 rounded-[8px] bg-blue-soft px-3 py-2 text-[13px] text-blue">
                    Inquiry only. Cycle Found does not process payment — arrange that directly.
                  </p>
                )}
              </div>

              <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto px-5 py-4">
                {detail.messages.map((m) => {
                  const mine = m.sender_id === detail.viewerId;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-[15px] leading-snug ${
                        mine
                          ? "ml-auto bg-accent text-white"
                          : "mr-auto bg-ground text-ink"
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`m-0 mt-1 font-mono text-[11px] ${
                          mine ? "text-white/80" : "text-muted"
                        }`}
                      >
                        {formatWhen(m.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={onReply} className="border-t border-line-soft px-5 py-4">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
                  Reply
                  <textarea
                    rows={3}
                    maxLength={2000}
                    required
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    className="rounded-[10px] border border-line px-3 py-2.5 text-[15px] font-normal outline-none focus:border-accent"
                  />
                </label>
                {replyError ? (
                  <p className="mt-2 text-[13px] text-[#9B1C1C]" role="alert">
                    {replyError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={sending}
                  className="mt-3 h-11 rounded-[10px] border-0 bg-accent px-5 text-[14px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send reply"}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-[14px] text-muted">Loading conversation…</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-muted">
          Loading messages…
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
