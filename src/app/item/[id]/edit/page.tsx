import { Suspense } from "react";
import { ItemEditForm } from "@/components/forms/ItemEditForm";

export const metadata = { title: "Edit garage item" };

export default async function ItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[920px] px-5 py-16 text-[15px] text-muted sm:px-8">
          Loading item…
        </div>
      }
    >
      <ItemEditForm itemId={id} />
    </Suspense>
  );
}
