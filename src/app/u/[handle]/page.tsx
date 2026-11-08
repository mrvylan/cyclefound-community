import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { isValidMemberHandle } from "@/lib/data/handles";

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
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!isValidMemberHandle(handle)) notFound();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1280px] px-8 py-16 text-[15px] text-meta">
          Loading profile…
        </div>
      }
    >
      <ProfilePageClient handle={handle} />
    </Suspense>
  );
}
