"use client";

import {
  answers as seedAnswers,
  DEFAULT_SEED_HANDLES,
  getItemsByOwner as seedItemsByOwner,
  getPerson,
  isDefaultSeedHandle,
  items as seedItems,
  people,
  questions as seedQuestions,
  type Answer,
  type GarageItem,
  type ItemStatus,
  type Person,
  type Question,
  wanted as seedWanted,
} from "./seed";
import { isValidMemberHandle } from "./handles";

export { isValidMemberHandle } from "./handles";
export {
  DEFAULT_SEED_HANDLES,
  isDefaultSeedHandle,
  PARTNER_SEED_HANDLE,
  SOLO_SEED_HANDLE,
} from "./seed";

/** Dylan + mock partner are available in the default signed-in view. */
function defaultSeedVisible(handle?: string | null) {
  return isDefaultSeedHandle(handle);
}

const STORAGE_KEY = "cf_beta_v1";

export type LocalProfilePatch = {
  name?: string;
  loc?: string;
  bio?: string;
  skills?: string[];
  wantedLines?: string[];
  /** Profile photo — data URL or remote URL. */
  avatarUrl?: string;
  /** Cover / workshop banner — data URL or remote URL. */
  coverUrl?: string;
};

function initialsFromDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return `${parts[0]![0]!}${parts[0]![0]!}`.toUpperCase();
  }
  return "CF";
}

type LocalStore = {
  sessionHandle: string;
  /** When true, seed/mock community data is visible for UI demos. Off by default. */
  mockDataEnabled: boolean;
  extraQuestions: Question[];
  extraAnswers: Answer[];
  extraItems: GarageItem[];
  profilePatches: Record<string, LocalProfilePatch>;
  /** Overrides accepted answer id per question */
  acceptedByQuestion: Record<string, string | null>;
};

const defaultStore = (): LocalStore => ({
  sessionHandle: "",
  mockDataEnabled: false,
  extraQuestions: [],
  extraAnswers: [],
  extraItems: [],
  profilePatches: {},
  acceptedByQuestion: {},
});

function readStore(): LocalStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return { ...defaultStore(), ...JSON.parse(raw) } as LocalStore;
  } catch {
    return defaultStore();
  }
}

function writeStore(store: LocalStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("cf-store"));
}

export function subscribeStore(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("cf-store", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("cf-store", handler);
  };
}

export function getSessionHandle(): string {
  return readStore().sessionHandle;
}

export function setSessionHandle(handle: string) {
  const store = readStore();
  store.sessionHandle = handle;
  writeStore(store);
}

export function isMockDataEnabled(): boolean {
  return Boolean(readStore().mockDataEnabled);
}

/** Reveal seed/mock members, questions, and garage items for UI demos. */
export function insertMockData() {
  const store = readStore();
  store.mockDataEnabled = true;
  if (!store.sessionHandle) store.sessionHandle = "ben_carver";
  writeStore(store);
}

/** Hide seed/mock data again; keeps the signed-in user’s own posts and items. */
export function clearMockData() {
  const store = readStore();
  store.mockDataEnabled = false;
  // Drop full-cast demo actors; keep default-seed handles (Dylan + messaging partner).
  const demoHandles = new Set(
    people.map((p) => p.handle).filter((h) => !isDefaultSeedHandle(h)),
  );
  if (store.sessionHandle && demoHandles.has(store.sessionHandle)) {
    store.sessionHandle = "";
  }
  writeStore(store);
}

function seedPerson(handle: string): Person | undefined {
  if (!isMockDataEnabled() && !defaultSeedVisible(handle)) return undefined;
  return getPerson(handle);
}

function stubPersonFromHandle(handle: string, patch?: LocalProfilePatch): Person {
  const name = patch?.name?.trim() || handle;
  return {
    handle,
    name,
    init: initialsFromDisplayName(name),
    bg: "#527D31",
    role: "Member",
    loc: patch?.loc ?? "",
    level: "RIDER",
    skills: patch?.skills ?? [],
    bio: patch?.bio ?? "",
    rating: "New",
    reviews: 0,
    spokes: "0",
    spokesNum: 0,
    accepted: 0,
    items: 0,
    reply: "—",
    consult: "",
    verified: false,
    memberSince: "2026",
    roleBadge: "Member",
    avatarUrl: patch?.avatarUrl || undefined,
    coverUrl: patch?.coverUrl || undefined,
  };
}

export function getMergedPerson(handle: string): Person | undefined {
  if (!handle) return undefined;
  const base = seedPerson(handle);
  const patch = readStore().profilePatches[handle];
  if (!base) {
    if (!patch?.name) return undefined;
    // Auth / demo actor with no seed row — enough for post attribution.
    return stubPersonFromHandle(handle, patch);
  }
  if (!patch) return base;
  const name = patch.name ?? base.name;
  return {
    ...base,
    name,
    init: patch.name ? initialsFromDisplayName(name) : base.init,
    loc: patch.loc ?? base.loc,
    bio: patch.bio ?? base.bio,
    skills: patch.skills ?? base.skills,
    avatarUrl: patch.avatarUrl ?? base.avatarUrl,
    coverUrl: patch.coverUrl ?? base.coverUrl,
  };
}

/**
 * Resolve a profile for /u/[handle] — seed (when mock on), local patch, or a stub
 * for the signed-in member’s own handle.
 */
export function resolvePerson(handle: string): Person | undefined {
  const key = String(handle || "").trim();
  if (!isValidMemberHandle(key)) return undefined;
  const merged = getMergedPerson(key);
  if (merged) return merged;
  if (isMockDataEnabled() && getPerson(key)) return getPerson(key);
  // Own account stub even before a name patch exists.
  if (key === getSessionHandle()) {
    return stubPersonFromHandle(key, readStore().profilePatches[key]);
  }
  return undefined;
}

export function getWantedLines(handle: string): string[] {
  const patch = readStore().profilePatches[handle];
  if (patch?.wantedLines) return patch.wantedLines;
  if (!isMockDataEnabled() && !defaultSeedVisible(handle)) return [];
  return seedWanted.filter((w) => w.ownerHandle === handle).map((w) => w.part);
}

export function saveProfilePatch(handle: string, patch: LocalProfilePatch) {
  const store = readStore();
  store.profilePatches[handle] = {
    ...store.profilePatches[handle],
    ...patch,
  };
  writeStore(store);
}

export function getAllQuestions(): Question[] {
  const store = readStore();
  const seeded = isMockDataEnabled()
    ? seedQuestions
    : seedQuestions.filter((q) => defaultSeedVisible(q.askerHandle));
  let all = [...seeded, ...store.extraQuestions];
  if (!isMockDataEnabled()) {
    const me = store.sessionHandle;
    if (!me) return [];
    all = all.filter(
      (q) => q.askerHandle === me || defaultSeedVisible(q.askerHandle),
    );
  }
  return all.map((q) => {
    const thread = getAllAnswers(q.id);
    const accepted = thread.find((a) => a.accepted);
    return {
      ...q,
      answers: thread.length,
      solved: Boolean(accepted),
      expert: accepted?.name ?? "",
    };
  });
}

export function getQuestionLocal(id: string): Question | undefined {
  return getAllQuestions().find((q) => q.id === id);
}

export function getAllAnswers(questionId: string): Answer[] {
  const store = readStore();
  const allowSeed =
    isMockDataEnabled() ||
    seedQuestions.some(
      (q) => q.id === questionId && defaultSeedVisible(q.askerHandle),
    );
  const seeded = allowSeed
    ? seedAnswers.filter((a) => a.questionId === questionId)
    : [];
  const merged = [
    ...seeded,
    ...store.extraAnswers.filter((a) => a.questionId === questionId),
  ];
  const acceptedId = store.acceptedByQuestion[questionId];
  return merged
    .map((a) => {
      if (acceptedId === undefined) return a;
      return { ...a, accepted: a.id === acceptedId };
    })
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      return b.votes - a.votes;
    });
}

export function getGarageItemsFor(handle: string): GarageItem[] {
  const store = readStore();
  const seeded =
    isMockDataEnabled() || defaultSeedVisible(handle)
      ? seedItemsByOwner(handle)
      : [];
  return [...seeded, ...store.extraItems.filter((i) => i.ownerHandle === handle)];
}

export function getAllItems(): GarageItem[] {
  const store = readStore();
  const seeded = isMockDataEnabled()
    ? seedItems
    : seedItems.filter((i) => defaultSeedVisible(i.ownerHandle));
  let all = [...seeded, ...store.extraItems];
  if (!isMockDataEnabled()) {
    const me = store.sessionHandle;
    if (!me) return [];
    all = all.filter(
      (i) => i.ownerHandle === me || defaultSeedVisible(i.ownerHandle),
    );
  }
  return all;
}

export function getItemLocal(id: string): GarageItem | undefined {
  return getAllItems().find((i) => i.id === id);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function postQuestion(input: {
  title: string;
  body: string;
  tags: string[];
  linkedItemId?: string;
  photoDataUrls: string[];
}): Question {
  const store = readStore();
  const author = getMergedPerson(store.sessionHandle) ?? getPerson(store.sessionHandle);
  const id = `${slugify(input.title) || "question"}-${Date.now().toString(36)}`;
  const q: Question = {
    id,
    votes: 0,
    tags: input.tags,
    title: input.title.trim(),
    excerpt: input.body.trim().slice(0, 160),
    body: input.body
      .trim()
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
    asker: author?.name ?? "Member",
    askerHandle: store.sessionHandle,
    init: author?.init ?? "??",
    bg: author?.bg ?? "#527D31",
    time: "just now",
    answers: 0,
    solved: false,
    expert: "",
    linked: input.linkedItemId ? "Linked garage item" : "",
    linkedItemId: input.linkedItemId,
  };
  // Photos kept in sessionStorage for the detail page mock
  if (input.photoDataUrls.length) {
    sessionStorage.setItem(`cf_q_photos_${id}`, JSON.stringify(input.photoDataUrls));
  }
  store.extraQuestions.unshift(q);
  writeStore(store);
  return q;
}

export function postAnswer(input: {
  questionId: string;
  body: string;
  photoDataUrls: string[];
}): Answer {
  const store = readStore();
  const author = getMergedPerson(store.sessionHandle) ?? getPerson(store.sessionHandle);
  const id = `a-${input.questionId}-${Date.now().toString(36)}`;
  const a: Answer = {
    id,
    questionId: input.questionId,
    name: author?.name ?? "Member",
    handle: store.sessionHandle,
    init: author?.init ?? "??",
    bg: author?.bg ?? "#527D31",
    rating: author?.rating ?? "New",
    spokes: author?.spokesNum.toLocaleString() ?? "0",
    badge: author?.roleBadge ?? author?.skills[0] ?? "Member",
    time: "just now",
    votes: 0,
    accepted: false,
    body: input.body
      .trim()
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
  if (input.photoDataUrls.length) {
    sessionStorage.setItem(`cf_a_photos_${id}`, JSON.stringify(input.photoDataUrls));
  }
  store.extraAnswers.push(a);
  writeStore(store);
  return a;
}

export function acceptAnswer(questionId: string, answerId: string) {
  const store = readStore();
  store.acceptedByQuestion[questionId] = answerId;
  writeStore(store);
}

export function postItem(input: {
  title: string;
  category: string;
  year: string;
  condition: string;
  status: ItemStatus;
  askingPrice: string;
  ownerEstValue: string;
  notes: string;
  provenance: string;
  photoDataUrls: string[];
}): GarageItem {
  const store = readStore();
  const id = `${slugify(input.title) || "item"}-${Date.now().toString(36)}`;
  const catShort = input.category;
  const item: GarageItem = {
    id,
    ownerHandle: store.sessionHandle,
    catShort,
    cat: catShort.toUpperCase(),
    year: input.year,
    name: input.title.trim(),
    cond: input.condition,
    mkt: input.ownerEstValue.trim() || "—",
    ask: input.askingPrice.trim() || "—",
    status: input.status,
    links: "0 guides · 0 threads",
    trend: "Flat",
  };
  if (input.photoDataUrls.length) {
    sessionStorage.setItem(`cf_i_photos_${id}`, JSON.stringify(input.photoDataUrls));
  }
  if (input.notes || input.provenance) {
    sessionStorage.setItem(
      `cf_i_meta_${id}`,
      JSON.stringify({ notes: input.notes, provenance: input.provenance }),
    );
  }
  store.extraItems.unshift(item);
  writeStore(store);
  return item;
}

export function listMembers(): Person[] {
  if (isMockDataEnabled()) return people;
  const me = getSessionHandle();
  if (!me) return [];

  const out: Person[] = [];
  const seen = new Set<string>();

  function push(person: Person | undefined) {
    if (!person || seen.has(person.handle)) return;
    seen.add(person.handle);
    out.push(person);
  }

  push(
    getMergedPerson(me) ??
      (defaultSeedVisible(me) ? getPerson(me) : undefined) ??
      stubPersonFromHandle(me, readStore().profilePatches[me]),
  );

  // Always include the default messaging pair (Dylan + Ben) when signed in.
  for (const handle of DEFAULT_SEED_HANDLES) {
    push(getMergedPerson(handle) ?? getPerson(handle));
  }

  return out;
}

/** Verified experts — seed roster when mock is on, otherwise the signed-in member only if verified. */
export function getExpertsLocal(): Person[] {
  return listMembers().filter((p) => p.verified);
}

export function tagSuggestions(): string[] {
  const tags = new Set<string>();
  for (const q of seedQuestions) q.tags.forEach((t) => tags.add(t));
  [
    "repair",
    "vintage-steel",
    "campagnolo",
    "wheels",
    "frameset",
    "valuation",
    "build",
    "rare-parts",
  ].forEach((t) => tags.add(t));
  return Array.from(tags).sort();
}
