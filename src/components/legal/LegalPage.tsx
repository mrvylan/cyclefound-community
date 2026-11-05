import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  effectiveDate,
  children,
}: {
  eyebrow?: string;
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[720px] px-8 py-10 pb-16">
      {eyebrow ? <p className="eyebrow mb-3 mt-0">{eyebrow}</p> : null}
      <h1 className="font-display m-0 text-[clamp(36px,5vw,56px)] leading-[1.02]">
        {title}
      </h1>
      <p className="mt-3 mb-8 font-mono text-[13px] text-muted">
        Effective date: {effectiveDate}
      </p>
      <div className="legal-prose flex flex-col gap-5 text-[15px] leading-[1.65] text-[#2A2E33]">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-display m-0 text-[22px] leading-[1.15] text-ink">{title}</h2>
      {children}
    </section>
  );
}
