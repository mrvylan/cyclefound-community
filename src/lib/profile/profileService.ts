/**
 * Shared `profiles` table via RLS. Keep in sync with marketplace until repos merge.
 * Community public identity is `handle`; `full_name` is private.
 */
import { createClient } from "@/lib/supabase/client";

export type SellerProfile = {
  id: string;
  fullName: string;
  /** @deprecated Prefer handle — mirrored for marketplace during transition. */
  displayName: string;
  handle: string;
  handleChangedAt: string | null;
  city: string;
  state: string;
  zipCode: string;
  avatarUrl: string;
  sellerType: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function normalizeProfile(row: Record<string, unknown> | null): SellerProfile | null {
  if (!row) return null;
  const handle = String(row.handle ?? "").trim().toLowerCase();
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    displayName: String(row.display_name ?? handle),
    handle,
    handleChangedAt: (row.handle_changed_at as string | null) ?? null,
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zipCode: String(row.zip_code ?? ""),
    avatarUrl: String(row.avatar_url ?? ""),
    sellerType: String(row.seller_type ?? "individual"),
    createdAt: (row.created_at as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
  };
}

const SELECT =
  "id, full_name, display_name, handle, handle_changed_at, city, state, zip_code, avatar_url, seller_type, created_at, updated_at";

export const profileService = {
  async getMyProfile() {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select(SELECT)
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return normalizeProfile(data as Record<string, unknown> | null);
  },

  /**
   * Ensure a profile row exists for the current user.
   * Rows are created by the security-definer DB trigger (no client INSERT policy).
   */
  async ensureMyProfile() {
    const existing = await this.getMyProfile();
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      const profile = await this.getMyProfile();
      if (profile) return profile;
    }

    throw new Error(
      "Your account was created, but the profile is not ready yet. Refresh in a moment.",
    );
  },

  async updateMyProfile(updates: {
    fullName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    avatarUrl?: string | null;
    sellerType?: string;
  }) {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("You must be signed in to update your profile.");

    const payload: Record<string, string | null> = {};
    if (updates.fullName !== undefined) payload.full_name = String(updates.fullName).trim();
    if (updates.city !== undefined) payload.city = String(updates.city).trim() || null;
    if (updates.state !== undefined) payload.state = String(updates.state).trim() || null;
    if (updates.zipCode !== undefined) {
      payload.zip_code = String(updates.zipCode).trim() || null;
    }
    if (updates.avatarUrl !== undefined) {
      payload.avatar_url = String(updates.avatarUrl || "").trim() || null;
    }
    if (updates.sellerType !== undefined) {
      const sellerType = String(updates.sellerType).trim();
      if (!["individual", "business"].includes(sellerType)) {
        throw new Error("Seller type must be Individual or Business.");
      }
      payload.seller_type = sellerType;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select(SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error(
        "No profile row found for this account. Sign out and back in, or contact support if this continues.",
      );
    }
    return normalizeProfile(data as Record<string, unknown>);
  },
};
