export type IdentifySuggestion = {
  subjectKind: "bike" | "part";
  manufacturer: string;
  model: string;
  partCategory: string;
  category: string;
  year: string;
  yearRange: string | null;
  yearConfidence: string;
  frameMaterial: string;
  condition: string;
  components: string;
  description: string;
  confidence: string;
  evidence: string;
  uncertainFields: string[];
  needsMorePhotos: boolean;
  guidance: string;
  title: string;
};

export type IdentifyResult = {
  configured: boolean;
  source?: string;
  photosUsed?: number;
  suggestion: IdentifySuggestion;
  alternatives: { manufacturer: string; model: string; reason: string }[];
  error?: string;
};

/** Call Community identify API with data-URL photos (max 4 used server-side). */
export async function identifyGarageItemFromPhotos(
  photos: string[],
): Promise<IdentifyResult> {
  const res = await fetch("/api/identify-garage-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photos: photos.slice(0, 4) }),
  });
  const payload = (await res.json().catch(() => ({}))) as IdentifyResult & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(payload.error || `Identify failed (${res.status})`);
  }
  if (!payload.suggestion) {
    throw new Error(payload.error || "No suggestion returned.");
  }
  return payload;
}
