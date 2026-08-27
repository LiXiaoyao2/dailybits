import { NextRequest, NextResponse } from "next/server";
import { isAdminSession, getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Shanghai";

function clampDays(value: string | null): number {
  const parsed = Number(value ?? 7);
  if (!Number.isFinite(parsed)) return 7;
  return Math.max(1, Math.min(90, Math.trunc(parsed)));
}

function dayKey(date: Date, timeZone = DEFAULT_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const days = clampDays(request.nextUrl.searchParams.get("days"));
    const now = new Date();
    const since = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const [
      questionBankCount,
      knowledgeBankCount,
      questionCount,
      knowledgePointCount,
      activeSubscriptionCount,
      allSubscriptionCount,
      periodEvents,
    ] = await Promise.all([
      prisma.questionBank.count(),
      prisma.knowledgeBank.count(),
      prisma.question.count(),
      prisma.knowledgePoint.count(),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.subscription.count(),
      prisma.questionAnswerEvent.findMany({
        where: { answeredAt: { gte: since } },
        select: {
          bankId: true,
          respondentId: true,
          isCorrect: true,
          answeredAt: true,
          bank: {
            select: {
              id: true,
              title: true,
              subscriberCount: true,
              _count: { select: { questions: true } },
            },
          },
        },
      }),
    ]);

    const daily = new Map<
      string,
      { answers: number; correct: number; answerers: Set<string> }
    >();
    const today = dayKey(now);
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
      daily.set(dayKey(date), { answers: 0, correct: 0, answerers: new Set() });
    }

    const bankUsage = new Map<
      string,
      {
        id: string;
        title: string;
        questionCount: number;
        subscriberCount: number;
        answers: number;
        correct: number;
        answerers: Set<string>;
      }
    >();
    const periodAnswerers = new Set<string>();

    for (const event of periodEvents) {
      const key = dayKey(event.answeredAt);
      const bucket = daily.get(key) ?? { answers: 0, correct: 0, answerers: new Set() };
      bucket.answers += 1;
      if (event.isCorrect) bucket.correct += 1;
      bucket.answerers.add(event.respondentId);
      daily.set(key, bucket);
      periodAnswerers.add(event.respondentId);

      const bank = event.bank;
      const usage = bankUsage.get(event.bankId) ?? {
        id: bank.id,
        title: bank.title,
        questionCount: bank._count.questions,
        subscriberCount: bank.subscriberCount,
        answers: 0,
        correct: 0,
        answerers: new Set<string>(),
      };
      usage.answers += 1;
      if (event.isCorrect) usage.correct += 1;
      usage.answerers.add(event.respondentId);
      bankUsage.set(event.bankId, usage);
    }

    const todayBucket = daily.get(today) ?? {
      answers: 0,
      correct: 0,
      answerers: new Set<string>(),
    };

    return NextResponse.json({
      generatedAt: now.toISOString(),
      timezone: DEFAULT_TIMEZONE,
      days,
      totals: {
        questionBanks: questionBankCount,
        knowledgeBanks: knowledgeBankCount,
        banks: questionBankCount + knowledgeBankCount,
        questions: questionCount,
        knowledgePoints: knowledgePointCount,
        activeSubscriptions: activeSubscriptionCount,
        subscriptions: allSubscriptionCount,
        periodAnswers: periodEvents.length,
        periodAnswerers: periodAnswerers.size,
        todayAnswers: todayBucket.answers,
        todayAnswerers: todayBucket.answerers.size,
        todayAccuracy: pct(todayBucket.correct, todayBucket.answers),
      },
      daily: [...daily.entries()].map(([date, value]) => ({
        date,
        answers: value.answers,
        answerers: value.answerers.size,
        correctAnswers: value.correct,
        accuracy: pct(value.correct, value.answers),
      })),
      topBanks: [...bankUsage.values()]
        .sort((a, b) => b.answers - a.answers || b.answerers.size - a.answerers.size)
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          title: item.title,
          questionCount: item.questionCount,
          subscriberCount: item.subscriberCount,
          answers: item.answers,
          answerers: item.answerers.size,
          correctAnswers: item.correct,
          accuracy: pct(item.correct, item.answers),
        })),
    });
  } catch (error) {
    console.error("[GET /api/admin/overview]", error);
    return NextResponse.json(
      { error: "Failed to fetch admin overview" },
      { status: 500 },
    );
  }
}
