import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { isValidMemberHandle } from "@/lib/data/handles";
import { getPerson, people } from "@/lib/data/seed";

export function generateStaticParams() {
  return people.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = getPerson(handle);
  return { title: person?.name ?? `@${handle}` };
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
