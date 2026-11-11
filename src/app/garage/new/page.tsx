import { Suspense } from "react";
import { GarageNewShell } from "@/components/forms/garage-item/GarageNewShell";

export const metadata = { title: "Add to garage" };

export default function GarageNewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-16 text-[15px] text-muted">
          Loading…
        </div>
      }
    >
      <GarageNewShell />
    </Suspense>
  );
}
