import { Suspense } from "react";
import { ItemNewFormHost } from "@/components/forms/ItemNewFormHost";

export const metadata = { title: "Add to garage" };

export default function ItemNewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-16 text-[15px] text-muted">
          Loading…
        </div>
      }
    >
      <ItemNewFormHost />
    </Suspense>
  );
}
