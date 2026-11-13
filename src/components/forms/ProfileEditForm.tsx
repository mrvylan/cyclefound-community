"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { SessionPicker } from "./SessionPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui";
import { HandlePicker } from "@/components/forms/HandlePicker";
import { SkillsEditor } from "@/components/forms/SkillsEditor";
import { authHref } from "@/lib/auth/redirects";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { handlePublicLabel } from "@/lib/community/handleRules";
import { normalizeClaimedHandle } from "@/lib/data/handles";
import {
  clampCoverPositionY,
  getGarageItemsFor,
  getMergedPerson,
  getSessionHandle,
  getWantedLines,
  saveProfilePatch,
  subscribeStore,
} from "@/lib/data/local-store";
import { createClient } from "@/lib/supabase/client";
import {
  prepareAvatar,
  prepareCover,
  uploadAvatarToStorage,
  uploadCoverToStorage,
} from "@/lib/profile/avatarUpload";
import { profileService } from "@/lib/profile/profileService";
import { colorForId, initialsFromName } from "@/lib/auth/user";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";
import {
  formatPublicLocation,
  normalizeUsStateCode,
  parsePublicLocation,
  US_STATES,
} from "@/lib/usStates";

export function ProfileEditForm() {
  const router = useRouter();
  const { ready, user, profile, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Empty on SSR + first client paint — session handle lives in localStorage.
  const [handle, setHandle] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [nextHandleAllowedAt, setNextHandleAllowedAt] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [wantedText, setWantedText] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverDragRef = useRef<{ startY: number; startPos: number } | null>(null);

  function load(h: string) {
    if (!h) return;
    const person = getMergedPerson(h);
    if (person) {
      setEditHandle(person.publicHandle || person.handle || h);
      const parsed = parsePublicLocation(person.loc);
      setCity(parsed.city);
      setStateCode(parsed.stateCode);
      setBio(person.bio);
      setSkills(normalizeSkillLabels(person.skills));
      setWantedText(getWantedLines(h).join("\n"));
      setAvatarUrl(person.avatarUrl || "");
      setCoverUrl(person.coverUrl || "");
      setCoverPositionY(clampCoverPositionY(person.coverPositionY ?? 50));
      return;
    }
    if (profile && handleFromAuthProfile(profile) === h) {
      setEditHandle(profile.handle || h);
      setAvatarUrl(profile.avatarUrl || "");
    }
  }

  useEffect(() => {
    const fromAuth = profile ? handleFromAuthProfile(profile) : "";
    const h = getSessionHandle() || fromAuth;
    setHandle(h);
    load(h);
    return subscribeStore(() => {
      const next = getSessionHandle() || fromAuth;
      setHandle(next);
      load(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when auth profile arrives
  }, [profile?.id, profile?.handle, profile?.avatarUrl]);

  useEffect(() => {
    if (!ready) return;
    const hasSession = Boolean(user) || Boolean(getSessionHandle());
    if (!hasSession) {
      router.replace(authHref("login", "/settings/profile"));
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user || !profile) return;
    let cancelled = false;
    void (async () => {
      try {
        const remote = await profileService.getMyProfile();
        if (cancelled || !remote) return;
        if (remote.handle) {
          setHandle(remote.handle);
          setEditHandle(remote.handle);
        }
        setNextHandleAllowedAt(
          remote.handleChangedAt
            ? (() => {
                const d = new Date(remote.handleChangedAt);
                d.setUTCDate(d.getUTCDate() + 30);
                return d.toISOString();
              })()
            : null,
        );
        if (remote.avatarUrl) setAvatarUrl((cur) => cur || remote.avatarUrl);
        if (remote.city) {
          const parsed = parsePublicLocation(
            formatPublicLocation(remote.city, remote.state),
          );
          setCity((cur) => cur || parsed.city);
          setStateCode((cur) => cur || parsed.stateCode || normalizeUsStateCode(remote.state));
        } else if (remote.state) {
          setStateCode((cur) => cur || normalizeUsStateCode(remote.state));
        }
      } catch {
        // Local / demo profile still works without profiles row.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, profile]);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setError("");
    setHint("");
    setUploading(true);
    try {
      const prepared = await prepareAvatar(file);
      let nextUrl = prepared.dataUrl;

      if (user) {
        // Prefer server upload so the public directory (and other devices) get the photo.
        const body = new FormData();
        body.append(
          "file",
          new File([prepared.blob], "avatar.jpg", { type: "image/jpeg" }),
        );
        const res = await fetch("/api/profile/avatar", { method: "POST", body });
        const payload = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
          warning?: string;
        };
        if (!res.ok || !payload.url) {
          try {
            nextUrl = await uploadAvatarToStorage(user.id, prepared.blob);
          } catch (err) {
            setHint(
              payload.error ||
                (err instanceof Error
                  ? err.message
                  : "Photo saved on this device only. Other phones won’t see it until cloud upload works."),
            );
            nextUrl = prepared.dataUrl;
          }
        } else {
          nextUrl = payload.url;
          if (payload.warning) setHint(payload.warning);
        }
      }

      setAvatarUrl(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that photo.");
    } finally {
      setUploading(false);
    }
  }

  async function onPickCover(file: File | null) {
    if (!file) return;
    setError("");
    setHint("");
    setUploading(true);
    try {
      const prepared = await prepareCover(file);
      let nextUrl = prepared.dataUrl;

      if (user) {
        try {
          nextUrl = await uploadCoverToStorage(user.id, prepared.blob);
        } catch (err) {
          setHint(
            err instanceof Error
              ? err.message
              : "Cover saved on this device. Cloud storage isn’t available yet.",
          );
          nextUrl = prepared.dataUrl;
        }
      }

      setCoverUrl(nextUrl);
      setCoverPositionY(50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that cover photo.");
    } finally {
      setUploading(false);
    }
  }

  function onCoverPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!coverUrl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    coverDragRef.current = { startY: e.clientY, startPos: coverPositionY };
  }

  function onCoverPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = coverDragRef.current;
    if (!drag) return;
    const height = e.currentTarget.clientHeight || 112;
    // Drag image down → reveal top (lower Y%); drag up → reveal bottom.
    const deltaPct = ((e.clientY - drag.startY) / height) * 100;
    setCoverPositionY(clampCoverPositionY(drag.startPos - deltaPct));
  }

  function onCoverPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!coverDragRef.current) return;
    coverDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const nextClaim = normalizeClaimedHandle(editHandle);
    if (!nextClaim) {
      setError("Username is required.");
      return;
    }

    const cityOnly = city.trim();
    const st = normalizeUsStateCode(stateCode);
    const loc = formatPublicLocation(cityOnly, st);

    setSaving(true);
    try {
      let publicHandle = handle;

      if (user && nextClaim !== handle) {
        const res = await fetch("/api/profile/handle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: nextClaim, initial: false }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          handle?: string;
          error?: string;
          nextAllowedAt?: string | null;
        };
        if (!res.ok || !data.ok || !data.handle) {
          if (data.nextAllowedAt) setNextHandleAllowedAt(data.nextAllowedAt);
          throw new Error(data.error || "Could not change handle.");
        }
        publicHandle = data.handle;
        setHandle(data.handle);
        setEditHandle(data.handle);
      }

      saveProfilePatch(publicHandle, {
        name: handlePublicLabel(publicHandle),
        loc,
        bio: bio.trim(),
        skills: normalizeSkillLabels(skills),
        wantedLines: wantedText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        avatarUrl: avatarUrl || undefined,
        coverUrl: coverUrl || undefined,
        coverPositionY: coverUrl ? clampCoverPositionY(coverPositionY) : 50,
        claimedHandle: publicHandle,
      });

      if (user && profile) {
        const supabase = createClient();
        const meta: Record<string, string> = {};
        if (avatarUrl && !avatarUrl.startsWith("data:")) {
          meta.avatar_url = avatarUrl;
        }
        if (Object.keys(meta).length) {
          const { error: metaError } = await supabase.auth.updateUser({
            data: meta,
          });
          if (metaError) throw metaError;
        }

        try {
          await profileService.updateMyProfile({
            city: cityOnly || undefined,
            state: st || "",
            avatarUrl: avatarUrl && !avatarUrl.startsWith("data:") ? avatarUrl : undefined,
          });
        } catch {
          // Auth metadata still updated; profiles row may be missing in Pre-Alpha.
        }
        await refresh();
      }

      setSaved(true);
      router.push(`/u/${publicHandle}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] outline-none focus:border-accent";
  const selectField =
    "cf-select h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white pl-3.5 text-[16px] text-ink outline-none focus:border-accent";

  const previewInit = initialsFromName(editHandle || handle || "CF");
  const previewBg = user ? colorForId(user.id) : getMergedPerson(handle)?.bg || "#527D31";
  const handleCooldown =
    nextHandleAllowedAt && new Date(nextHandleAllowedAt).getTime() > Date.now()
      ? new Date(nextHandleAllowedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-8 py-10 pb-16">
      <div className="flex flex-col gap-2">
        <p className="eyebrow m-0">Public</p>
        <h1 className="section-title m-0 text-[clamp(36px,5vw,56px)]">Public profile</h1>
        <p className="m-0 text-[15px] text-muted-2">
          What members see — your @username, location, photos, bio, and expertise. Private
          account details live under{" "}
          <Link href="/account" className="font-semibold">
            Account settings
          </Link>
          .
        </p>
        <SessionPicker />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Avatar
                init={previewInit}
                bg={previewBg}
                size={96}
                src={avatarUrl || null}
                label="Profile photo"
              />
              {avatarUrl ? (
                <button
                  type="button"
                  aria-label="Remove profile photo"
                  onClick={() => {
                    setAvatarUrl("");
                    setHint("");
                  }}
                  className="absolute -right-1 -top-1 inline-flex size-8 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="m-0 text-[14px] font-semibold text-ink">Profile photo</p>
              <p className="m-0 text-[13px] text-muted">
                Shown on your profile and in the header. Square photos work best.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ground disabled:opacity-60"
                >
                  <Camera className="size-4" aria-hidden />
                  {uploading ? "Processing…" : avatarUrl ? "Change photo" : "Upload photo"}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={(e) => {
                  void onPickAvatar(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="border-t border-line-soft pt-4">
            <p className="m-0 text-[14px] font-semibold text-ink">Cover photo</p>
            <p className="mt-1 mb-3 text-[13px] text-muted">
              Wide banner at the top of your profile (workshop, garage, ride). Optional.
              {coverUrl ? " Drag the preview up or down to crop." : null}
            </p>
            <div
              className={`relative mb-3 h-28 overflow-hidden rounded-[10px] border border-line bg-ground ${
                coverUrl ? "cursor-ns-resize touch-none select-none" : ""
              }`}
              onPointerDown={onCoverPointerDown}
              onPointerMove={onCoverPointerMove}
              onPointerUp={onCoverPointerUp}
              onPointerCancel={onCoverPointerUp}
              role={coverUrl ? "img" : undefined}
              aria-label={coverUrl ? "Cover preview — drag up or down to reposition" : undefined}
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt=""
                  draggable={false}
                  className="pointer-events-none size-full object-cover"
                  style={{ objectPosition: `50% ${coverPositionY}%` }}
                />
              ) : (
                <div className="flex size-full items-end justify-start p-3">
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-ink">
                    No cover yet
                  </span>
                </div>
              )}
              {coverUrl ? (
                <button
                  type="button"
                  aria-label="Remove cover photo"
                  onClick={() => {
                    setCoverUrl("");
                    setCoverPositionY(50);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            {coverUrl ? (
              <div className="mb-3 flex flex-col gap-1.5">
                <label htmlFor="p-cover-position" className="text-[13px] font-semibold text-ink">
                  Vertical position
                </label>
                <input
                  id="p-cover-position"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={coverPositionY}
                  onChange={(e) => setCoverPositionY(clampCoverPositionY(e.target.value))}
                  className="h-11 w-full accent-accent"
                  aria-valuetext={
                    coverPositionY <= 20
                      ? "Top"
                      : coverPositionY >= 80
                        ? "Bottom"
                        : "Middle"
                  }
                />
                <p className="m-0 font-mono text-[12px] text-muted">
                  {coverPositionY <= 20
                    ? "Showing top of photo"
                    : coverPositionY >= 80
                      ? "Showing bottom of photo"
                      : "Centered"}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              disabled={uploading}
              onClick={() => coverRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ground disabled:opacity-60"
            >
              <Camera className="size-4" aria-hidden />
              {uploading ? "Processing…" : coverUrl ? "Change cover" : "Upload cover"}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              onChange={(e) => {
                void onPickCover(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <HandlePicker
            value={editHandle}
            onChange={setEditHandle}
            disabled={Boolean(handleCooldown)}
          />
          {handleCooldown ? (
            <p className="m-0 text-[13px] text-muted-2">
              You can change your username again on {handleCooldown}.
            </p>
          ) : (
            <p className="m-0 text-[13px] text-muted">
              Usernames can be changed once every 30 days. Old usernames redirect for 90
              days.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="p-city" className="text-[14px] font-semibold">
              City
            </label>
            <input
              id="p-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="San Jose"
              autoComplete="address-level2"
              className={field}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="p-state" className="text-[14px] font-semibold">
              State
            </label>
            <select
              id="p-state"
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
        <p className="-mt-2 m-0 text-[13px] text-muted">
          Shown as{" "}
          <span className="font-mono text-ink">
            {formatPublicLocation(city, stateCode) || "City, ST"}
          </span>{" "}
          on your profile. Enter city once — state is separate.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="p-bio" className="text-[14px] font-semibold">
            Short bio
          </label>
          <textarea
            id="p-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.55] outline-none focus:border-accent"
          />
        </div>

        <SkillsEditor
          value={skills}
          onChange={setSkills}
          bio={bio}
          role={handlePublicLabel(editHandle || handle)}
          city={formatPublicLocation(city, stateCode)}
          garageHints={getGarageItemsFor(handle).map((i) =>
            [i.catShort, i.name].filter(Boolean).join(" · "),
          )}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="p-wanted" className="text-[14px] font-semibold">
            Wanted list
          </label>
          <p className="m-0 text-[13px] text-muted">One part per line — plain text only.</p>
          <textarea
            id="p-wanted"
            rows={5}
            value={wantedText}
            onChange={(e) => setWantedText(e.target.value)}
            placeholder={"Cinelli 1A stem, 110 mm\nBrooks Team Pro, copper rails"}
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 font-mono text-[14px] leading-[1.55] outline-none focus:border-accent"
          />
        </div>

        {error ? (
          <p className="m-0 text-[14px] text-[#9B1C1C]" role="alert">
            {error}
          </p>
        ) : null}
        {hint ? <p className="m-0 text-[13px] text-muted-2">{hint}</p> : null}

        <div className="flex flex-wrap gap-2.5">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-12 items-center rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save public profile"}
          </button>
          <Link
            href={handle ? `/u/${handle}` : "/"}
            className="inline-flex h-12 items-center rounded-[10px] border border-line bg-white px-5 text-[15px] font-semibold text-ink no-underline"
          >
            Cancel
          </Link>
        </div>
        {saved ? <p className="m-0 text-[14px] text-accent-hover">Saved.</p> : null}
      </form>
    </div>
  );
}
