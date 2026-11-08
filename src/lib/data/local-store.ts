"use client";

import {
  isDefaultSeedHandle,
  type Answer,
  type GarageItem,
  type ItemStatus,
  type Person,
  type Question,
} from "./seed";
import {
  getStarterAnswers,
  getStarterQuestion,
  STARTER_QUESTIONS,
} from "./starter-feed";
import { normalizeItemCategory } from "./categories";
import {
  isClaimableHandle,
  isProvisionalHandle,
  isValidMemberHandle,
  normalizeClaimedHandle,
} from "./handles";
import { normalizeAskInput } from "@/lib/garage/itemFields";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";
import {
  getAllMarketplaceItems,
  getDirectoryMembers,
  getDirectoryPerson,
  getDirectoryUserId,
  getMarketplaceItem,
  getMarketplaceItemsForHandle,
} from "@/lib/community/directory-cache";
import {
  resolveMemberContribution,
  type ContributionActivity,
  type MemberContribution,
} from "@/lib/community/contribution-tier";
import { roleBadgeForMember } from "@/lib/community/founding-members";
import { isHiddenMember } from "@/lib/community/hidden-members";

export { isValidMemberHandle } from "./handles";
export {
  DEFAULT_SEED_HANDLES,
  isDefaultSeedHandle,
  PARTNER_SEED_HANDLE,
  SOLO_SEED_HANDLE,
} from "./seed";

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
  /** Vertical crop focus for cover (`object-position` Y%), 0–100. */
  coverPositionY?: number;
  /** Public @handle claimed by the member (hides provisional hash handles). */
  claimedHandle?: string;
};

/** Clamp cover focal point for `object-position: 50% {y}%`. */
export function clampCoverPositionY(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

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

export type GarageItemPatch = Partial<
  Pick<
    GarageItem,
    | "name"
    | "catShort"
    | "cat"
    | "year"
    | "size"
    | "cond"
    | "mkt"
    | "ask"
    | "status"
    | "photo"
    | "archived"
    | "description"
  >
> & {
  /** Permanently remove from garage views (seed + user items). */
  deleted?: boolean;
};

type LocalStore = {
  sessionHandle: string;
  /** When true, seed/mock community data is visible for UI demos. Off by default. */
  mockDataEnabled: boolean;
  extraQuestions: Question[];
  extraAnswers: Answer[];
  extraItems: GarageItem[];
  /** Edits / archive / delete overlays for seed or user items. */
  itemPatches: Record<string, GarageItemPatch>;
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
  itemPatches: {},
  profilePatches: {},
  acceptedByQuestion: {},
});

function readStore(): LocalStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    const store: LocalStore = {
      ...defaultStore(),
      ...parsed,
      // Mock/seed community data is retired — never rehydrate the flag.
      mockDataEnabled: false,
      itemPatches: parsed.itemPatches ?? {},
      profilePatches: parsed.profilePatches ?? {},
      extraItems: parsed.extraItems ?? [],
      extraQuestions: parsed.extraQuestions ?? [],
      extraAnswers: parsed.extraAnswers ?? [],
    };
    // Drop leftover demo actors from older clients.
    if (store.sessionHandle && isDefaultSeedHandle(store.sessionHandle)) {
      store.sessionHandle = "";
    }
    if (parsed.mockDataEnabled) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      } catch {
        /* ignore quota */
      }
    }
    return store;
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

/** Mock/seed community data is permanently off. */
export function isMockDataEnabled(): boolean {
  return false;
}

/** No-op — mock inserts are disabled. */
export function insertMockData() {
  clearMockData();
}

/** Ensure mock flag is off and demo seed actors are not the session. */
export function clearMockData() {
  const store = readStore();
  store.mockDataEnabled = false;
  if (store.sessionHandle && isDefaultSeedHandle(store.sessionHandle)) {
    store.sessionHandle = "";
  }
  writeStore(store);
}

function seedPerson(_handle: string): Person | undefined {
  return undefined;
}

function stubPersonFromHandle(handle: string, patch?: LocalProfilePatch): Person {
  const name = patch?.name?.trim() || handle;
  const badge = roleBadgeForMember({ handle });
  return withPublicHandle(
    {
      handle,
      name,
      init: initialsFromDisplayName(name),
      bg: "#527D31",
      role: badge,
      loc: patch?.loc ?? "",
      level: "RIDER",
      skills: normalizeSkillLabels(patch?.skills ?? []),
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
      roleBadge: badge,
      avatarUrl: patch?.avatarUrl || undefined,
      coverUrl: patch?.coverUrl || undefined,
      coverPositionY:
        patch?.coverPositionY !== undefined
          ? clampCoverPositionY(patch.coverPositionY)
          : undefined,
    },
    patch?.claimedHandle,
  );
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
  if (!patch) return withPublicHandle(base, undefined);
  const name = patch.name ?? base.name;
  return withPublicHandle(
    {
      ...base,
      name,
      init: patch.name ? initialsFromDisplayName(name) : base.init,
      loc: patch.loc ?? base.loc,
      bio: patch.bio ?? base.bio,
      skills: normalizeSkillLabels(patch.skills ?? base.skills),
      avatarUrl: patch.avatarUrl ?? base.avatarUrl,
      coverUrl: patch.coverUrl ?? base.coverUrl,
      coverPositionY:
        patch.coverPositionY !== undefined
          ? clampCoverPositionY(patch.coverPositionY)
          : base.coverPositionY,
    },
    patch.claimedHandle,
  );
}

function withPublicHandle(person: Person, claimed?: string): Person {
  const claimedNorm = claimed ? normalizeClaimedHandle(claimed) : "";
  // Drop stale local patches that stored the auto hash as a "claimed" handle.
  if (
    claimedNorm &&
    isClaimableHandle(claimedNorm) &&
    !isProvisionalHandle(claimedNorm)
  ) {
    return { ...person, publicHandle: claimedNorm };
  }
  // Never surface auto hash handles (e.g. dylan_s_75f7798f) as a public @.
  if (isProvisionalHandle(person.handle)) {
    return { ...person, publicHandle: undefined };
  }
  return { ...person, publicHandle: person.handle };
}

/** Public @handle for display, or null when still provisional. */
export function displayHandleFor(person: Pick<Person, "handle" | "publicHandle">) {
  const claimed = person.publicHandle?.trim();
  if (claimed && !isProvisionalHandle(claimed) && isClaimableHandle(claimed)) {
    return claimed;
  }
  if (person.handle && !isProvisionalHandle(person.handle)) return person.handle;
  return null;
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
  const directory = getDirectoryPerson(key);
  if (directory) {
    const patch = readStore().profilePatches[key];
    if (!patch) return withPublicHandle(directory, undefined);
    return withPublicHandle(
      {
        ...directory,
        name: patch.name ?? directory.name,
        loc: patch.loc ?? directory.loc,
        bio: patch.bio ?? directory.bio,
        skills: normalizeSkillLabels(patch.skills ?? directory.skills),
        avatarUrl: patch.avatarUrl ?? directory.avatarUrl,
        coverUrl: patch.coverUrl ?? directory.coverUrl,
        coverPositionY:
          patch.coverPositionY !== undefined
            ? clampCoverPositionY(patch.coverPositionY)
            : directory.coverPositionY,
      },
      patch.claimedHandle,
    );
  }
  // Own account stub even before a name patch exists.
  if (key === getSessionHandle()) {
    return stubPersonFromHandle(key, readStore().profilePatches[key]);
  }
  return undefined;
}

export function getWantedLines(handle: string): string[] {
  const patch = readStore().profilePatches[handle];
  if (patch?.wantedLines) return patch.wantedLines;
  return [];
}

export function saveProfilePatch(handle: string, patch: LocalProfilePatch) {
  const store = readStore();
  const next = {
    ...store.profilePatches[handle],
    ...patch,
  };
  if (patch.skills) {
    next.skills = normalizeSkillLabels(patch.skills);
  }
  store.profilePatches[handle] = next;
  writeStore(store);
}

function enrichUserQuestion(q: Question): Question {
  const thread = getAllAnswers(q.id);
  const accepted = thread.find((a) => a.accepted);
  return {
    ...q,
    answers: thread.length,
    solved: Boolean(accepted),
    expert: accepted?.name ?? q.expert ?? "",
    expertHandle: accepted?.handle ?? q.expertHandle,
  };
}

export function getAllQuestions(): Question[] {
  const store = readStore();
  const userQs = store.extraQuestions.map(enrichUserQuestion);
  const userIds = new Set(userQs.map((q) => q.id));
  // Starter Community threads fill an empty Pre-Alpha feed (read-only catalog).
  const starters = STARTER_QUESTIONS.filter((q) => !userIds.has(q.id)).map((q) => {
    const thread = getAllAnswers(q.id);
    const accepted = thread.find((a) => a.accepted);
    return {
      ...q,
      answers: thread.length,
      solved: Boolean(accepted),
      expert: accepted?.name ?? q.expert,
      expertHandle: accepted?.handle ?? q.expertHandle,
    };
  });
  return [...userQs, ...starters];
}

export function getQuestionLocal(id: string): Question | undefined {
  return getAllQuestions().find((q) => q.id === id) || getStarterQuestion(id);
}

export function getAllAnswers(questionId: string): Answer[] {
  const store = readStore();
  const local = store.extraAnswers.filter((a) => a.questionId === questionId);
  const starter = local.length ? [] : getStarterAnswers(questionId);
  const merged = [...local, ...starter];
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

function applyItemPatch(item: GarageItem, patch?: GarageItemPatch): GarageItem | null {
  if (!patch) return item;
  if (patch.deleted) return null;
  const { deleted: _deleted, ...fields } = patch;
  return { ...item, ...fields };
}

function resolveOwnedItems(raw: GarageItem[], patches: Record<string, GarageItemPatch>) {
  const out: GarageItem[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const next = applyItemPatch(item, patches[item.id]);
    if (next) out.push(next);
  }
  return out;
}

export function getGarageItemsFor(handle: string): GarageItem[] {
  const store = readStore();
  const marketplace = getMarketplaceItemsForHandle(handle);
  const raw = [
    ...store.extraItems.filter((i) => i.ownerHandle === handle),
    ...marketplace,
  ];
  return resolveOwnedItems(raw, store.itemPatches);
}

export function getAllItems(): GarageItem[] {
  const store = readStore();
  const marketplace = getAllMarketplaceItems();
  const me = store.sessionHandle;
  const mine = me
    ? store.extraItems.filter((i) => i.ownerHandle === me)
    : [];
  return resolveOwnedItems([...mine, ...marketplace], store.itemPatches);
}

/** Photos for a garage item — marketplace signed URLs, seed `photo`, session uploads. */
export function getItemPhotoUrls(item: GarageItem): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  function push(url: string | undefined) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  }

  const market = getMarketplaceItem(item.id);
  if (market?.photoUrls?.length) {
    for (const url of market.photoUrls) push(url);
  }
  push(item.photo);
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(`cf_i_photos_${item.id}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        for (const p of parsed) if (typeof p === "string") push(p);
      }
    } catch {
      /* ignore malformed session data */
    }
  }
  return out;
}

export function getItemLocal(id: string): GarageItem | undefined {
  return getAllItems().find((i) => i.id === id) || getMarketplaceItem(id);
}

function mergeItemPatch(id: string, patch: GarageItemPatch) {
  const store = readStore();
  store.itemPatches[id] = { ...store.itemPatches[id], ...patch };
  // Keep extraItems in sync when the row lives there (avoids stale list data).
  const idx = store.extraItems.findIndex((i) => i.id === id);
  if (idx >= 0) {
    if (patch.deleted) {
      store.extraItems.splice(idx, 1);
      delete store.itemPatches[id];
    } else {
      const { deleted: _d, ...fields } = patch;
      store.extraItems[idx] = { ...store.extraItems[idx]!, ...fields };
    }
  }
  writeStore(store);
}

export function getItemPrivateMeta(id: string): {
  notes: string;
  provenance: string;
} {
  if (typeof window === "undefined") return { notes: "", provenance: "" };
  try {
    const raw = sessionStorage.getItem(`cf_i_meta_${id}`);
    if (!raw) return { notes: "", provenance: "" };
    const parsed = JSON.parse(raw) as { notes?: string; provenance?: string };
    return {
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      provenance: typeof parsed.provenance === "string" ? parsed.provenance : "",
    };
  } catch {
    return { notes: "", provenance: "" };
  }
}

function writeItemPrivateMeta(
  id: string,
  meta: { notes: string; provenance: string },
) {
  const notes = meta.notes.trim();
  const provenance = meta.provenance.trim();
  if (!notes && !provenance) {
    sessionStorage.removeItem(`cf_i_meta_${id}`);
    return;
  }
  sessionStorage.setItem(
    `cf_i_meta_${id}`,
    JSON.stringify({ notes, provenance }),
  );
}

export function updateGarageItem(
  id: string,
  input: {
    title: string;
    category: string;
    year: string;
    size?: string;
    condition: string;
    status: ItemStatus;
    askingPrice: string;
    ownerEstValue: string;
    description: string;
    notes: string;
    provenance: string;
    photoDataUrls: string[];
  },
): GarageItem | undefined {
  const existing = getItemLocal(id);
  if (!existing) return undefined;
  const catShort = normalizeItemCategory(input.category);
  mergeItemPatch(id, {
    name: input.title.trim(),
    catShort,
    cat: catShort.toUpperCase(),
    year: input.year.trim() || "—",
    size: input.size?.trim() || undefined,
    cond: input.condition,
    status: input.status,
    ask: normalizeAskInput(input.askingPrice) || "—",
    mkt: input.ownerEstValue.trim() || existing.mkt,
    description: input.description.trim(),
    archived: false,
  });
  if (input.photoDataUrls.length) {
    sessionStorage.setItem(`cf_i_photos_${id}`, JSON.stringify(input.photoDataUrls));
  } else {
    sessionStorage.removeItem(`cf_i_photos_${id}`);
  }
  writeItemPrivateMeta(id, {
    notes: input.notes,
    provenance: input.provenance,
  });
  return getItemLocal(id);
}

export function archiveGarageItem(id: string) {
  if (!getItemLocal(id)) return;
  mergeItemPatch(id, { archived: true });
}

export function unarchiveGarageItem(id: string) {
  if (!getItemLocal(id)) return;
  mergeItemPatch(id, { archived: false });
}

export function deleteGarageItem(id: string) {
  const existing = getItemLocal(id);
  const store = readStore();
  const known =
    Boolean(existing) ||
    store.extraItems.some((i) => i.id === id) ||
    Boolean(getMarketplaceItem(id));
  if (!known) return;
  mergeItemPatch(id, { deleted: true });
  try {
    sessionStorage.removeItem(`cf_i_photos_${id}`);
    sessionStorage.removeItem(`cf_i_meta_${id}`);
  } catch {
    /* ignore */
  }
}

export function canManageGarageItem(item: GarageItem, sessionHandle: string | null | undefined) {
  return Boolean(sessionHandle && sessionHandle === item.ownerHandle);
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
  const author =
    getMergedPerson(store.sessionHandle) ??
    getDirectoryPerson(store.sessionHandle) ??
    resolvePerson(store.sessionHandle);
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
  const author =
    getMergedPerson(store.sessionHandle) ??
    getDirectoryPerson(store.sessionHandle) ??
    resolvePerson(store.sessionHandle);
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
  size?: string;
  condition: string;
  status: ItemStatus;
  askingPrice: string;
  ownerEstValue: string;
  description: string;
  notes: string;
  provenance: string;
  photoDataUrls: string[];
}): GarageItem {
  const store = readStore();
  const id = `${slugify(input.title) || "item"}-${Date.now().toString(36)}`;
  const catShort = normalizeItemCategory(input.category);
  const size = input.size?.trim();
  const item: GarageItem = {
    id,
    ownerHandle: store.sessionHandle,
    catShort,
    cat: catShort.toUpperCase(),
    year: input.year.trim() || "—",
    ...(size ? { size } : {}),
    name: input.title.trim(),
    cond: input.condition,
    mkt: input.ownerEstValue.trim() || "—",
    ask: normalizeAskInput(input.askingPrice) || "—",
    status: input.status,
    links: "0 guides · 0 threads",
    trend: "Flat",
    description: input.description.trim(),
  };
  if (input.photoDataUrls.length) {
    sessionStorage.setItem(`cf_i_photos_${id}`, JSON.stringify(input.photoDataUrls));
  }
  writeItemPrivateMeta(id, {
    notes: input.notes,
    provenance: input.provenance,
  });
  store.extraItems.unshift(item);
  writeStore(store);
  return item;
}

export function listMembers(): Person[] {
  const withSkills = (person: Person | undefined) => {
    if (!person) return undefined;
    return { ...person, skills: normalizeSkillLabels(person.skills) };
  };

  const out: Person[] = [];
  const seen = new Set<string>();

  function push(person: Person | undefined) {
    const next = withSkills(person);
    if (!next || seen.has(next.handle)) return;
    if (
      isHiddenMember({ name: next.name, handle: next.handle }) &&
      next.handle !== getSessionHandle()
    ) {
      return;
    }
    seen.add(next.handle);
    out.push(next);
  }

  // Real Supabase members (marketplace accounts) — available logged out or in.
  for (const row of getDirectoryMembers()) {
    push(resolvePerson(row.handle) ?? row.person);
  }

  const me = getSessionHandle();
  if (me) {
    push(
      getMergedPerson(me) ??
        getDirectoryPerson(me) ??
        stubPersonFromHandle(me, readStore().profilePatches[me]),
    );
  }

  return out;
}

/** Verified experts — seed roster when mock is on, otherwise the signed-in member only if verified. */
export function getExpertsLocal(): Person[] {
  return listMembers().filter((p) => p.verified);
}

/** Live Q&A counts for a member from the local community store. */
export function getContributionActivity(handle: string): ContributionActivity {
  const key = String(handle || "").trim();
  if (!key) return { asked: 0, answered: 0, accepted: 0 };

  const asked = getAllQuestions().filter((q) => q.askerHandle === key).length;
  const store = readStore();
  const mine = store.extraAnswers.filter((a) => a.handle === key);
  let accepted = 0;
  for (const a of mine) {
    const override = store.acceptedByQuestion[a.questionId];
    if (override !== undefined) {
      if (override === a.id) accepted += 1;
      continue;
    }
    if (a.accepted) accepted += 1;
  }
  return { asked, answered: mine.length, accepted };
}

/** Tier + score for a member (may use Pre-Alpha preview numbers when live counts are empty). */
export function getMemberContribution(handle: string): MemberContribution {
  const key = String(handle || "").trim();
  return resolveMemberContribution(getContributionActivity(key), {
    handle: key,
    userId: getDirectoryUserId(key),
  });
}

export function tagSuggestions(): string[] {
  const tags = new Set<string>([
    "repair",
    "vintage-steel",
    "campagnolo",
    "wheels",
    "frameset",
    "valuation",
    "build",
    "rare-parts",
  ]);
  for (const q of readStore().extraQuestions) {
    q.tags.forEach((t) => tags.add(t));
  }
  return Array.from(tags).sort();
}
