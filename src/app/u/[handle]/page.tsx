import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { isValidMemberHandle } from "@/lib/data/handles";

export function generateStaticParams() {
  return [] as { handle: string }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return { title: `@${handle}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const { tab } = await searchParams;

  if (!isValidMemberHandle(handle)) notFound();

  return <ProfilePageClient handle={handle} tab={tab} />;
}
