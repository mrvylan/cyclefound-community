import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const OWNER_TO =
  process.env.SIGNUP_NOTIFY_TO?.trim() || "dylan@cyclefound.com";
const FROM =
  process.env.SIGNUP_NOTIFY_FROM?.trim() || "Cycle Found <hello@cyclefound.com>";
/** How fresh a user.created_at must be to count as a signup (not a return login). */
const NEW_USER_WINDOW_MS = 30 * 60 * 1000;

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isRecentSignup(user: User): boolean {
  const created = Date.parse(user.created_at || "");
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < NEW_USER_WINDOW_MS;
}

function alreadyNotified(user: User): boolean {
  return Boolean(user.user_metadata?.owner_signup_notified_at);
}

async function markNotified(user: User) {
  const admin = adminClient();
  if (!admin) return;
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata || {}),
      owner_signup_notified_at: new Date().toISOString(),
    },
  });
}

async function sendResendEmail(opts: {
  subject: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not set — signup owner notify skipped.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [OWNER_TO],
      subject: opts.subject,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Resend ${res.status}: ${body.slice(0, 200)}`,
    };
  }
  return { ok: true };
}

/**
 * Email dylan@cyclefound.com (or SIGNUP_NOTIFY_TO) once per new auth user.
 * Safe to call fire-and-forget; skips return logins and repeat notifies.
 */
export async function notifyOwnerOfSignup(user: User): Promise<{
  sent: boolean;
  skipped?: string;
  error?: string;
}> {
  if (alreadyNotified(user)) {
    return { sent: false, skipped: "already_notified" };
  }
  if (!isRecentSignup(user)) {
    return { sent: false, skipped: "not_recent_signup" };
  }

  const email = (user.email || "").trim() || "(no email)";
  const fullName = String(
    user.user_metadata?.full_name || user.user_metadata?.name || "",
  ).trim();
  const providers = Array.isArray(user.app_metadata?.providers)
    ? (user.app_metadata.providers as string[]).join(", ")
    : String(user.app_metadata?.provider || "email");

  const subject = `New Community signup: ${email}`;
  const text = [
    "Someone just signed up for Cycle Found Community.",
    "",
    `Email: ${email}`,
    fullName ? `Name: ${fullName}` : null,
    `Auth: ${providers}`,
    `User id: ${user.id}`,
    `Created: ${user.created_at}`,
    "",
    "— Cycle Found",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendResendEmail({ subject, text });
  if (!result.ok) {
    console.warn("[notify-signup]", result.error);
    return { sent: false, error: result.error };
  }

  try {
    await markNotified(user);
  } catch (err) {
    console.warn("[notify-signup] could not mark metadata", err);
  }

  return { sent: true };
}
