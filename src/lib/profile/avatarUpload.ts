import { createClient } from "@/lib/supabase/client";
import { blobToDataUrl, compressImageFile } from "./image";

const BUCKET = "avatars";

/**
 * Compress a profile photo. Prefer Supabase Storage when signed in;
 * always returns a data URL fallback for local community patches.
 */
export async function prepareAvatar(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
}> {
  const blob = await compressImageFile(file, { maxEdge: 512, quality: 0.86 });
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

/** Upload avatar to public `avatars` bucket. Path: `{userId}/avatar.jpg`. */
export async function uploadAvatarToStorage(
  userId: string,
  blob: Blob,
): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "Avatar storage isn’t enabled yet. Your photo is saved on this device for now."
        : error.message || "Could not upload avatar.",
    );
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Could not get avatar URL.");
  return `${data.publicUrl}?v=${Date.now()}`;
}
