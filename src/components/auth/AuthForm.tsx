"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { toAuthErrorMessage } from "@/lib/auth/errors";
import {
  authCallbackUrl,
  sanitizeNextPath,
  stashAuthNext,
} from "@/lib/auth/redirects";
import {
  MIN_PASSWORD_LENGTH,
  signupMetadata,
  validateEmail,
  validatePassword,
} from "@/lib/auth/user";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { useAuth } from "./AuthProvider";
import { OAuthButtons } from "./OAuthButtons";

type Mode =
  | "login"
  | "login-password"
  | "join"
  | "otp"
  | "set-password"
  | "recovery";

type OtpIntent = "login" | "join" | "recovery";

const PENDING_KEY = "cf_community_auth_pending";

type PendingAuth = {
  email: string;
  intent: OtpIntent;
  fullName?: string;
  next: string;
};

function readPending(): PendingAuth | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAuth;
  } catch {
    return null;
  }
}

function writePending(pending: PendingAuth) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

function clearPending() {
  sessionStorage.removeItem(PENDING_KEY);
}

function modeFromParam(value: string | null): Mode {
  switch (value) {
    case "join":
    case "signup":
      return "join";
    case "login-password":
    case "password":
      return "login-password";
    case "otp":
    case "verify":
      return "otp";
    case "set-password":
    case "reset-password":
      return "set-password";
    case "recovery":
    case "forgot":
    case "forgot-password":
      return "recovery";
    default:
      return "login";
  }
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-[15px] text-ink outline-none placeholder:text-[#929792] focus:border-accent";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, profile, ready } = useAuth();
  const configured = hasSupabaseConfig();

  const next = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const initialMode = modeFromParam(searchParams.get("mode"));
  const queryError = searchParams.get("error") || "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [banner, setBanner] = useState<{ type: "error" | "success"; text: string } | null>(
    queryError ? { type: "error", text: queryError } : null,
  );
  const [loading, setLoading] = useState(false);
  /** Sync lock — React `loading` state is too late to stop a double-click. */
  const sendLock = useRef(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otpIntent, setOtpIntent] = useState<OtpIntent>("login");
  const [skipPassword, setSkipPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const pending = readPending();
    if (pending?.email) {
      setEmail(pending.email);
      setOtpIntent(pending.intent);
      if (pending.fullName) setFullName(pending.fullName);
      if (initialMode === "otp" || (!searchParams.get("mode") && pending.email)) {
        // Keep otp screen if we already sent a code this session.
        if (initialMode === "otp") setMode("otp");
      }
    }
  }, [initialMode, searchParams]);

  useEffect(() => {
    if (!ready || !profile) return;
    if (mode === "set-password" || mode === "otp") return;
    const dest =
      otpIntent === "join" && (next === "/" || next.startsWith("/auth"))
        ? "/onboarding"
        : next;
    router.replace(dest);
  }, [ready, profile, mode, next, router, otpIntent]);

  function go(nextMode: Mode) {
    setBanner(null);
    setMode(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    url.searchParams.set("next", next);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  function joinRedirect() {
    return next === "/" || next.startsWith("/auth") ? "/onboarding" : next;
  }

  async function sendOtp(
    intent: OtpIntent,
    targetEmail: string,
    name?: string,
  ) {
    if (sendLock.current) return;
    sendLock.current = true;
    try {
      const cleanEmail = validateEmail(targetEmail);
      const supabase = createClient();
      const dest = intent === "join" ? joinRedirect() : next;
      stashAuthNext(dest);
      const emailRedirectTo = authCallbackUrl(window.location.origin);

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: intent === "join",
          emailRedirectTo,
          data: intent === "join" && name ? signupMetadata(name) : undefined,
        },
      });
      if (error) throw error;

      writePending({
        email: cleanEmail,
        intent,
        fullName: name,
        next: dest,
      });
      setEmail(cleanEmail);
      setOtpIntent(intent);
      setOtp("");
      go("otp");
      setBanner({
        type: "success",
        text: `We sent a 6-digit code to ${cleanEmail}. Enter it below.`,
      });
    } finally {
      sendLock.current = false;
    }
  }

  async function startOAuth(provider: "google" | "apple") {
    setBanner(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const dest = mode === "join" ? joinRedirect() : next;
      // Keep redirectTo query-free so it matches the Supabase allowlist.
      // (A ?next= URL often fails validation → Site URL = cyclefound.com.)
      stashAuthNext(dest);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: authCallbackUrl(window.location.origin),
          // Always show Google’s account picker (otherwise a prior grant
          // can skip straight to /onboarding with no visible Google UI).
          ...(provider === "google"
            ? { queryParams: { prompt: "select_account" } }
            : {}),
        },
      });
      if (error) throw error;
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
      setLoading(false);
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sendLock.current) return;
    setBanner(null);
    setLoading(true);
    try {
      if (!fullName.trim()) throw new Error("Full name is required.");
      if (!acceptedTerms) {
        throw new Error(
          "Please confirm you are 18+ and agree to the Terms and Privacy Policy.",
        );
      }
      await sendOtp("join", email, fullName.trim());
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function onLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sendLock.current) return;
    setBanner(null);
    setLoading(true);
    try {
      await sendOtp("login", email);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function onRecovery(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sendLock.current) return;
    setBanner(null);
    setLoading(true);
    try {
      await sendOtp("recovery", email);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function onLoginPassword(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      const cleanEmail = validateEmail(email);
      if (!password) throw new Error("Password is required.");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      clearPending();
      await refresh();
      router.replace(next);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      const pending = readPending();
      const cleanEmail = validateEmail(email || pending?.email || "");
      const token = otp.replace(/\s+/g, "");
      if (!/^\d{6}$/.test(token)) {
        throw new Error("Enter the 6-digit code from your email.");
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: "email",
      });
      if (error) throw error;

      const intent = pending?.intent || otpIntent;
      if (intent === "join" && pending?.fullName && data.user) {
        await supabase.auth.updateUser({
          data: signupMetadata(pending.fullName),
        });
      }

      if (intent === "join") {
        // Owner alert — never block the member on notify failure.
        void fetch("/api/notify-signup", { method: "POST" }).catch(() => {});
      }

      clearPending();
      await refresh();

      const dest =
        intent === "join"
          ? pending?.next || joinRedirect()
          : pending?.next || next;

      if (intent === "recovery" || intent === "join") {
        setSkipPassword(intent === "join");
        go("set-password");
        setBanner({
          type: "success",
          text:
            intent === "recovery"
              ? "Code verified. Choose a new password."
              : "You're in. Optionally set a password for marketplace login, or skip.",
        });
        return;
      }

      router.replace(dest);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      validatePassword(password);
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await refresh();
      router.replace(otpIntent === "join" ? joinRedirect() : next);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (loading || sendLock.current) return;
    setBanner(null);
    setLoading(true);
    try {
      await sendOtp(otpIntent, email, fullName || undefined);
    } catch (error) {
      setBanner({ type: "error", text: toAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-[14px] border border-line bg-white p-8 shadow-[0_8px_28px_rgba(16,23,27,0.06)]">
        <p className="text-[15px] text-ink">
          Supabase is not configured. Add the shared Cycle Found project keys to{" "}
          <code className="font-mono text-[13px]">.env.local</code>.
        </p>
      </div>
    );
  }

  const titles: Record<Mode, { title: string; lead: string }> = {
    login: {
      title: "Log in",
      lead: "We’ll email you a 6-digit code. No password needed.",
    },
    "login-password": {
      title: "Log in with password",
      lead: "Use the password on your Cycle Found account, if you’ve set one.",
    },
    join: {
      title: "Join Cycle Found",
      lead: "We’ll email you a 6-digit code. No password needed.",
    },
    otp: {
      title: "Enter your code",
      lead: `Check ${email || "your email"} for a 6-digit code from Cycle Found.`,
    },
    "set-password": {
      title: otpIntent === "recovery" ? "Choose a new password" : "Set a password",
      lead:
        otpIntent === "recovery"
          ? "Pick a password of at least 12 characters."
          : "Optional — handy if you prefer password login. You can always use email codes.",
    },
    recovery: {
      title: "Reset password",
      lead: "We’ll email a one-time code so you can choose a new password.",
    },
  };

  const copy = titles[mode];

  return (
    <div className="rounded-[14px] border border-line bg-white p-8 shadow-[0_8px_28px_rgba(16,23,27,0.06)]">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="section-title text-[2.35rem] text-ink sm:text-[2.75rem]">{copy.title}</h1>
      <p className="mt-3 text-[15px] text-muted-2">{copy.lead}</p>

      {banner ? (
        <div
          role="status"
          className={`mt-5 rounded-[10px] px-3.5 py-3 text-[14px] ${
            banner.type === "error"
              ? "border border-[#f1c8c4] bg-[#fff5f4] text-[#8a2e24]"
              : "border border-accent-soft-border bg-accent-soft text-accent-hover"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      {mode === "join" ? (
        <form className="mt-7 space-y-4" onSubmit={onJoin}>
          <OAuthButtons
            loading={loading}
            onGoogle={() => startOAuth("google")}
            onApple={() => startOAuth("apple")}
          />
          <Field id="fullName" label="Full name">
            <input
              id="fullName"
              className={inputClass}
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>
          <Field id="email" label="Email">
            <input
              id="email"
              type="email"
              className={inputClass}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-soft">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[var(--accent)]"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              I am 18+ and agree to the{" "}
              <Link href="/terms" className="font-semibold">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send code"}
          </button>
          <p className="text-center text-[14px] text-muted">
            Already have an account?{" "}
            <button type="button" className="font-semibold text-accent" onClick={() => go("login")}>
              Log in
            </button>
          </p>
        </form>
      ) : null}

      {mode === "login" ? (
        <form className="mt-7 space-y-4" onSubmit={onLoginOtp}>
          <OAuthButtons
            loading={loading}
            onGoogle={() => startOAuth("google")}
            onApple={() => startOAuth("apple")}
          />
          <Field id="email" label="Email">
            <input
              id="email"
              type="email"
              className={inputClass}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Email me a code"}
          </button>
          <div className="flex flex-col gap-2 text-center text-[14px] text-muted">
            <button
              type="button"
              className="font-semibold text-accent"
              onClick={() => go("login-password")}
            >
              Use password instead
            </button>
            <p>
              New here?{" "}
              <button type="button" className="font-semibold text-accent" onClick={() => go("join")}>
                Join
              </button>
            </p>
          </div>
        </form>
      ) : null}

      {mode === "login-password" ? (
        <form className="mt-7 space-y-4" onSubmit={onLoginPassword}>
          <Field id="email" label="Email">
            <input
              id="email"
              type="email"
              className={inputClass}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field id="password" label="Password">
            <PasswordInput
              id="password"
              inputClassName={inputClass}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
          <div className="flex flex-col gap-2 text-center text-[14px] text-muted">
            <button type="button" className="font-semibold text-accent" onClick={() => go("login")}>
              Use email code instead
            </button>
            <button
              type="button"
              className="font-semibold text-accent"
              onClick={() => go("recovery")}
            >
              Forgot password?
            </button>
          </div>
        </form>
      ) : null}

      {mode === "otp" ? (
        <form className="mt-7 space-y-4" onSubmit={onVerifyOtp}>
          <Field id="otp" label="6-digit code">
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`${inputClass} tracking-[0.35em]`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="••••••"
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify code"}
          </button>
          <div className="flex flex-col gap-2 text-center text-[14px] text-muted">
            <button
              type="button"
              className="font-semibold text-accent"
              disabled={loading}
              onClick={resendCode}
            >
              Resend code
            </button>
            <button type="button" className="font-semibold text-accent" onClick={() => go("login")}>
              Back
            </button>
          </div>
        </form>
      ) : null}

      {mode === "set-password" ? (
        <form className="mt-7 space-y-4" onSubmit={onSetPassword}>
          <Field id="password" label={`New password (${MIN_PASSWORD_LENGTH}+ characters)`}>
            <PasswordInput
              id="password"
              inputClassName={inputClass}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!skipPassword}
            />
          </Field>
          <Field id="confirmPassword" label="Confirm password">
            <PasswordInput
              id="confirmPassword"
              inputClassName={inputClass}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!skipPassword}
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save password"}
          </button>
          {skipPassword ? (
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-line text-[15px] font-semibold text-ink hover:bg-ground"
              onClick={() => router.replace(joinRedirect())}
            >
              Skip for now
            </button>
          ) : null}
        </form>
      ) : null}

      {mode === "recovery" ? (
        <form className="mt-7 space-y-4" onSubmit={onRecovery}>
          <Field id="email" label="Email">
            <input
              id="email"
              type="email"
              className={inputClass}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Email me a code"}
          </button>
          <p className="text-center text-[14px] text-muted">
            <button type="button" className="font-semibold text-accent" onClick={() => go("login")}>
              Back to log in
            </button>
          </p>
        </form>
      ) : null}
    </div>
  );
}
