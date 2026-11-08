import { listMembers } from "@/lib/data/local-store";

/** Count members whose expertise tags overlap the given topics/labels. */
export function membersReachedByTopics(topics: string[]): {
  count: number;
  topTopic: string | null;
} {
  const needles = topics
    .map((t) => t.trim().toLowerCase().replace(/-/g, " "))
    .filter((t) => t.length > 1);
  if (!needles.length) return { count: 0, topTopic: null };

  let bestTopic: string | null = null;
  let bestHits = 0;
  const matched = new Set<string>();

  for (const needle of needles) {
    let hits = 0;
    for (const p of listMembers()) {
      const ok = p.skills.some((s) => {
        const skill = s.toLowerCase();
        return skill.includes(needle) || needle.includes(skill);
      });
      if (ok) {
        matched.add(p.handle);
        hits += 1;
      }
    }
    if (hits > bestHits) {
      bestHits = hits;
      bestTopic = topics[needles.indexOf(needle)] ?? needle;
    }
  }

  return { count: matched.size, topTopic: bestTopic };
}
