export type SkillSuggestInput = {
  bio?: string;
  role?: string;
  city?: string;
  garageHints?: string[];
  currentSkills?: string[];
};

export type SkillSuggestResult = {
  suggestions: string[];
  reasons?: Record<string, string>;
  configured: boolean;
};

export async function suggestSkillsFromProfile(
  input: SkillSuggestInput,
): Promise<SkillSuggestResult> {
  const res = await fetch("/api/suggest-skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    suggestions?: string[];
    reasons?: Record<string, string>;
    error?: string;
    configured?: boolean;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not suggest skills.");
  }
  return {
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    reasons: data.reasons,
    configured: data.configured !== false,
  };
}
