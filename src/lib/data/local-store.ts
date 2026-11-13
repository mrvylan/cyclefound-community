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
import { accountIdentityKey } from "@/lib/community/handles";
import {
  clearItemPhotos,
  readItemPhotos,
  writeItemPhotos,
} from "@/lib/garage/item-photos";
import { normalizeAskInput } from "@/lib/garage/itemFields";
import { normalizeSkillLabels } from "@/lib/skills/taxonomy";
import {
  getAllCommunityGarageItems,
  getAllMarketplaceItems,
  getCommunityGarageItem,
  getCommunityGarageItemsForHandle,
  getDirectoryHandleForUserId,
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
  /** Garage directory / spotlight cover — item id whose photo features. */
  garageCoverItemId?: string;
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
    | "discipline"
    | "manufacturer"
    | "cond"
    | "mkt"
    | "ask"
    | "status"
    | "photo"
    | "archived"
    | "description"
    | "bikeComponents"
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

/**
 * Move local garage/profile data when the canonical community handle changes
 * (e.g. display-name slug shift, or aligning to the directory handle).
 */
export function migrateSessionHandle(from: string, to: string) {
  const prev = String(from || "").trim();
  const next = String(to || "").trim();
  if (!prev || !next || prev === next) {
    if (next && getSessionHandle() !== next) setSessionHandle(next);
    return;
  }
  const store = readStore();
  for (const item of store.extraItems) {
    if (item.ownerHandle === prev) item.ownerHandle = next;
  }
  if (store.profilePatches[prev]) {
    store.profilePatches[next] = {
      ...store.profilePatches[prev],
      ...store.profilePatches[next],
    };
    delete store.profilePatches[prev];
  }
  store.sessionHandle = next;
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
  const publicName =
    patch?.name?.trim()?.startsWith("@")
      ? patch.name.trim()
      : `@${handle}`;
  const badge = roleBadgeForMember({ handle });
  return withPublicHandle(
    {
      handle,
      name: publicName,
      init: initialsFromDisplayName(handle),
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
      garageCoverItemId: patch?.garageCoverItemId || undefined,
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
      garageCoverItemId: patch.garageCoverItemId ?? base.garageCoverItemId,
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

/** Public @handle for display (sole public identity). */
export function displayHandleFor(person: Pick<Person, "handle" | "publicHandle">) {
  const claimed = person.publicHandle?.trim();
  if (claimed && !isProvisionalHandle(claimed) && isClaimableHandle(claimed)) {
    return claimed;
  }
  if (person.handle && !isProvisionalHandle(person.handle)) return person.handle;
  // Prefer claiming a real handle; provisional only as last resort for seed rows.
  return person.handle?.trim() || null;
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
        garageCoverItemId:
          patch.garageCoverItemId ?? directory.garageCoverItemId,
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

export function getGarageCoverItemId(handle: string): string | undefined {
  const id = readStore().profilePatches[handle]?.garageCoverItemId;
  return id?.trim() || undefined;
}

/** Persist which garage item photo features on /garages and spotlights. */
export function setGarageCoverItemId(handle: string, itemId: string | null) {
  const store = readStore();
  const prev = store.profilePatches[handle] || {};
  const next: LocalProfilePatch = { ...prev };
  const cleaned = String(itemId || "").trim();
  if (cleaned) next.garageCoverItemId = cleaned;
  else delete next.garageCoverItemId;
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
  const remoteGarage = getCommunityGarageItemsForHandle(handle);
  const raw = [
    ...remoteGarage,
    ...store.extraItems.filter((i) => i.ownerHandle === handle),
    ...marketplace,
  ];
  return resolveOwnedItems(raw, store.itemPatches);
}

export function getAllItems(): GarageItem[] {
  const store = readStore();
  const marketplace = getAllMarketplaceItems();
  const remoteGarage = getAllCommunityGarageItems();
  const me = store.sessionHandle;
  const mine = me
    ? store.extraItems.filter((i) => i.ownerHandle === me)
    : [];
  return resolveOwnedItems(
    [...remoteGarage, ...mine, ...marketplace],
    store.itemPatches,
  );
}

/**
 * Public Market / shared surfaces — Supabase-backed rows only.
 * Browser-local extraItems stay on the owner's garage until they are saved remotely;
 * mixing them here made desktop (logged in) show a different Klein than phones.
 */
export function getPublicMarketItems(): GarageItem[] {
  const store = readStore();
  return resolveOwnedItems(
    [...getAllCommunityGarageItems(), ...getAllMarketplaceItems()],
    store.itemPatches,
  );
}

/** Photos for a garage item — local uploads first, then marketplace signed URLs. */
export function getItemPhotoUrls(item: GarageItem): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  function push(url: string | undefined) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  }

  // Prefer local uploads (localStorage + session cache) — signed remote URLs can expire.
  for (const p of readItemPhotos(item.id)) push(p);
  const remote = getCommunityGarageItem(item.id);
  if (remote?.photoUrls?.length) {
    for (const url of remote.photoUrls) push(url);
  }
  const market = getMarketplaceItem(item.id);
  if (market?.photoUrls?.length) {
    for (const url of market.photoUrls) push(url);
  }
  push(item.photo);
  return out;
}

export function getItemLocal(id: string): GarageItem | undefined {
  return (
    getAllItems().find((i) => i.id === id) ||
    getCommunityGarageItem(id) ||
    getMarketplaceItem(id)
  );
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
  const remote = getCommunityGarageItem(id);
  if (remote) {
    return {
      notes: remote.notes || "",
      provenance: remote.provenance || "",
    };
  }
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
    discipline?: string;
    manufacturer?: string;
    condition: string;
    status: ItemStatus;
    askingPrice: string;
    ownerEstValue: string;
    description: string;
    notes: string;
    provenance: string;
    photoDataUrls: string[];
    bikeComponents?: GarageItem["bikeComponents"];
  },
): GarageItem | undefined {
  const existing = getItemLocal(id);
  if (!existing) return undefined;
  const catShort = normalizeItemCategory(input.category);
  const discipline = input.discipline?.trim() || undefined;
  const manufacturer = input.manufacturer?.trim() || undefined;
  mergeItemPatch(id, {
    name: input.title.trim(),
    catShort,
    cat: catShort.toUpperCase(),
    year: input.year.trim() || "—",
    size: input.size?.trim() || undefined,
    discipline,
    manufacturer,
    cond: input.condition,
    status: input.status,
    ask: normalizeAskInput(input.askingPrice) || "—",
    mkt: input.ownerEstValue.trim() || existing.mkt,
    description: input.description.trim(),
    bikeComponents: input.bikeComponents?.length ? input.bikeComponents : undefined,
    archived: false,
  });
  if (input.photoDataUrls.length) {
    const cover = writeItemPhotos(id, input.photoDataUrls);
    mergeItemPatch(id, { photo: cover });
  } else {
    // Editor cleared all photos. Local keys only — marketplace covers still come from the listings API.
    clearItemPhotos(id);
    if (!getMarketplaceItem(id)) {
      mergeItemPatch(id, { photo: undefined });
    }
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
  // Drop garage cover selection if it pointed at the deleted item.
  const owner = existing?.ownerHandle || getSessionHandle();
  if (owner && getGarageCoverItemId(owner) === id) {
    setGarageCoverItemId(owner, null);
  }
  mergeItemPatch(id, { deleted: true });
  clearItemPhotos(id);
  try {
    sessionStorage.removeItem(`cf_i_meta_${id}`);
  } catch {
    /* ignore */
  }
}

export function canManageGarageItem(
  item: GarageItem,
  sessionHandle: string | null | undefined,
  userId?: string | null,
) {
  if (sessionHandle && sessionHandle === item.ownerHandle) return true;
  const uid = String(userId || "").trim();
  if (!uid) return false;
  const market = getMarketplaceItem(item.id);
  if (market && market.sellerId === uid) return true;
  const garage = getCommunityGarageItem(item.id);
  if (garage && garage.ownerId === uid) return true;
  return false;
}

/** True when this row is a Market bike_listings row (not a Community garage_bikes row). */
export function isMarketplaceListingItem(item: GarageItem) {
  if (getMarketplaceItem(item.id)) return true;
  if (getCommunityGarageItem(item.id)) return false;
  return item.links === "Marketplace" || Boolean((item as { listingId?: string }).listingId);
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
  discipline?: string;
  manufacturer?: string;
  condition: string;
  status: ItemStatus;
  askingPrice: string;
  ownerEstValue: string;
  description: string;
  notes: string;
  provenance: string;
  photoDataUrls: string[];
  bikeComponents?: GarageItem["bikeComponents"];
}): GarageItem {
  const store = readStore();
  const id = `${slugify(input.title) || "item"}-${Date.now().toString(36)}`;
  const catShort = normalizeItemCategory(input.category);
  const size = input.size?.trim();
  const discipline = input.discipline?.trim();
  const manufacturer = input.manufacturer?.trim();
  const bikeComponents = input.bikeComponents?.length
    ? input.bikeComponents
    : undefined;
  const item: GarageItem = {
    id,
    ownerHandle: store.sessionHandle,
    catShort,
    cat: catShort.toUpperCase(),
    year: input.year.trim() || "—",
    ...(size ? { size } : {}),
    ...(discipline ? { discipline } : {}),
    ...(manufacturer ? { manufacturer } : {}),
    ...(bikeComponents ? { bikeComponents } : {}),
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
    item.photo = writeItemPhotos(id, input.photoDataUrls);
  }
  writeItemPrivateMeta(id, {
    notes: input.notes,
    provenance: input.provenance,
  });
  store.extraItems.unshift(item);
  writeStore(store);
  return item;
}

function personRichness(person: Person) {
  return (
    (person.bio ? 4 : 0) +
    (person.avatarUrl ? 2 : 0) +
    (person.loc ? 1 : 0) +
    normalizeSkillLabels(person.skills).length * 2 +
    getGarageItemsFor(person.handle).length
  );
}

/** Prefer the fuller profile when the same account appears under two slug handles. */
function preferRicherPerson(a: Person, b: Person) {
  return personRichness(b) > personRichness(a) ? b : a;
}

/**
 * Collapse dylan_s_* / dylan_simpson_* style duplicates into one person.
 * Used by listMembers and any UI that maps the directory.
 */
export function dedupePeopleByAccount(people: Person[]): Person[] {
  const byKey = new Map<string, Person>();
  for (const person of people) {
    const userId = getDirectoryUserId(person.handle);
    const key = accountIdentityKey(person.handle, userId);
    const existing = byKey.get(key);
    byKey.set(key, existing ? preferRicherPerson(existing, person) : person);
  }
  return [...byKey.values()];
}

export function listMembers(opts?: { authUserId?: string }): Person[] {
  const withSkills = (person: Person | undefined) => {
    if (!person) return undefined;
    return { ...person, skills: normalizeSkillLabels(person.skills) };
  };

  const out: Person[] = [];
  const seenHandles = new Set<string>();
  const seenIds = new Set<string>();

  function push(person: Person | undefined) {
    const next = withSkills(person);
    if (!next || seenHandles.has(next.handle)) return;
    const userId = getDirectoryUserId(next.handle);
    if (
      isHiddenMember({ name: next.name, handle: next.handle, userId }) &&
      next.handle !== getSessionHandle()
    ) {
      return;
    }
    const key = accountIdentityKey(next.handle, userId);
    if (seenIds.has(key)) return;
    seenIds.add(key);
    seenHandles.add(next.handle);
    out.push(next);
  }

  // Real Supabase members (marketplace accounts) — available logged out or in.
  for (const row of getDirectoryMembers()) {
    push(resolvePerson(row.handle) ?? row.person);
  }

  const me = getSessionHandle();
  const authUserId = opts?.authUserId?.trim() || "";
  if (me) {
    // Prefer the directory row for this account so we don't show a second card
    // when the session slug differs from the directory handle (dylan_s_* vs dylan_simpson_*).
    const dirHandle = authUserId ? getDirectoryHandleForUserId(authUserId) : undefined;
    const candidateKeys = [
      accountIdentityKey(me, getDirectoryUserId(me)),
      authUserId ? accountIdentityKey(me, authUserId) : "",
      dirHandle ? accountIdentityKey(dirHandle, authUserId || getDirectoryUserId(dirHandle)) : "",
    ].filter(Boolean);
    const alreadyListed =
      candidateKeys.some((k) => seenIds.has(k)) || Boolean(dirHandle);
    if (!alreadyListed) {
      push(
        getMergedPerson(me) ??
          getDirectoryPerson(me) ??
          stubPersonFromHandle(me, readStore().profilePatches[me]),
      );
    }
  }

  // Final pass — collapses any remaining slug-drift duplicates.
  return dedupePeopleByAccount(out);
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
