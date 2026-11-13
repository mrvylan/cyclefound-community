"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getMergedPerson, getSessionHandle, subscribeStore } from "@/lib/data/local-store";

/** First-run banner after onboarding finishes (`/?onboarded=1`). */
export function HomeOnboardedBanner() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get("onboarded") !== "1") return;
    const sync = () => {
      const h = getSessionHandle();
      const person = h ? getMergedPerson(h) : undefined;
      setTags((person?.skills || []).slice(0, 3));
      setShow(true);
    };
    sync();
    return subscribeStore(sync);
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="mx-auto max-w-[1280px] px-8 pt-8">
      <div className="rounded-[14px] border border-accent-soft-border bg-accent-soft px-5 py-4">
        <p className="m-0 text-[15px] font-semibold text-ink">You&apos;re in</p>
        <p className="mt-1 m-0 text-[14px] text-[#3d5f24]">
          {tags.length ? (
            <>
              You picked {tags.join(", ")}. Ask the community, or{" "}
              <Link
                href="/garage/new"
                className="font-semibold underline-offset-2 hover:underline"
              >
                add your first bike to your Garage
              </Link>
              .
            </>
          ) : (
            <>
              Next up:{" "}
              <Link
                href="/garage/new"
                className="font-semibold underline-offset-2 hover:underline"
              >
                add your first bike to your Garage
              </Link>
              , or{" "}
              <Link
                href="/ask"
                className="font-semibold underline-offset-2 hover:underline"
              >
                ask the community
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}
