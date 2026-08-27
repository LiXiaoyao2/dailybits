import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isoWeekdayInTimeZone } from "@/lib/subscriptions/schedule";

const DEFAULT_TIMEZONE = "Asia/Shanghai";

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 0);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const wholeSeconds = date.getTime() - (date.getTime() % 1000);
  return zonedAsUtc - wholeSeconds;
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const offset = getTimeZoneOffsetMs(guess, timeZone);
  const utc = new Date(guess.getTime() - offset);
  const adjustedOffset = getTimeZoneOffsetMs(utc, timeZone);
  return new Date(guess.getTime() - adjustedOffset);
}

function getTodayRangeInTimeZone(now: Date, timeZone: string) {
  const parts = getZonedParts(now, timeZone);
  return {
    startOfToday: zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, timeZone),
    endOfToday: zonedTimeToUtc(parts.year, parts.month, parts.day, 23, 59, 59, 999, timeZone),
  };
}

function getDashboardTimeZone(): string {
  const configured = process.env.SCHEDULER_TIMEZONE?.trim() || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configured }).format(new Date());
    return configured;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetType = "USER" as const;
    const targetId = session.user.id;
    const now = new Date();
    const timeZone = getDashboardTimeZone();
    const { startOfToday, endOfToday } = getTodayRangeInTimeZone(now, timeZone);
    const todayWeekday = isoWeekdayInTimeZone(now, timeZone);

    const [
      subscribedCount,
      todayPushed,
      todayTotal,
      createdQuestionBanksCount,
      createdKnowledgeBanksCount,
    ] = await Promise.all([
      prisma.subscription.count({
        where: { targetType, targetId },
      }),
      prisma.pushLog.count({
        where: {
          targetType,
          targetId,
          pushedAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.subscription
        .findMany({
          where: { targetType, targetId, isActive: true },
          select: {
            pushTimes: true,
            bank: {
              select: {
                subscriptionScheduleMode: true,
                subscriptionCadence: true,
                subscriptionWeekdays: true,
                subscriptionPushTimes: true,
              },
            },
          },
        })
        .then((subs) =>
          subs.reduce((sum, sub) => {
            if (sub.bank.subscriptionScheduleMode !== "FIXED") {
              return sum + sub.pushTimes.length;
            }
            const dueToday =
              sub.bank.subscriptionCadence === "DAILY" ||
              (sub.bank.subscriptionWeekdays.length
                ? sub.bank.subscriptionWeekdays
                : [1]
              ).includes(todayWeekday);
            return sum + (dueToday ? sub.bank.subscriptionPushTimes.length : 0);
          }, 0)
        ),
      prisma.questionBank.count({
        where: { creatorId: targetId },
      }),
      prisma.knowledgeBank.count({
        where: { creatorId: targetId },
      }),
    ]);

    return NextResponse.json({
      subscribedCount,
      todayPushed,
      todayTotal,
      createdQuestionBanksCount,
      createdKnowledgeBanksCount,
      createdBanksCount: createdQuestionBanksCount + createdKnowledgeBanksCount,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
