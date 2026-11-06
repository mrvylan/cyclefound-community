import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line bg-surface px-6 py-10">
      <h3 className="m-0 text-[17px] font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="m-0 max-w-[420px] text-[15px] leading-normal text-muted-2">
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white no-underline hover:bg-accent-hover hover:text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
