"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import {
  ASK_INTENT_OPTIONS,
  intentById,
  suggestIntentFromText,
  suggestTopicsFromText,
} from "@/lib/skills/feedTopics";
import { ChipRadioGroup } from "./ChipRadioGroup";
import { chipClass } from "./ui";

export function HomeAskBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [text, setText] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [removedTopics, setRemovedTopics] = useState<string[]>([]);

  const suggestions = useMemo(() => suggestTopicsFromText(text), [text]);

  // Auto-pick intent once there's enough text (only if still empty).
  useEffect(() => {
    if (intent) return;
    const guessed = suggestIntentFromText(text);
    if (guessed) setIntent(guessed);
  }, [text, intent]);

  // Auto-select new expertise suggestions; respect removals.
  useEffect(() => {
    if (text.trim().length < 20) return;
    setSelectedTopics((cur) => {
      const next = new Set(cur);
      for (const s of suggestions) {
        if (!removedTopics.includes(s)) next.add(s);
      }
      // Drop selections that are no longer suggested and weren't manually kept? Keep manual.
      return [...next];
    });
  }, [suggestions, text, removedTopics]);

  function toggleTopic(label: string) {
    setSelectedTopics((cur) => {
      if (cur.includes(label)) {
        setRemovedTopics((r) => (r.includes(label) ? r : [...r, label]));
        return cur.filter((t) => t !== label);
      }
      setRemovedTopics((r) => r.filter((t) => t !== label));
      return [...cur, label];
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (intent) params.set("intent", intent);
    if (selectedTopics.length) params.set("topics", selectedTopics.join(","));
    const title = text.trim().slice(0, 200);
    if (title) params.set("title", title);
    // Legacy ask page still reads topic/category
    const intentMeta = intentById(intent);
    if (intentMeta) params.set("topic", intentMeta.label);
    const qs = params.toString();
    router.push(qs ? `/ask?${qs}` : "/ask");
  }

  const intentMeta = intentById(intent);
  const visibleSuggestions = [
    ...selectedTopics,
    ...suggestions.filter((s) => !selectedTopics.includes(s)),
  ].slice(0, 8);

  return (
    <form
      className={`flex flex-col gap-3.5 rounded-[14px] border border-[#D4D3CD] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] ${
        compact ? "p-4" : "p-[18px]"
      }`}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">What are you trying to do?</span>
        <ChipRadioGroup
          ariaLabel="Question intent"
          options={ASK_INTENT_OPTIONS}
          value={intent}
          onChange={setIntent}
          allowEmpty
        />
      </div>

      <label htmlFor="askq" className="text-[15px] font-semibold">
        Your question
      </label>
      <textarea
        id="askq"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          intentMeta?.example ||
          "e.g. What’s stuck — pick Fix, Find, Value, or Build above for a matching example"
        }
        className="resize-none rounded-md border-0 bg-transparent text-base leading-normal text-ink outline-none placeholder:text-meta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      {visibleSuggestions.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-[12px] font-semibold text-meta">
            Expertise matches — tap to confirm or remove
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested expertise">
            {visibleSuggestions.map((label) => {
              const on = selectedTopics.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTopic(label)}
                  className={`${chipClass(on)} gap-1`}
                >
                  {label}
                  {on ? <X className="size-3 opacity-70" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : text.trim().length >= 8 ? (
        <p className="m-0 text-[12px] text-meta">
          Keep typing — we&apos;ll suggest expertise matches as we recognize them.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 max-w-[420px] text-[13px] text-meta">
          {intentMeta ? (
            <>
              {intentMeta.blurb}
              {intent === "find" ? (
                <>
                  {" "}
                  <Link
                    href="/market"
                    className="font-semibold text-accent no-underline hover:text-accent-hover"
                  >
                    Browse Market
                  </Link>
                </>
              ) : null}
            </>
          ) : (
            "Questions go to members whose garages and expertise match."
          )}
        </p>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border-0 bg-accent px-[22px] text-[15px] font-semibold text-white hover:bg-accent-hover"
        >
          Ask <ArrowRight className="size-4 stroke-[2.2]" aria-hidden />
        </button>
      </div>
    </form>
  );
}
