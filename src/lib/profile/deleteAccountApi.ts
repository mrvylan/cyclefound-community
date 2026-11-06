/**
 * Duplicated from Cycle-Found-Website deleteAccountApi.
 * Calls the shared delete-account edge function / API.
 */
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

function deleteAccountEndpoints() {
  const endpoints: string[] = [];
  const explicit = String(process.env.NEXT_PUBLIC_DELETE_ACCOUNT_API_URL || "").trim();
  if (explicit) endpoints.push(explicit);

  const base = getSupabasePublicEnv().url.replace(/\/$/, "");
  if (base) {
    const edge = `${base}/functions/v1/delete-account`;
    if (!endpoints.includes(edge)) endpoints.push(edge);
  }

  if (process.env.NODE_ENV === "development") endpoints.push("/api/delete-account");
  else if (!endpoints.length) endpoints.push("/api/delete-account");

  return endpoints;
}

async function authHeaders(forEdge: boolean) {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error("Sign in to delete your account.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
  if (forEdge) {
    const key = getSupabasePublicEnv().key;
    if (key) headers.apikey = key;
  }
  return headers;
}

/** Permanently delete the signed-in account. */
export async function deleteMyAccount(input: { confirmation: string }) {
  const confirmation = String(input.confirmation || "").trim();
  const endpoints = deleteAccountEndpoints();
  let lastError: unknown = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i]!;
    try {
      const forEdge = endpoint.includes("/functions/v1/");
      const headers = await authHeaders(forEdge);
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ confirmation }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (response.status === 404 && i < endpoints.length - 1) continue;
      if (!response.ok) {
        throw new Error(
          payload.error || payload.message || `Request failed (${response.status})`,
        );
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (i < endpoints.length - 1) continue;
      throw error;
    }
  }

  throw lastError || new Error("Could not delete account.");
}
