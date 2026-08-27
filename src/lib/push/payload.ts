import type { PushPayload } from "../../types";

type PushQuestion = {
  content: string;
  options: unknown;
  correctAnswer: string;
  explanation: string;
};

type PushPayloadMeta = {
  authorId?: string;
  businessId?: string;
  domain?: string;
  scene?: string;
};

export function buildPayload(
  receiver: string,
  title: string,
  question: PushQuestion,
  meta: PushPayloadMeta = {},
): PushPayload {
  return {
    receiver,
    title,
    question: question.content,
    options: question.options as string[],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    ...meta,
  };
}
