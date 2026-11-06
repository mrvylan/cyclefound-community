"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { SessionPicker } from "./SessionPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, TagChip } from "@/components/ui";
import { handleFromAuthProfile } from "@/lib/demo-session";
import {
  getMergedPerson,
  getSessionHandle,
  getWantedLines,
  saveProfilePatch,
  subscribeStore,
} from "@/lib/data/local-store";
import { createClient } from "@/lib/supabase/client";
import { prepareAvatar, uploadAvatarToStorage } from "@/lib/profile/avatarUpload";
import { profileService } from "@/lib/profile/profileService";
import { colorForId, initialsFromName } from "@/lib/auth/user";

const SKILL_SUGGESTIONS = [
  "Vintage restoration",
  "Wheelbuilding",
  "Frame building",
  "Electronic shifting",
  "Valuation",
  "Campagnolo",
  "Suspension",
  "Bike fit",
  "Paint & finish",
];

export function ProfileEditForm() {
  const router = useRouter();
  const { ready, user, profile, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [handle, setHandle] = useState(getSessionHandle());
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [wantedText, setWantedText] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function load(h: string) {
    const person = getMergedPerson(h);
    if (person) {
      setDisplayName(person.name);
      setCity(person.loc.split("·")[0]?.trim() ?? person.loc);
      setBio(person.bio);
      setSkills(person.skills);
      setWantedText(getWantedLines(h).join("\n"));
      setAvatarUrl(person.avatarUrl || "");
      return;
    }
    if (profile && handleFromAuthProfile(profile) === h) {
      setDisplayName(profile.displayName || profile.fullName || "");
      setAvatarUrl(profile.avatarUrl || "");
    }
  }

  useEffect(() => {
    load(getSessionHandle());
    return subscribeStore(() => {
      const h = getSessionHandle();
      setHandle(h);
      load(h);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when auth profile arrives
  }, [profile?.id, profile?.displayName, profile?.avatarUrl]);

  useEffect(() => {
    if (!ready || !user || !profile) return;
    let cancelled = false;
    void (async () => {
      try {
        const remote = await profileService.getMyProfile();
        if (cancelled || !remote) return;
        if (remote.displayName) setDisplayName((cur) => cur || remote.displayName);
        if (remote.avatarUrl) setAvatarUrl((cur) => cur || remote.avatarUrl);
        if (remote.city) setCity((cur) => cur || remote.city);
      } catch {
        // Local / demo profile still works without profiles row.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, profile]);

  function addSkill(raw: string) {
    const s = raw.trim();
    if (!s || skills.includes(s) || skills.length >= 8) return;
    setSkills([...skills, s]);
    setSkillInput("");
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setError("");
    setHint("");
    setUploading(true);
    try {
      const prepared = await prepareAvatar(file);
      let nextUrl = prepared.dataUrl;

      if (user) {
        try {
          nextUrl = await uploadAvatarToStorage(user.id, prepared.blob);
        } catch (err) {
          // Keep local data URL so the photo still works on community.
          setHint(
            err instanceof Error
              ? err.message
              : "Photo saved on this device. Cloud avatar storage isn’t available yet.",
          );
          nextUrl = prepared.dataUrl;
        }
      }

      setAvatarUrl(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that photo.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const name = displayName.trim();
    if (!name) {
      setError("Display name is required.");
      return;
    }

    setSaving(true);
    try {
      saveProfilePatch(handle, {
        name,
        loc: city.trim(),
        bio: bio.trim(),
        skills,
        wantedLines: wantedText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        avatarUrl: avatarUrl || undefined,
      });

      if (user && profile) {
        const supabase = createClient();
        const meta: Record<string, string> = {
          display_name: name,
        };
        // Prefer remote URLs in auth metadata (data URLs are too large).
        if (avatarUrl && !avatarUrl.startsWith("data:")) {
          meta.avatar_url = avatarUrl;
        }
        const { error: metaError } = await supabase.auth.updateUser({
          data: meta,
        });
        if (metaError) throw metaError;

        try {
          await profileService.updateMyProfile({
            displayName: name,
            city: city.trim() || undefined,
            avatarUrl: avatarUrl && !avatarUrl.startsWith("data:") ? avatarUrl : undefined,
          });
        } catch {
          // Auth metadata still updated; profiles row may be missing in Pre-Alpha.
        }
        await refresh();
      }

      setSaved(true);
      router.push(`/u/${handle}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] outline-none focus:border-accent";

  const previewInit = initialsFromName(displayName || profile?.displayName || "CF");
  const previewBg = user ? colorForId(user.id) : getMergedPerson(handle)?.bg || "#527D31";

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-8 py-10 pb-16">
      <div className="flex flex-col gap-2">
        <p className="eyebrow m-0">Account</p>
        <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">Edit profile</h1>
        <SessionPicker />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-5 rounded-[14px] border border-line bg-white p-5">
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

        <div className="flex flex-col gap-2">
          <label htmlFor="p-display-name" className="text-[14px] font-semibold">
            Display name
          </label>
          <input
            id="p-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            maxLength={80}
            className={field}
            required
          />
          <p className="m-0 text-[13px] text-muted">
            Shown on your profile, answers, and in the account menu.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="p-city" className="text-[14px] font-semibold">
            Location (city)
          </label>
          <input
            id="p-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Oakland, CA"
            className={field}
          />
        </div>

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

        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Expertise tags</span>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkills(skills.filter((x) => x !== s))}
                className="rounded-full border border-line bg-ground px-2.5 py-1 text-[12px]"
              >
                {s} ×
              </button>
            ))}
          </div>
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
            placeholder="Add a tag and press Enter"
            className={field}
          />
          <div className="flex flex-wrap gap-1.5">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
              <button key={s} type="button" onClick={() => addSkill(s)}>
                <TagChip>{s}</TagChip>
              </button>
            ))}
          </div>
        </div>

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
            {saving ? "Saving…" : "Save profile"}
          </button>
          <Link
            href={`/u/${handle}`}
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
