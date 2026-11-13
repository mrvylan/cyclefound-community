"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhotoPicker } from "@/components/forms/PhotoPicker";
import { HandlePicker } from "@/components/forms/HandlePicker";
import { SkillsEditor } from "@/components/forms/SkillsEditor";
import { useAuth } from "@/components/auth/AuthProvider";
import { authHref } from "@/lib/auth/redirects";
import {
  getSessionHandle,
  postItem,
  saveProfilePatch,
  setSessionHandle,
} from "@/lib/data/local-store";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Handle",
  2: "Expertise",
  3: "Garage",
  4: "Wanted",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, user, profile, refresh } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [handle, setHandle] = useState("");
  const [handleReady, setHandleReady] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [wantedText, setWantedText] = useState("");
  const [error, setError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(authHref("join", "/onboarding"));
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user || bootstrapped) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/profile/handle?suggest=1", {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          suggested?: string;
          current?: string | null;
        };
        if (cancelled) return;
        if (data.current) {
          setSessionHandle(data.current);
          setHandle(data.current);
          setHandleReady(true);
          setStep(2);
        } else if (data.suggested) {
          setHandle(data.suggested);
        }
      } catch {
        /* keep empty; user can type */
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, bootstrapped]);

  const onAvailability = useCallback(
    (state: {
      checking: boolean;
      available: boolean;
      error: string;
      suggestions: string[];
    }) => {
      setHandleReady(!state.checking && state.available);
    },
    [],
  );

  async function claimHandleAndContinue() {
    setError("");
    setClaiming(true);
    try {
      const res = await fetch("/api/profile/handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, initial: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        handle?: string;
        error?: string;
        suggestions?: string[];
      };
      if (!res.ok || !data.ok || !data.handle) {
        setError(data.error || "Could not claim that handle.");
        if (data.suggestions?.[0]) setHandle(data.suggestions[0]);
        return;
      }
      setSessionHandle(data.handle);
      setHandle(data.handle);
      await refresh();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim handle.");
    } finally {
      setClaiming(false);
    }
  }

  function sessionOrClaimed() {
    return handle || getSessionHandle() || profile?.handle || "";
  }

  function persistSkills() {
    const h = sessionOrClaimed();
    if (!h) return;
    setSessionHandle(h);
    saveProfilePatch(h, {
      skills: normalizeSkillLabels(skills),
      claimedHandle: h,
    });
  }

  function onFinishWanted() {
    const h = sessionOrClaimed();
    if (!h) return;
    const wantedLines = wantedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 8);
    saveProfilePatch(h, {
      skills: normalizeSkillLabels(skills),
      wantedLines,
      claimedHandle: h,
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
    const h = sessionOrClaimed();
    if (h) setSessionHandle(h);
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
    setStep(4);
  }

  if (!ready || !bootstrapped) {
    return (
      <div className="mx-auto max-w-[640px] px-8 py-16 text-[15px] text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-8 py-10 pb-16">
      <p className="eyebrow m-0">Welcome</p>
      <h1 className="section-title m-0 text-[clamp(36px,5vw,52px)]">
        {step === 1 ? "Choose your handle" : "Set up your profile"}
      </h1>
      <p className="mt-2 text-[15px] text-muted-2">
        {step === 1
          ? "Pick how riders will find and mention you. Expertise, garage, and wanted are optional next."
          : "You can skip the rest and finish later from Edit profile."}
      </p>

      <ol className="mt-5 flex list-none flex-wrap gap-2 p-0 font-mono text-[12px] tracking-wide uppercase">
        {([1, 2, 3, 4] as Step[]).map((n) => (
          <li
            key={n}
            className={`rounded-full px-3 py-1 ${
              step === n ? "bg-ink text-white" : "bg-ground text-muted"
            }`}
          >
            {STEP_LABELS[n]}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <section className="mt-8 flex flex-col gap-4">
          <HandlePicker
            value={handle}
            onChange={(v) => {
              setHandle(v);
              setError("");
            }}
            onAvailability={onAvailability}
            disabled={claiming}
          />
          {error ? (
            <p className="m-0 text-[14px] text-[#9B1C1C]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!handleReady || claiming}
            onClick={() => void claimHandleAndContinue()}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {claiming ? "Claiming…" : "Continue"}
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="section-title m-0 text-[28px]">What do you know?</h2>
          <p className="m-0 text-[14px] text-meta">
            Build a short expertise list — same tags Members use to find you.
          </p>
          <SkillsEditor value={skills} onChange={setSkills} compact max={5} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={skills.length === 0}
              onClick={() => {
                persistSkills();
                setStep(3);
              }}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-bold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => {
                persistSkills();
                setStep(3);
              }}
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink"
            >
              Skip for now
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
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
                setStep(4);
              }}
              className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold"
            >
              Skip garage
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
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
