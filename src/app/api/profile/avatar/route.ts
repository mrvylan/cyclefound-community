import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "avatars";

/**
 * Upload a profile avatar with the service role after verifying the session.
 * Client-side Storage uploads were falling back to data-URLs on this device only,
 * so other browsers/phones never saw the photo.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Avatar upload is not configured on the server." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to upload a profile photo." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP image." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 8 MB or smaller." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `${user.id}/avatar.jpg`;
  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ensure public avatars bucket exists (idempotent).
  await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  }).then(
    () => undefined,
    () => undefined,
  );

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "Could not upload photo." },
      { status: 500 },
    );
  }

  const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl
    ? `${publicData.publicUrl}?v=${Date.now()}`
    : "";
  if (!publicUrl) {
    return NextResponse.json({ error: "Could not resolve photo URL." }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl.split("?")[0] })
    .eq("id", user.id);
  if (profileError) {
    // Storage object is still usable; directory may lag until profiles row updates.
    return NextResponse.json({
      url: publicUrl,
      warning: profileError.message,
    });
  }

  return NextResponse.json({ url: publicUrl });
}
