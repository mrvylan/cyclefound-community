/** Persist Ask / Message / listing drafts across auth redirects. */

const ASK_DRAFT_KEY = "cf_ask_draft_v1";
const MESSAGE_DRAFT_KEY = "cf_message_draft_v1";
const ITEM_DRAFT_KEY = "cf_item_draft_v1";

export type AskDraft = {
  title: string;
  body: string;
  tags: string[];
  /** Fix / Find / Value / Build / Other intent id */
  intent?: string;
  /** @deprecated Prefer intent */
  category?: string;
  linkedItemId?: string;
};

export type MessageDraft = {
  handle: string;
  name: string;
  message: string;
  kind: "member" | "garage";
  itemId?: string;
};

export type ItemDraft = {
  title: string;
  category: string;
  year: string;
  condition: string;
  status: string;
  askingPrice: string;
  description: string;
  notes: string;
  provenance: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function saveAskDraft(draft: AskDraft) {
  writeJson(ASK_DRAFT_KEY, draft);
}

export function readAskDraft() {
  return readJson<AskDraft>(ASK_DRAFT_KEY);
}

export function clearAskDraft() {
  sessionStorage.removeItem(ASK_DRAFT_KEY);
}

export function saveMessageDraft(draft: MessageDraft) {
  writeJson(MESSAGE_DRAFT_KEY, draft);
}

export function readMessageDraft() {
  return readJson<MessageDraft>(MESSAGE_DRAFT_KEY);
}

export function clearMessageDraft() {
  sessionStorage.removeItem(MESSAGE_DRAFT_KEY);
}

export function saveItemDraft(draft: ItemDraft) {
  writeJson(ITEM_DRAFT_KEY, draft);
}

export function readItemDraft() {
  return readJson<ItemDraft>(ITEM_DRAFT_KEY);
}

export function clearItemDraft() {
  sessionStorage.removeItem(ITEM_DRAFT_KEY);
}
