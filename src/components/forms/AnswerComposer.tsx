"use client";

import { useState } from "react";
import { PhotoPicker } from "./PhotoPicker";
import { SessionPicker } from "./SessionPicker";
import { postAnswer } from "@/lib/data/local-store";

export function AnswerComposer({
  questionId,
  onPosted,
}: {
  questionId: string;
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || body.trim().length < 12) {
      setError("Write a bit more so the asker can use your answer.");
      return;
    }
    setError("");
    postAnswer({ questionId, body, photoDataUrls: photos });
    setBody("");
    setPhotos([]);
    onPosted();
  }

  return (
    <form
      id="answer"
      onSubmit={onSubmit}
      className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display m-0 text-[22px]">Your answer</h2>
        <SessionPicker />
      </div>
      <label htmlFor="answer-body" className="sr-only">
        Answer
      </label>
      <textarea
        id="answer-body"
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what worked for you — steps, caveats, and links to garage items if useful."
        className="rounded-[10px] border border-[#D4D3CD] bg-white px-3.5 py-3 text-[16px] leading-[1.55] outline-none focus:border-accent"
      />
      <PhotoPicker photos={photos} onChange={setPhotos} max={4} />
      {error ? <p className="m-0 text-[14px] font-medium text-[#9B2C2C]">{error}</p> : null}
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center self-start rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover"
      >
        Post answer
      </button>
    </form>
  );
}
