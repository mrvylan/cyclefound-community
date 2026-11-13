"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const ALLOW_PREFIXES = [
  "/auth",
  "/onboarding",
  "/terms",
  "/privacy",
  "/api",
];

/**
 * Signed-in users without a username must finish "Pick a username".
 */
export function RequireHandle({ children }: { children: React.ReactNode }) {
  const { ready, user, profile, handleResolved } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    if (!ready || !handleResolved || !user) return;
    if (ALLOW_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return;
    }
    if (!profile?.handle) {
      router.replace("/onboarding");
    }
  }, [ready, handleResolved, user, profile?.handle, pathname, router]);

  return <>{children}</>;
}
