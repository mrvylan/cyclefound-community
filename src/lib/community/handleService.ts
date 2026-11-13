import { createClient } from "@supabase/supabase-js";
import {
  HANDLE_HISTORY_RESERVE_DAYS,
  canChangeHandle,
  nextHandleChangeAllowedAt,
  suggestAvailableHandle,
  suggestHandleCandidates,
  validateHandleFormat,
} from "@/lib/community/handleRules";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Handle service is not configured (missing Supabase service role).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function isHandleTaken(
  handle: string,
  opts?: { exceptUserId?: string | null },
): Promise<boolean> {
  const parsed = validateHandleFormat(handle);
  if (!parsed.ok) return true;
  const supabase = adminClient();
  const h = parsed.handle;

  const { data: owner } = await supabase
    .from("profiles")
    .select("id")
    .ilike("handle", h)
    .maybeSingle();
  if (owner?.id && owner.id !== opts?.exceptUserId) return true;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - HANDLE_HISTORY_RESERVE_DAYS);
  const { data: hist } = await supabase
    .from("handle_history")
    .select("id, profile_id")
    .ilike("handle", h)
    .gte("vacated_at", since.toISOString())
    .limit(5);
  if (!hist?.length) return false;
  return hist.some((row) => row.profile_id !== opts?.exceptUserId);
}

export async function checkHandleAvailability(
  raw: string,
  opts?: { exceptUserId?: string | null; fullNameForSuggestions?: string },
) {
  const parsed = validateHandleFormat(raw);
  if (!parsed.ok) {
    return {
      available: false as const,
      handle: normalizeLoose(raw),
      error: parsed.error,
      suggestions: [] as string[],
    };
  }

  const taken = await isHandleTaken(parsed.handle, opts);
  if (!taken) {
    return {
      available: true as const,
      handle: parsed.handle,
      error: null as string | null,
      suggestions: [] as string[],
    };
  }

  const seed = opts?.fullNameForSuggestions || parsed.handle;
  const suggestions: string[] = [];
  for (const c of suggestHandleCandidates(seed, 12)) {
    if (c === parsed.handle) continue;
    if (!(await isHandleTaken(c, opts))) {
      suggestions.push(c);
      if (suggestions.length >= 3) break;
    }
  }

  return {
    available: false as const,
    handle: parsed.handle,
    error: `Taken: try ${suggestions.map((s) => `@${s}`).join(", ") || "another username"}`,
    suggestions,
  };
}

function normalizeLoose(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .slice(0, 20);
}

export async function suggestHandleForName(
  fullName: string,
  opts?: { exceptUserId?: string | null },
) {
  return suggestAvailableHandle(fullName, (h) => isHandleTaken(h, opts));
}

export async function getProfileHandleRow(userId: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, handle, handle_changed_at, full_name, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function claimHandle(opts: {
  userId: string;
  handle: string;
  /** First claim (onboarding) ignores 30-day cooldown. */
  initial?: boolean;
}) {
  const parsed = validateHandleFormat(opts.handle);
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error, suggestions: [] as string[] };
  }

  const supabase = adminClient();
  const row = await getProfileHandleRow(opts.userId);
  if (!row) {
    return {
      ok: false as const,
      error: "Profile not ready yet. Refresh and try again.",
      suggestions: [] as string[],
    };
  }

  const current = String(row.handle || "").trim().toLowerCase();
  if (current && current === parsed.handle) {
    return {
      ok: true as const,
      handle: parsed.handle,
      handleChangedAt: row.handle_changed_at as string | null,
    };
  }

  if (current && !opts.initial && !canChangeHandle(row.handle_changed_at as string | null)) {
    const next = nextHandleChangeAllowedAt(row.handle_changed_at as string | null);
    return {
      ok: false as const,
      error: next
        ? `You can change your username again on ${next.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}.`
        : "You can only change your username once every 30 days.",
      suggestions: [] as string[],
      nextAllowedAt: next?.toISOString() ?? null,
    };
  }

  const availability = await checkHandleAvailability(parsed.handle, {
    exceptUserId: opts.userId,
    fullNameForSuggestions: String(row.full_name || row.display_name || ""),
  });
  if (!availability.available) {
    return {
      ok: false as const,
      error: availability.error || "That username isn’t available.",
      suggestions: availability.suggestions,
    };
  }

  const now = new Date().toISOString();

  if (current) {
    const { error: histError } = await supabase.from("handle_history").insert({
      profile_id: opts.userId,
      handle: current,
      vacated_at: now,
    });
    if (histError) {
      return {
        ok: false as const,
        error: histError.message || "Could not archive the previous username.",
        suggestions: [] as string[],
      };
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      handle: parsed.handle,
      handle_changed_at: now,
      // Keep marketplace display_name in sync without exposing full_name.
      display_name: parsed.handle,
    })
    .eq("id", opts.userId)
    .select("handle, handle_changed_at")
    .maybeSingle();

  if (error) {
    // Unique index race
    if (/duplicate|unique/i.test(error.message)) {
      const again = await checkHandleAvailability(parsed.handle, {
        exceptUserId: opts.userId,
        fullNameForSuggestions: String(row.full_name || ""),
      });
      return {
        ok: false as const,
        error: again.error || "That username was just taken.",
        suggestions: again.suggestions,
      };
    }
    return {
      ok: false as const,
      error: error.message || "Could not save username.",
      suggestions: [] as string[],
    };
  }

  return {
    ok: true as const,
    handle: String(data?.handle || parsed.handle),
    handleChangedAt: (data?.handle_changed_at as string | null) || now,
  };
}

export async function resolveHandleRedirect(oldHandle: string) {
  const supabase = adminClient();
  const { data, error } = await supabase.rpc("resolve_handle_redirect", {
    old_handle: oldHandle,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.current_handle) return null;
  return {
    currentHandle: String(row.current_handle),
    profileId: String(row.profile_id),
  };
}
