import type { ReactNode } from "react";
import Link from "next/link";

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
      <h1 className="section-title m-0 text-[clamp(36px,5vw,56px)] leading-[1.02]">
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
      <h2 className="section-title m-0 text-[20px] leading-[1.15] text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="m-0">{children}</p>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-disc space-y-1.5 pl-5">{children}</ul>;
}

const linkClass =
  "font-semibold text-accent-hover underline-offset-2 hover:underline";

export function LegalLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={linkClass}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

export function LegalAddress() {
  return (
    <p className="m-0 text-[14px] text-muted">
      Fault Board Co., LLC · DBA Cycle Found
      <br />
      171 Branham Ln, Ste 10 POB 1074, San Jose, CA 95136, United States
    </p>
  );
}
