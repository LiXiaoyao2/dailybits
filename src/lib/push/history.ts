const DEFAULT_EXCERPT_LENGTH = 80;

type QuestionLog = {
  pushedAt: Date;
  question: {
    content: string;
    correctAnswer: string;
    bank: { title: string };
  };
};

type KnowledgeLog = {
  pushedAt: Date;
  contentSnapshot: string;
  bank: { title: string };
};

export type PushHistoryItem = {
  kind: "question" | "knowledge";
  pushedAt: Date;
  bankName: string;
  questionExcerpt: string;
  correctAnswer: string | null;
};

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export function buildPushHistoryPage(input: {
  questionLogs: QuestionLog[];
  knowledgeLogs: KnowledgeLog[];
  page: number;
  pageSize: number;
  excerptLength?: number;
}): {
  logs: PushHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
} {
  const pageSize = Math.max(1, Math.floor(input.pageSize));
  const page = Math.max(1, Math.floor(input.page));
  const excerptLength = input.excerptLength ?? DEFAULT_EXCERPT_LENGTH;
  const logs: PushHistoryItem[] = [
    ...input.questionLogs.map((log) => ({
      kind: "question" as const,
      pushedAt: log.pushedAt,
      bankName: log.question.bank.title,
      questionExcerpt: truncate(log.question.content, excerptLength),
      correctAnswer: log.question.correctAnswer,
    })),
    ...input.knowledgeLogs.map((log) => ({
      kind: "knowledge" as const,
      pushedAt: log.pushedAt,
      bankName: log.bank.title,
      questionExcerpt: truncate(log.contentSnapshot, excerptLength),
      correctAnswer: null,
    })),
  ].sort((a, b) => b.pushedAt.getTime() - a.pushedAt.getTime());

  const total = logs.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    logs: logs.slice(start, start + pageSize),
    total,
    page,
    totalPages,
  };
}
