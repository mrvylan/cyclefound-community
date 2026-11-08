import Link from "next/link";
import { ArrowLeftRight, Bike, EyeOff, Handshake, Star, Tag } from "lucide-react";
import type { ItemStatus, Level } from "@/lib/data/seed";

export function Avatar({
  init,
  bg,
  size = 40,
  href,
  label,
  src,
}: {
  init: string;
  bg: string;
  size?: number;
  href?: string;
  label?: string;
  /** When set, shows a photo instead of initials. */
  src?: string | null;
}) {
  const el = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  ) : (
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

const STATUS_STYLE: Record<
  string,
  { cls: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }
> = {
  "For sale": { cls: "bg-status-sale text-white", Icon: Tag },
  "Open to offers": { cls: "bg-status-offers text-white", Icon: Handshake },
  "Trade only": { cls: "border border-ink bg-white text-ink", Icon: ArrowLeftRight },
  "Not for sale": { cls: "border border-line bg-white text-[#3D4249]", Icon: EyeOff },
};

/** Status is always icon + text label — never colour alone. */
export function StatusChip({ status }: { status: ItemStatus | string }) {
  const style = STATUS_STYLE[status];
  const Icon = style?.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ${
        style?.cls ?? "border border-line bg-white text-meta"
      }`}
    >
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      {status}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-md border border-line bg-ground px-2.5 py-1 font-mono text-[12px] leading-none text-[#3D4249]">
      {children}
    </span>
  );
}

const chipFocus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function chipClass(active?: boolean) {
  return `inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1 text-[13px] font-medium ${chipFocus} ${
    active ? "border-ink bg-ink text-white" : "border-[#D4D3CD] bg-white text-ink hover:border-ink"
  }`;
}

export function FilterChip({
  active,
  children,
  onClick,
  role,
  tabIndex,
  onKeyDown,
  chipRef,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  /** Use "radio" inside a radiogroup (aria-checked); default is a toggle button (aria-pressed). */
  role?: "radio";
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  chipRef?: (el: HTMLButtonElement | null) => void;
}) {
  const a11y =
    role === "radio" ? { role, "aria-checked": Boolean(active) } : { "aria-pressed": Boolean(active) };
  return (
    <button
      type="button"
      ref={chipRef}
      onClick={onClick}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      className={chipClass(active)}
      {...a11y}
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
            className={`h-9 rounded-lg px-3.5 text-[13px] font-semibold ${chipFocus} ${
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
  silhouette = false,
}: {
  label?: string;
  className?: string;
  dark?: boolean;
  /** Centered bike silhouette so empty photo slots read as "no photo yet". */
  silhouette?: boolean;
}) {
  return (
    <div className={`${dark ? "phd" : "ph"} relative flex items-end ${className}`}>
      {silhouette ? (
        <Bike
          className={`absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 stroke-[1.25] ${
            dark ? "text-white/25" : "text-[#9AA08F]"
          }`}
          aria-hidden
        />
      ) : null}
      {label ? (
        <span className="relative m-3 rounded-md bg-white px-2 py-1 font-mono text-[12px] text-ink">
          {label}
        </span>
      ) : null}
    </div>
  );
}
