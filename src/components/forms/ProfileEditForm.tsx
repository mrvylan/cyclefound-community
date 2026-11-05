"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionPicker } from "./SessionPicker";
import { TagChip } from "@/components/ui";
import {
  getMergedPerson,
  getSessionHandle,
  getWantedLines,
  saveProfilePatch,
  subscribeStore,
} from "@/lib/data/local-store";

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
  const [handle, setHandle] = useState(getSessionHandle());
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [wantedText, setWantedText] = useState("");
  const [saved, setSaved] = useState(false);

  function load(h: string) {
    const person = getMergedPerson(h);
    if (!person) return;
    setName(person.name);
    setCity(person.loc.split("·")[0]?.trim() ?? person.loc);
    setBio(person.bio);
    setSkills(person.skills);
    setWantedText(getWantedLines(h).join("\n"));
  }

  useEffect(() => {
    load(getSessionHandle());
    return subscribeStore(() => {
      const h = getSessionHandle();
      setHandle(h);
      load(h);
    });
  }, []);

  function addSkill(raw: string) {
    const s = raw.trim();
    if (!s || skills.includes(s) || skills.length >= 8) return;
    setSkills([...skills, s]);
    setSkillInput("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveProfilePatch(handle, {
      name: name.trim(),
      loc: city.trim(),
      bio: bio.trim(),
      skills,
      wantedLines: wantedText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
    setSaved(true);
    router.push(`/u/${handle}`);
  }

  const field =
    "h-12 w-full rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 text-[16px] outline-none focus:border-accent";

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-8 py-10 pb-16">
      <div className="flex flex-col gap-2">
        <p className="eyebrow m-0">Account</p>
        <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)]">Edit profile</h1>
        <SessionPicker />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="p-name" className="text-[14px] font-semibold">
            Name
          </label>
          <input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            required
          />
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

        <div className="flex flex-wrap gap-2.5">
          <button
            type="submit"
            className="inline-flex h-12 items-center rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover"
          >
            Save profile
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
