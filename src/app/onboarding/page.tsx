"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhotoPicker } from "@/components/forms/PhotoPicker";
import { SkillsEditor } from "@/components/forms/SkillsEditor";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import {
  getSessionHandle,
  postItem,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";
import { handleFromAuthProfile } from "@/lib/demo-session";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, user, profile } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [wantedText, setWantedText] = useState("");
  const [error, setError] = useState("");

  const handle = useMemo(() => {
    if (profile) return handleFromAuthProfile(profile);
    return getSessionHandle();
  }, [profile]);

  useEffect(() => {
    if (!ready) return;
    if (!user && !getSessionHandle()) {
      router.replace(authHref("join", "/onboarding"));
    }
  }, [ready, user, router]);

  function persistSkills() {
    if (!handle) return;
    setSessionHandle(handle);
    saveProfilePatch(handle, {
      skills: normalizeSkillLabels(skills),
      wantedLines: [],
    });
  }

  function onFinishWanted() {
    if (!handle) return;
    const wantedLines = wantedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 8);
    saveProfilePatch(handle, {
      skills: normalizeSkillLabels(skills),
      wantedLines,
    });
    router.replace("/?onboarded=1");
  }

  function onAddItem() {
    setError("");
    if (!title.trim()) {
      setError("Add a title for your first item.");
      return;
    }
    if (!photos.length) {
      setError("Add at least one photo.");
      return;
    }
    if (handle) setSessionHandle(handle);
    persistSkills();
    postItem({
      title: title.trim(),
      category: "Complete bikes",
      year: year.trim() || "—",
      condition: "Good",
      status: "Not for sale",
      askingPrice: "",
      ownerEstValue: "",
      description: "",
      notes: "",
      provenance: "",
      photoDataUrls: photos,
    });
    setStep(3);
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[640px] px-8 py-16 text-[15px] text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-8 py-10 pb-16">
      <p className="eyebrow m-0">Welcome</p>
      <h1 className="section-title m-0 text-[clamp(36px,5vw,52px)]">Set up your profile</h1>
      <p className="mt-2 text-[15px] text-muted-2">
        Three quick steps — you can skip and finish later from Edit profile.
      </p>

      <ol className="mt-5 flex list-none gap-2 p-0 font-mono text-[12px] tracking-wide uppercase">
        {([1, 2, 3] as Step[]).map((n) => (
          <li
            key={n}
            className={`rounded-full px-3 py-1 ${
              step === n ? "bg-ink text-white" : "bg-ground text-muted"
            }`}
          >
            {n === 1 ? "Expertise" : n === 2 ? "Garage" : "Wanted"}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="section-title m-0 text-[28px]">What do you know?</h2>
          <p className="m-0 text-[14px] text-meta">
            Build a short public expertise list — same tags Members use to find you.
          </p>
          <SkillsEditor
            value={skills}
            onChange={setSkills}
            compact
            max={5}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={skills.length === 0}
              onClick={() => {
                persistSkills();
                setStep(2);
              }}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink"
            >
              Skip for now
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="section-title m-0 text-[28px]">Add something to your garage</h2>
          <p className="m-0 text-[14px] text-meta">
            One bike or part is enough — photos help the community know what you ride.
          </p>
          <PhotoPicker photos={photos} onChange={setPhotos} max={4} />
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1984 Colnago Super"
              className="h-11 rounded-[10px] border border-[#D4D3CD] px-3.5 text-[15px] font-normal outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Year (optional)
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1984"
              className="h-11 rounded-[10px] border border-[#D4D3CD] px-3.5 text-[15px] font-normal outline-none focus:border-accent"
            />
          </label>
          {error ? (
            <p className="m-0 text-[14px] text-[#9B1C1C]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white hover:bg-accent-hover"
            >
              Save & continue
            </button>
            <button
              type="button"
              onClick={() => {
                persistSkills();
                setStep(3);
              }}
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold"
            >
              Skip garage
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="section-title m-0 text-[28px]">Anything you&apos;re looking for?</h2>
          <p className="m-0 text-[14px] text-meta">Optional — one part per line.</p>
          <textarea
            rows={5}
            value={wantedText}
            onChange={(e) => setWantedText(e.target.value)}
            placeholder={"Cinelli 1A stem, 110 mm\nBrooks Team Pro, copper rails"}
            className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 font-mono text-[14px] leading-[1.55] outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onFinishWanted}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white hover:bg-accent-hover"
            >
              Finish
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink no-underline"
            >
              Skip
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
