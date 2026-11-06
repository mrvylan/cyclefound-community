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

/** Compress a wide cover / workshop banner. */
export async function prepareCover(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
}> {
  const blob = await compressImageFile(file, { maxEdge: 1600, quality: 0.82 });
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

async function uploadProfileImage(
  userId: string,
  blob: Blob,
  filename: "avatar.jpg" | "cover.jpg",
  label: string,
): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? `${label} storage isn’t enabled yet. Your photo is saved on this device for now.`
        : error.message || `Could not upload ${label.toLowerCase()}.`,
    );
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error(`Could not get ${label.toLowerCase()} URL.`);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Upload avatar to public `avatars` bucket. Path: `{userId}/avatar.jpg`. */
export async function uploadAvatarToStorage(userId: string, blob: Blob) {
  return uploadProfileImage(userId, blob, "avatar.jpg", "Avatar");
}

/** Upload cover to public `avatars` bucket. Path: `{userId}/cover.jpg`. */
export async function uploadCoverToStorage(userId: string, blob: Blob) {
  return uploadProfileImage(userId, blob, "cover.jpg", "Cover");
}
