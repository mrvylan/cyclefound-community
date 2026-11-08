import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Account",
  description: "Log in or join Cycle Found Community with a one-time email code.",
};

function JoinValuePanel() {
  return (
    <aside className="hidden w-full max-w-[360px] flex-col justify-center gap-8 lg:flex">
      <div>
        <p className="eyebrow mb-3 text-accent-hover">Ask · Share · Ride</p>
        <h2 className="section-title m-0 text-[2.5rem] leading-[1] text-ink">
          Built for bike people
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-2">
          Join the community where garage knowledge sticks — questions get answered, parts find owners.
        </p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {[
          "Ask restorers and mechanics who’ve done the work",
          "Document your garage and list parts when you’re ready",
          "Message members without sharing your email",
        ].map((line) => (
          <li
            key={line}
            className="rounded-[12px] border border-line bg-white/80 px-4 py-3.5 text-[14px] leading-snug text-ink"
          >
            {line}
          </li>
        ))}
      </ul>
      <p className="m-0 font-mono text-[12px] tracking-wide text-muted uppercase">
        Pre-Alpha
      </p>
    </aside>
  );
}

export default function AuthPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(82,125,49,0.12),_transparent_55%),linear-gradient(180deg,#f8f7f4_0%,#eef3e8_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[960px] flex-col items-stretch gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-14 sm:py-16">
        <JoinValuePanel />
        <div className="mx-auto w-full max-w-[480px] lg:mx-0">
          <Suspense
            fallback={
              <div className="h-[28rem] animate-pulse rounded-[14px] border border-line bg-white" />
            }
          >
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
