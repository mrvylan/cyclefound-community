/**
 * Pre-Alpha site search over local-store data (ILIKE-style token match).
 * Swap the data source for Postgres tsvector / websearch_to_tsquery when
 * community questions and garage items live in Supabase.
 */
import {
  getAllItems,
  getAllQuestions,
  getMergedPerson,
  listMembers,
} from "@/lib/data/local-store";
import type { GarageItem, Person, Question } from "@/lib/data/seed";

export type SearchHitKind = "member" | "question" | "item";

export type SearchHit = {
  kind: SearchHitKind;
  id: string;
  href: string;
  title: string;
  subtitle: string;
  score: number;
};

function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/** Case-insensitive substring match of every token (AND), similar to ILIKE %token%. */
function matches(haystack: string, toks: string[]): boolean {
  if (!toks.length) return false;
  const h = haystack.toLowerCase();
  return toks.every((t) => h.includes(t));
}

function scoreField(value: string, toks: string[], weight: number): number {
  const v = value.toLowerCase();
  let score = 0;
  for (const t of toks) {
    if (!t) continue;
    if (v === t) score += weight * 3;
    else if (v.startsWith(t)) score += weight * 2;
    else if (v.includes(t)) score += weight;
  }
  return score;
}

function memberBlob(p: Person) {
  return [p.name, p.handle, p.role, p.bio, p.loc, p.skills.join(" "), p.roleBadge ?? ""].join(
    " ",
  );
}

function questionBlob(q: Question) {
  return [q.title, q.excerpt, ...(q.body ?? []), q.tags.join(" "), q.asker, q.askerHandle ?? ""].join(
    " ",
  );
}

function itemBlob(item: GarageItem, owner?: Person) {
  return [
    item.name,
    item.catShort,
    item.cat,
    item.year,
    item.cond,
    item.status,
    item.ownerHandle,
    owner?.name ?? "",
  ].join(" ");
}

export function searchLocal(query: string): SearchHit[] {
  const toks = tokens(query);
  if (!toks.length) return [];

  const hits: SearchHit[] = [];

  for (const p of listMembers()) {
    if (!matches(memberBlob(p), toks)) continue;
    hits.push({
      kind: "member",
      id: p.handle,
      href: `/u/${p.handle}`,
      title: p.name,
      subtitle: [`@${p.handle}`, p.role, p.loc.split("·")[0]?.trim()]
        .filter(Boolean)
        .join(" · "),
      score:
        scoreField(p.name, toks, 5) +
        scoreField(p.handle, toks, 5) +
        scoreField(p.skills.join(" "), toks, 3) +
        scoreField(p.bio, toks, 1) +
        scoreField(p.role, toks, 2),
    });
  }

  for (const q of getAllQuestions()) {
    if (!matches(questionBlob(q), toks)) continue;
    hits.push({
      kind: "question",
      id: q.id,
      href: `/q/${q.id}`,
      title: q.title,
      subtitle: [q.tags.slice(0, 3).join(", "), q.asker, q.solved ? "Solved" : null]
        .filter(Boolean)
        .join(" · "),
      score:
        scoreField(q.title, toks, 5) +
        scoreField(q.tags.join(" "), toks, 3) +
        scoreField(q.excerpt, toks, 2) +
        scoreField((q.body ?? []).join(" "), toks, 1),
    });
  }

  for (const item of getAllItems()) {
    const owner = getMergedPerson(item.ownerHandle);
    if (!matches(itemBlob(item, owner), toks)) continue;
    hits.push({
      kind: "item",
      id: item.id,
      href: `/i/${item.id}`,
      title: item.name,
      subtitle: [item.year, item.catShort, item.status, owner?.name]
        .filter(Boolean)
        .join(" · "),
      score:
        scoreField(item.name, toks, 5) +
        scoreField(item.catShort, toks, 3) +
        scoreField(item.status, toks, 2) +
        scoreField(item.ownerHandle, toks, 2) +
        scoreField(owner?.name ?? "", toks, 2),
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function groupSearchHits(hits: SearchHit[]) {
  return {
    members: hits.filter((h) => h.kind === "member"),
    questions: hits.filter((h) => h.kind === "question"),
    items: hits.filter((h) => h.kind === "item"),
  };
}
