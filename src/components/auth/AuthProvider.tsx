"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = hasSupabaseConfig();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileHandle, setProfileHandle] = useState("");
  const [handleResolved, setHandleResolved] = useState(!configured);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
    if (!next?.user) {
      setProfileHandle("");
      setHandleResolved(true);
    } else {
      setHandleResolved(false);
    }
  }, []);

  const loadHandle = useCallback(async (uid: string) => {
    try {
      const row = await profileService.getMyProfile();
      setProfileHandle(String(row?.handle || "").trim().toLowerCase());
    } catch {
      setProfileHandle("");
    } finally {
      setHandleResolved(true);
    }
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
    }),
    [ready, configured, session, user, profile, handleResolved, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
