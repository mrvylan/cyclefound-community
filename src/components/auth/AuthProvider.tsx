"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { profileFromUser, type AuthProfile } from "@/lib/auth/user";
import { profileService } from "@/lib/profile/profileService";

type AuthContextValue = {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  /** True once we know whether profiles.handle is set. */
  handleResolved: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Optimistic update after a successful handle claim (avoids stale load races). */
  setKnownHandle: (handle: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = hasSupabaseConfig();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileHandle, setProfileHandle] = useState("");
  const [handleResolved, setHandleResolved] = useState(!configured);
  const loadSeq = useRef(0);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
    if (!next?.user) {
      loadSeq.current += 1;
      setProfileHandle("");
      setHandleResolved(true);
    } else {
      setHandleResolved(false);
    }
  }, []);

  const loadHandle = useCallback(async (uid: string) => {
    const seq = ++loadSeq.current;
    try {
      const row = await profileService.getMyProfile();
      if (seq !== loadSeq.current) return;
      setProfileHandle(String(row?.handle || "").trim().toLowerCase());
    } catch {
      if (seq !== loadSeq.current) return;
      // Keep any previously known handle on transient errors — don't wipe
      // a successful claim with a racing failed fetch.
      setProfileHandle((prev) => prev);
    } finally {
      if (seq === loadSeq.current) setHandleResolved(true);
    }
  }, []);

  const setKnownHandle = useCallback((handle: string) => {
    loadSeq.current += 1;
    setProfileHandle(String(handle || "").trim().toLowerCase());
    setHandleResolved(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!configured) {
      applySession(null);
      setReady(true);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    applySession(data.session);
    if (data.session?.user) await loadHandle(data.session.user.id);
    setReady(true);
  }, [applySession, configured, loadHandle]);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      applySession(data.session);
      setReady(true);
      if (data.session?.user) void loadHandle(data.session.user.id);
      else setHandleResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
      setReady(true);
      if (next?.user) void loadHandle(next.user.id);
      else setHandleResolved(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession, configured, loadHandle]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    applySession(null);
  }, [applySession, configured]);

  const base = profileFromUser(user);
  const profile = base
    ? { ...base, handle: profileHandle || base.handle }
    : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured,
      session,
      user,
      profile,
      handleResolved,
      signOut,
      refresh,
      setKnownHandle,
    }),
    [
      ready,
      configured,
      session,
      user,
      profile,
      handleResolved,
      signOut,
      refresh,
      setKnownHandle,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
