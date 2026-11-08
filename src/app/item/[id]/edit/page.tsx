import { ItemEditForm } from "@/components/forms/ItemEditForm";

export const metadata = { title: "Edit garage item" };

export default async function ItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemEditForm itemId={id} />;
}
