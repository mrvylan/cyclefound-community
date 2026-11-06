"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import { handleFromAuthProfile } from "@/lib/demo-session";
import {
  getGarageItemsFor,
  getSessionHandle,
  saveProfilePatch,
} from "@/lib/data/local-store";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { deleteMyAccount } from "@/lib/profile/deleteAccountApi";
import { profileService } from "@/lib/profile/profileService";
import { normalizeUsStateCode, US_STATES } from "@/lib/usStates";

const field =
  "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] text-ink outline-none focus:border-accent";
const selectField =
  "cf-select h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-3.5 text-[16px] text-ink outline-none focus:border-accent";
const labelClass = "text-[14px] font-semibold text-ink";

export function AccountPage() {
  const { ready, configured, user, profile, signOut, refresh } = useAuth();

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [sellerType, setSellerType] = useState("individual");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [garageCount, setGarageCount] = useState(0);

  const emailVerified = Boolean(user?.email_confirmed_at);
  const handle =
    profile ? handleFromAuthProfile(profile) : getSessionHandle();

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    void (async () => {
      try {
        const remote = await profileService.getMyProfile();
        if (cancelled) return;
        setFullName(remote?.fullName || profile?.fullName || "");
        setDisplayName(
          remote?.displayName || profile?.displayName || profile?.fullName?.split(/\s+/)[0] || "",
        );
        setCity(remote?.city || "");
        setStateCode(normalizeUsStateCode(remote?.state) || "");
        setZipCode(remote?.zipCode || "");
        setSellerType(remote?.sellerType || "individual");
      } catch {
        if (cancelled) return;
        setFullName(profile?.fullName || "");
        setDisplayName(profile?.displayName || "");
      }
    })();

    setGarageCount(getGarageItemsFor(handle).length);

    return () => {
      cancelled = true;
    };
  }, [ready, user, profile, handle]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBanner(null);
    const name = displayName.trim();
    const legal = fullName.trim();
    if (!legal) {
      setBanner({ type: "error", message: "Full name is required." });
      return;
    }
    if (!name) {
      setBanner({ type: "error", message: "Display name is required." });
      return;
    }

    setSaving(true);
    try {
      await profileService.ensureMyProfile().catch(() => null);
      const remote = await profileService.updateMyProfile({
        fullName: legal,
        displayName: name,
        city: city.trim(),
        state: normalizeUsStateCode(stateCode) || "",
        zipCode: zipCode.trim(),
        sellerType,
      });

      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: legal,
          display_name: name,
        },
      });
      await refresh();

      saveProfilePatch(handle, {
        name,
        loc: [remote?.city, usStateShort(remote?.state || "")].filter(Boolean).join(", "),
      });

      setBanner({ type: "success", message: "Profile saved." });
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not save profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onResendVerify() {
    if (!user?.email) return;
    setBanner(null);
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (error) throw error;
      setBanner({ type: "success", message: "Verification email sent." });
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not resend verification.",
      });
    } finally {
      setResending(false);
    }
  }

  async function onDelete() {
    if (deleteInput.trim().toUpperCase() !== "DELETE") {
      setBanner({ type: "error", message: "Type DELETE to confirm account deletion." });
      return;
    }
    setBanner(null);
    setDeleting(true);
    try {
      await deleteMyAccount({ confirmation: deleteInput.trim() });
      try {
        await signOut();
      } catch {
        // Account already gone.
      }
      window.location.assign("/?accountDeleted=1");
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not delete account.",
      });
      setDeleting(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16 text-[15px] text-muted">
        Loading account…
      </div>
    );
  }

  if (!configured || !hasSupabaseConfig()) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">Your account</h1>
        <p className="mt-4 text-[16px] text-muted-2">
          Supabase is not configured. Add credentials to use account settings.
        </p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-[560px] px-8 py-16">
        <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">
          Log in to view your account
        </h1>
        <p className="mt-4 text-[16px] text-muted-2">
          Your profile and account settings are private to your account.
        </p>
        <Link
          href={authHref("login", "/account")}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-accent text-[15px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
        >
          Log in
        </Link>
        <p className="mt-4 text-center text-[14px] text-muted">
          Need an account?{" "}
          <Link href={authHref("join", "/account")} className="font-semibold">
            Create account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-8 py-10 pb-20">
      <div>
        <p className="eyebrow m-0">Account</p>
        <h1 className="font-display m-0 mt-2 text-[clamp(36px,5vw,56px)]">Your account</h1>
        <p className="mt-3 text-[16px] text-muted-2">
          Manage your garage and the details others see. Your email stays private.
        </p>
      </div>

      {banner ? (
        <p
          role="status"
          className={`m-0 rounded-[10px] border px-3.5 py-3 text-[14px] ${
            banner.type === "success"
              ? "border-[#C5D6B5] bg-accent-soft text-accent-hover"
              : "border-[#E8C4C4] bg-[#FBF1F1] text-[#9B2C2C]"
          }`}
        >
          {banner.message}
        </p>
      ) : null}

      <section className="rounded-[14px] border border-line bg-white p-5">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
          Account email
        </p>
        <p className="m-0 mt-1 text-[17px] font-semibold text-ink">{profile.email || "—"}</p>
        <p className="m-0 mt-2 text-[13px] text-muted">
          This email stays private and isn’t shown to other members. It can’t be changed from
          this page yet.
        </p>
        {!emailVerified ? (
          <p className="mt-4 rounded-[10px] border border-[#E8D4A8] bg-[#FFF8EB] px-3.5 py-3 text-[14px] text-[#7A5A12]">
            Your email is not verified yet. Verify before publishing listings or messaging.
            <button
              type="button"
              disabled={resending}
              onClick={() => void onResendVerify()}
              className="mt-2 block text-[14px] font-semibold text-accent underline disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </p>
        ) : null}
      </section>

      <section className="rounded-[14px] border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display m-0 text-[22px]">My Garage</h2>
            <p className="mt-1 mb-0 text-[14px] text-muted-2">
              Keep track of the bikes, parts, and tools you own
              {garageCount ? ` · ${garageCount} item${garageCount === 1 ? "" : "s"}` : ""}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/u/${handle}/garage`}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
            >
              Open Garage
            </Link>
            <Link
              href="/item/new"
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink no-underline"
            >
              Add item
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display m-0 text-[22px]">Member profile</h2>
        <p className="mt-1 text-[14px] text-muted-2">
          Shared with Cycle Found marketplace. Display name is what others see — not your
          email.
        </p>
        <p className="mt-2 text-[14px]">
          <Link href="/settings/profile" className="font-semibold">
            Edit community profile
          </Link>
          <span className="text-muted"> — photo, cover, bio, and expertise tags.</span>
        </p>

        <form onSubmit={onSave} className="mt-5 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="acct-full-name" className={labelClass}>
              Full name
            </label>
            <input
              id="acct-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              className={field}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="acct-display-name" className={labelClass}>
              Public display name
            </label>
            <input
              id="acct-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
              required
              className={field}
            />
            <p className="m-0 text-[13px] text-muted">
              Shown on your profile and listings. Keep it friendly and recognizable.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="acct-city" className={labelClass}>
                City
              </label>
              <input
                id="acct-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                className={field}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="acct-state" className={labelClass}>
                State
              </label>
              <select
                id="acct-state"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                autoComplete="address-level1"
                className={selectField}
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="acct-zip" className={labelClass}>
              ZIP code
            </label>
            <input
              id="acct-zip"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              autoComplete="postal-code"
              className={field}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="acct-seller-type" className={labelClass}>
              Account type
            </label>
            <select
              id="acct-seller-type"
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value)}
              className={selectField}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section
        className="rounded-[14px] border border-[#E8C4C4] bg-[#FDF8F8] p-5"
        aria-labelledby="account-delete-title"
      >
        <h2 id="account-delete-title" className="font-display m-0 text-[22px] text-ink">
          Delete account
        </h2>
        <p className="mt-2 text-[14px] leading-snug text-muted-2">
          Permanently delete your Cycle Found account, profile, garage items, listings, and
          uploaded photos. This cannot be undone.
        </p>

        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 inline-flex h-11 items-center rounded-[10px] border border-[#C45C5C] bg-white px-4 text-[14px] font-semibold text-[#9B1C1C] hover:bg-[#FBF1F1]"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor="acct-delete-confirm" className={labelClass}>
              Type DELETE to confirm
            </label>
            <input
              id="acct-delete-confirm"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="DELETE"
              className={field}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteInput("");
                }}
                className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void onDelete()}
                className="inline-flex h-11 items-center rounded-[10px] border-0 bg-[#9B1C1C] px-4 text-[14px] font-semibold text-white hover:bg-[#7F1616] disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function usStateShort(code: string) {
  return normalizeUsStateCode(code) || code;
}
