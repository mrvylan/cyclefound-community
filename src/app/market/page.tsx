import Link from "next/link";
import { PlaceholderPhoto, StatusChip } from "@/components/ui";
import { garageItems } from "@/lib/data/seed";

export const metadata = { title: "Market" };

export default function MarketPage() {
  const listings = garageItems.filter((item) => item.status !== "Not for sale");

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-8 pb-8 pt-12">
          <p className="eyebrow m-0">Buy · Sell · Trade</p>
          <h1 className="font-display m-0 text-[clamp(36px,6vw,64px)]">
            Parts and bikes from real garages
          </h1>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.55] text-muted-2">
            Listings come from member garages. Every item is tied to a person, their reputation,
            and the rest of what they own.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-8 py-8 pb-16">
        <p className="mb-5 mt-0 text-[15px] text-muted-2">
          <strong className="text-ink">{listings.length} available</strong> right now
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {listings.map((item) => (
            <Link
              key={item.id}
              href={`/i/${item.id}`}
              className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-ink no-underline hover:text-ink"
            >
              <PlaceholderPhoto label={`${item.year} · ${item.cond}`} className="h-[180px]" />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted">{item.cat}</span>
                  <StatusChip status={item.status} />
                </div>
                <span className="text-[16px] font-semibold leading-snug">{item.name}</span>
                <div className="flex justify-between gap-2 text-[13px]">
                  <span>
                    <span className="block text-[11px] text-muted">MARKET</span>
                    <span className="font-mono">{item.mkt}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[11px] text-muted">ASKING</span>
                    <span className="font-mono">{item.ask}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
