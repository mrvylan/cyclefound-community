import { Suspense } from "react";
import { AskForm } from "@/components/forms/AskForm";

export const metadata = { title: "Ask the community" };

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[720px] px-8 py-16 text-[15px] text-muted">
          Loading ask form…
        </div>
      }
    >
      <AskForm />
    </Suspense>
  );
}
