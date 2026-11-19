import type { Answer, Question } from "@/lib/data/seed";
import {
  avatarColorForId,
  getMemberName,
  initialsFromMember,
} from "@/lib/community/memberDisplay";

export type QuestionRow = {
  id: string;
  asker_id: string;
  title: string;
  body: string;
  tags: string[] | null;
  linked_item_id?: string | null;
  votes: number;
  solved: boolean;
  accepted_answer_id?: string | null;
  created_at: string;
  profiles?: {
    handle?: string | null;
    display_name?: string | null;
  } | null;
  answer_count?: number;
};

export type AnswerRow = {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  votes: number;
  accepted: boolean;
  created_at: string;
  profiles?: {
    handle?: string | null;
    display_name?: string | null;
  } | null;
};

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const hours = (Date.now() - t) / 36e5;
  if (hours < 1 / 60) return "just now";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  if (hours < 24 * 7) return `${Math.round(hours / 24)}d ago`;
  return `${Math.round(hours / 24 / 7)}w ago`;
}

export function mapQuestionRow(
  row: QuestionRow,
  answerCount = 0,
  expertName = "",
  expertHandle = "",
): Question {
  const handle = String(row.profiles?.handle || "").trim().toLowerCase();
  const displayName = String(row.profiles?.display_name || "").trim() || undefined;
  const name = getMemberName({ displayName, handle }) || "Member";
  const body = String(row.body || "").trim();
  return {
    id: row.id,
    votes: row.votes ?? 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    title: row.title,
    excerpt: body.slice(0, 160),
    body: body
      ? body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
      : [],
    asker: name,
    askerHandle: handle || undefined,
    init: initialsFromMember({ displayName, handle }),
    bg: avatarColorForId(row.asker_id),
    time: relativeTime(row.created_at),
    answers: answerCount,
    solved: Boolean(row.solved),
    expert: expertName,
    expertHandle: expertHandle || undefined,
    linked: "",
    linkedItemId: row.linked_item_id || undefined,
  };
}

export function mapAnswerRow(row: AnswerRow): Answer {
  const handle = String(row.profiles?.handle || "").trim().toLowerCase();
  const displayName = String(row.profiles?.display_name || "").trim() || undefined;
  const name = getMemberName({ displayName, handle }) || "Member";
  return {
    id: row.id,
    questionId: row.question_id,
    name,
    handle: handle || row.author_id,
    init: initialsFromMember({ displayName, handle }),
    bg: avatarColorForId(row.author_id),
    rating: "—",
    spokes: "0",
    badge: "",
    time: relativeTime(row.created_at),
    votes: row.votes ?? 0,
    accepted: Boolean(row.accepted),
    body: String(row.body || "")
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

export async function fetchCommunityQuestions(): Promise<Question[]> {
  const res = await fetch("/api/community/questions", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as {
    questions?: Question[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Could not load questions.");
  return data.questions || [];
}

export async function fetchCommunityQuestion(
  id: string,
): Promise<{ question: Question; answers: Answer[] } | null> {
  const res = await fetch(`/api/community/questions/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  const data = (await res.json().catch(() => ({}))) as {
    question?: Question;
    answers?: Answer[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Could not load question.");
  if (!data.question) return null;
  return { question: data.question, answers: data.answers || [] };
}

export async function postCommunityQuestion(input: {
  title: string;
  body: string;
  tags: string[];
  linkedItemId?: string;
}): Promise<Question> {
  const res = await fetch("/api/community/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    question?: Question;
    error?: string;
  };
  if (!res.ok || !data.question) {
    throw new Error(data.error || "Could not post question.");
  }
  return data.question;
}

export async function postCommunityAnswer(input: {
  questionId: string;
  body: string;
}): Promise<Answer> {
  const res = await fetch(
    `/api/community/questions/${encodeURIComponent(input.questionId)}/answers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.body }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    answer?: Answer;
    error?: string;
  };
  if (!res.ok || !data.answer) {
    throw new Error(data.error || "Could not post answer.");
  }
  return data.answer;
}
