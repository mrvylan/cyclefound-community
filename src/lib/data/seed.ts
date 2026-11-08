import { seedGarageCover } from "./seed-photos";

export type ItemStatus = "For sale" | "Open to offers" | "Trade only" | "Not for sale";
export type Level = "RIDER" | "PRO" | "MASTER" | "LEGEND";

export type Person = {
  handle: string;
  name: string;
  init: string;
  bg: string;
  role: string;
  loc: string;
  level: Level;
  rating: string;
  reviews: number;
  spokes: string;
  spokesNum: number;
  accepted: number;
  /** Display hint only — prefer live garage counts. */
  items: number;
  reply: string;
  bio: string;
  skills: string[];
  consult: string;
  verified: boolean;
  /** Optional manual badge shown when verifiedBadges feature is off. */
  roleBadge?: string;
  memberSince: string;
  avatarUrl?: string;
  coverUrl?: string;
};

export type Garage = {
  ownerHandle: string;
  name: string;
  description: string;
  location: string;
  updated: string;
};

export type GarageItem = {
  id: string;
  ownerHandle: string;
  catShort: string;
  cat: string;
  year: string;
  size?: string;
  name: string;
  cond: string;
  mkt: string;
  ask: string;
  status: ItemStatus;
  links: string;
  trend: string;
  photo?: string;
  archived?: boolean;
  description?: string;
};

export type WantedRequest = {
  id: string;
  part: string;
  ownerHandle: string;
};

export type Question = {
  id: string;
  votes: number;
  tags: string[];
  title: string;
  excerpt: string;
  body?: string[];
  asker: string;
  askerHandle?: string;
  init: string;
  bg: string;
  time: string;
  answers: number;
  solved: boolean;
  expert: string;
  expertHandle?: string;
  linked: string;
  views?: number;
  following?: number;
  bounty?: number;
  linkedItemId?: string;
};

export type Answer = {
  id: string;
  questionId: string;
  name: string;
  handle: string;
  init: string;
  bg: string;
  rating: string;
  spokes: string;
  badge: string;
  time: string;
  votes: number;
  accepted: boolean;
  body: string[];
};

const MARKET_STATUSES: ItemStatus[] = ["For sale", "Open to offers", "Trade only"];

/** Legacy demo actor handles — cleared from local session if present. */
export const SOLO_SEED_HANDLE = "dsimpson";
export const PARTNER_SEED_HANDLE = "ben_carver";
export const DEFAULT_SEED_HANDLES = [SOLO_SEED_HANDLE, PARTNER_SEED_HANDLE] as const;

export function isDefaultSeedHandle(handle?: string | null) {
  return Boolean(handle && (DEFAULT_SEED_HANDLES as readonly string[]).includes(handle));
}

/** Seed catalogs are retired — community data comes from Supabase + local user posts. */
export const people: Person[] = [];
export const garages: Garage[] = [];
export const items: GarageItem[] = [];
export const garageItems = items;
export const wanted: WantedRequest[] = [];
export const answers: Answer[] = [];
export const questionAnswers: Answer[] = [];
export const questions: Question[] = [];
export const leaders: {
  rank: number;
  name: string;
  handle: string;
  init: string;
  bg: string;
  role: string;
  gain: string;
}[] = [];
export const areas: { label: string; n: number }[] = [];
export const featuredGarages: {
  name: string;
  handle: string;
  owner: string;
  init: string;
  bg: string;
  photo: string;
  photoLabel: string;
  items: number;
  value: string;
  forSale: number;
}[] = [];

export function getAnswersForQuestion(questionId: string): Answer[] {
  return answers
    .filter((a) => a.questionId === questionId)
    .slice()
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      return b.votes - a.votes;
    });
}

export function enrichQuestion(
  q: Omit<Question, "answers" | "solved" | "expert"> | Question,
): Question {
  const thread = getAnswersForQuestion(q.id);
  const accepted = thread.find((a) => a.accepted);
  return {
    ...q,
    answers: thread.length,
    solved: Boolean(accepted),
    expert: accepted?.name ?? "",
    expertHandle: accepted?.handle,
  };
}

export function getQuestions(): Question[] {
  return [];
}

export function getPerson(handle: string) {
  return people.find((p) => p.handle === handle);
}

export function getGarage(ownerHandle: string) {
  return garages.find((g) => g.ownerHandle === ownerHandle);
}

export function getQuestion(id: string) {
  void id;
  return undefined;
}

export function getItem(id: string) {
  return items.find((i) => i.id === id);
}

export function getItemsByOwner(ownerHandle: string) {
  return items.filter((i) => i.ownerHandle === ownerHandle);
}

export function getMarketListings() {
  return items.filter((i) => MARKET_STATUSES.includes(i.status));
}

export function getWantedByOwner(ownerHandle: string) {
  return wanted.filter((w) => w.ownerHandle === ownerHandle);
}

export function cityFromLoc(loc: string) {
  return loc.split("·")[0]?.trim() ?? loc;
}

export function formatWantedOwner(w: WantedRequest) {
  const owner = getPerson(w.ownerHandle);
  if (!owner) return w.ownerHandle;
  return `${owner.name} · ${cityFromLoc(owner.loc)}`;
}

export function getWantedMatchCount(w: WantedRequest) {
  const tokens = w.part
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  if (!tokens.length) return 0;
  return items.filter((item) => {
    const hay = `${item.name} ${item.cat}`.toLowerCase();
    return tokens.filter((t) => hay.includes(t)).length >= 2;
  }).length;
}

export function formatWantedMatches(w: WantedRequest) {
  const n = getWantedMatchCount(w);
  if (n === 0) return "No matches yet";
  return `${n} garage match${n === 1 ? "" : "es"}`;
}

export function acceptedCountForHandle(handle: string) {
  return answers.filter((a) => a.handle === handle && a.accepted).length;
}

export function answerCountForHandle(handle: string) {
  return answers.filter((a) => a.handle === handle).length;
}

export function garageActivityFor(_handle: string) {
  return [] as { title: string; time: string }[];
}

/** Default brand-pattern cover for profiles without a custom banner. */
export { seedGarageCover };

/** @deprecated Prefer FEED_TOPICS in `@/lib/skills/feedTopics`. */
export const topicRoutes: Record<string, number> = {};

export const marcoProfile = {
  skills: [] as { name: string; endorse: number; pct: number }[],
  spokesBreakdown: [] as { label: string; n: string }[],
  badges: [] as { mark: string; name: string }[],
  answers: [] as { votes: number; q: string; meta: string; acc: boolean; id: string }[],
  reviews: [] as { who: string; ctx: string; stars: number; text: string }[],
  services: [] as { kind: string; detail: string }[],
};

export const itemDetail = {
  specs: [] as { k: string; v: string }[],
  history: [] as { y: string; t: string }[],
  others: [] as { itemId: string }[],
  guides: [] as { kind: string; t: string; by: string }[],
  parts: [] as ({ itemId: string } | { n: string; w: string; p: string })[],
  experts: [] as { n: string; handle: string; i: string; bg: string; why: string }[],
  photoLabels: ["Photo"] as string[],
  trendBars: {
    "1Y": { l: [] as string[], v: [] as number[], t: "" },
    "5Y": { l: [] as string[], v: [] as number[], t: "" },
    All: { l: [] as string[], v: [] as number[], t: "" },
  },
};

export function resolveSameModelCards() {
  return [] as {
    id: string;
    name: string;
    owner: string;
    status: string;
    color: string;
  }[];
}

export function resolveCompatibleParts() {
  return [] as { n: string; w: string; p: string }[];
}

export function getExperts() {
  return people.filter((p) => p.verified);
}
