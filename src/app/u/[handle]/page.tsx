import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { resolveHandleRedirect } from "@/lib/community/handleService";
import { isValidMemberHandle } from "@/lib/data/handles";
import { createClient } from "@supabase/supabase-js";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return {
    title: `@${handle}`,
  };
}

async function currentHandleExists(handle: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return true; // fall through to client directory
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle();
  return Boolean(data?.id);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: raw } = await params;
  const handle = String(raw || "").trim().toLowerCase();

  if (!isValidMemberHandle(handle)) notFound();

  try {
    const exists = await currentHandleExists(handle);
    if (!exists) {
      const redirect = await resolveHandleRedirect(handle);
      if (redirect?.currentHandle) {
        permanentRedirect(`/u/${redirect.currentHandle}`);
      }
    }
  } catch {
    /* client still resolves from directory / local store */
  }

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
