import Link from "next/link";
import { Star } from "lucide-react";
import type { ItemStatus, Level } from "@/lib/data/seed";

export function Avatar({
  init,
  bg,
  size = 40,
  href,
  label,
}: {
  init: string;
  bg: string;
  size?: number;
  href?: string;
  label?: string;
}) {
  const el = (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size > 80 ? 52 : size > 50 ? 18 : size > 34 ? 14 : 11,
      }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {init}
    </span>
  );
  return href ? (
    <Link href={href} aria-label={label ?? "Profile"} className="inline-flex">
      {el}
    </Link>
  ) : (
    el
  );
}

export function RatingStars({
  rating,
  reviews,
  compact = false,
}: {
  rating: string | number;
  reviews?: number;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <Star className="size-3.5 fill-accent-bright text-accent-bright" aria-hidden />
      <span className="font-medium">{rating}</span>
      {reviews != null && !compact && (
        <span className="text-muted">({reviews} reviews)</span>
      )}
    </span>
  );
}

export function SpokesCount({ value, suffix = "Spokes" }: { value: string | number; suffix?: string }) {
  return (
    <span className="font-mono text-[13px] font-medium">
      {value}
      {suffix ? <span className="text-muted"> {suffix}</span> : null}
    </span>
  );
}

export function LevelBadge({ level, bright = false }: { level: Level | string; bright?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 font-mono text-[12px] font-medium tracking-[0.08em] ${
        bright ? "bg-accent text-white" : "bg-ink text-white"
      }`}
    >
      {level}
    </span>
  );
}

export function ExpertiseBadge({ area }: { area: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white">
      Verified · {area}
    </span>
  );
}

export function StatusChip({ status }: { status: ItemStatus | string }) {
  const map: Record<string, string> = {
    "For sale": "bg-status-sale text-white",
    "Open to offers": "bg-status-offers text-white",
    "Trade only": "border border-ink bg-white text-ink",
    "Not for sale": "border border-line bg-white text-[#3D4249]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ${
        map[status] ?? "border border-line bg-white text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-ground px-2 py-0.5 font-mono text-[12px] text-[#3D4249]">
      {children}
    </span>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${
        active
          ? "border-ink bg-ink text-white"
          : "border-[#D4D3CD] bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 rounded-[10px] bg-[#E6E5E0] p-1"
    >
      {options.map((opt) => {
        const on = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(opt)}
            className={`h-9 rounded-lg px-3.5 text-[13px] font-semibold ${
              on ? "bg-white text-ink shadow-sm" : "bg-transparent text-muted-2"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function PersonRow({
  name,
  href,
  init,
  bg,
  subtitle,
  trailing,
}: {
  name: string;
  href: string;
  init: string;
  bg: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 text-ink no-underline hover:text-ink">
      <Avatar init={init} bg={bg} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{name}</span>
        {subtitle ? <span className="block text-[13px] text-on-dark-muted">{subtitle}</span> : null}
      </span>
      {trailing}
    </Link>
  );
}

export function PlaceholderPhoto({
  label,
  className = "",
  dark = false,
}: {
  label?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={`${dark ? "phd" : "ph"} relative flex items-end ${className}`}>
      {label ? (
        <span className="m-3 rounded-md bg-white px-2 py-1 font-mono text-[12px] text-ink">
          {label}
        </span>
      ) : null}
    </div>
  );
}
