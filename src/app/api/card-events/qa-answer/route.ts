import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function boolField(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.CARD_SERVICE_EVENT_SECRET?.trim();
  if (!expected) return process.env.AUTH_MODE === "dev" || process.env.NODE_ENV !== "production";
  const headerName = process.env.CARD_SERVICE_EVENT_SECRET_HEADER?.trim() || "X-Card-Event-Secret";
  const supplied = request.headers.get(headerName) ?? "";
  return safeCompare(supplied, expected);
}

function normalizeAnswer(value: string): string {
  const normalized = value.trim().toLowerCase();
  return /^[a-d]$/.test(normalized) ? normalized : "";
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const cardId = stringField(body.card_id ?? body.cardId);
    const receiver = stringField(body.receiver);
    const respondentId = stringField(body.account_id ?? body.accountId ?? body.respondentId);
    const questionId = stringField(body.business_id ?? body.businessId ?? body.questionId);
    const selectedAnswer = normalizeAnswer(
      stringField(body.selected_answer ?? body.selectedAnswer),
    );
    const suppliedCorrectAnswer = normalizeAnswer(
      stringField(body.correct_answer ?? body.correctAnswer),
    );
    const answeredAtRaw = stringField(body.answered_at ?? body.answeredAt);
    const sourceSystem = stringField(body.source_system ?? body.sourceSystem) || "card-service";

    if (!cardId || !receiver || !respondentId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: "card_id, receiver, account_id, business_id and selected_answer are required" },
        { status: 400 },
      );
    }

    const answeredAt = answeredAtRaw ? new Date(answeredAtRaw) : new Date();
    if (Number.isNaN(answeredAt.getTime())) {
      return NextResponse.json({ error: "answered_at is invalid" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, bankId: true, correctAnswer: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const correctAnswer =
      suppliedCorrectAnswer || normalizeAnswer(question.correctAnswer) || question.correctAnswer;
    const suppliedCorrect = boolField(body.is_correct ?? body.isCorrect);
    const isCorrect =
      suppliedCorrect ?? (normalizeAnswer(correctAnswer) === selectedAnswer);

    const event = await prisma.questionAnswerEvent.upsert({
      where: {
        cardId_respondentId: {
          cardId,
          respondentId,
        },
      },
      create: {
        cardId,
        receiver,
        respondentId,
        questionId: question.id,
        bankId: question.bankId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        answeredAt,
        sourceSystem,
      },
      update: {},
    });

    return NextResponse.json({
      ok: true,
      id: event.id,
      bankId: question.bankId,
      questionId: question.id,
    });
  } catch (error) {
    console.error("[POST /api/card-events/qa-answer]", error);
    return NextResponse.json(
      { error: "Failed to record QA answer event" },
      { status: 500 },
    );
  }
}
