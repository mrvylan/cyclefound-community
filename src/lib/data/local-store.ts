"use client";

import {
  answers as seedAnswers,
  getItemsByOwner as seedItemsByOwner,
  getPerson,
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

const STORAGE_KEY = "cf_beta_v1";

export type LocalProfilePatch = {
  name?: string;
  loc?: string;
  bio?: string;
  skills?: string[];
  wantedLines?: string[];
};

type LocalStore = {
  sessionHandle: string;
  extraQuestions: Question[];
  extraAnswers: Answer[];
  extraItems: GarageItem[];
  profilePatches: Record<string, LocalProfilePatch>;
  /** Overrides accepted answer id per question */
  acceptedByQuestion: Record<string, string | null>;
};

const defaultStore = (): LocalStore => ({
  sessionHandle: "ben_carver",
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

export function getMergedPerson(handle: string): Person | undefined {
  const base = getPerson(handle);
  if (!base) return undefined;
  const patch = readStore().profilePatches[handle];
  if (!patch) return base;
  return {
    ...base,
    name: patch.name ?? base.name,
    loc: patch.loc ?? base.loc,
    bio: patch.bio ?? base.bio,
    skills: patch.skills ?? base.skills,
  };
}

export function getWantedLines(handle: string): string[] {
  const patch = readStore().profilePatches[handle];
  if (patch?.wantedLines) return patch.wantedLines;
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
  const all = [...seedQuestions, ...store.extraQuestions];
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
  const merged = [
    ...seedAnswers.filter((a) => a.questionId === questionId),
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
  return [
    ...seedItemsByOwner(handle),
    ...store.extraItems.filter((i) => i.ownerHandle === handle),
  ];
}

export function getAllItems(): GarageItem[] {
  const store = readStore();
  return [...seedItems, ...store.extraItems];
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

export function listMembers() {
  return people;
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
