/** Preserve line breaks and light bullet lists in garage item descriptions. */
export function ItemDescription({
  text,
  className = "m-0 text-[15px] leading-[1.55] text-ink",
}: {
  text: string;
  className?: string;
}) {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return null;

  // Prefer real newlines; otherwise split glued "- bullet" walls of text.
  const lines = (
    raw.includes("\n")
      ? raw.split(/\n+/)
      : raw.split(/\s+(?=[-•*]\s+)/)
  )
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletish =
    lines.length > 1 && lines.filter((l) => /^[-•*]\s+/.test(l)).length >= Math.ceil(lines.length / 2);

  if (bulletish) {
    return (
      <ul className={`${className} list-disc space-y-1.5 pl-5`}>
        {lines.map((line) => (
          <li key={line.slice(0, 48)} className="pl-0.5">
            {line.replace(/^[-•*]\s+/, "")}
          </li>
        ))}
      </ul>
    );
  }

  if (lines.length > 1) {
    return (
      <div className="flex flex-col gap-2.5">
        {lines.map((line) => (
          <p key={line.slice(0, 48)} className={className}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  return <p className={`${className} whitespace-pre-line`}>{raw}</p>;
}
