import "dotenv/config";
import cron from "node-cron";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { TargetType, EndCondition } from "../generated/prisma/client.js";
import Holidays from "date-holidays";
import { runDueDigestSubscriptions } from "../lib/digest/delivery.js";
import { runDueKnowledgeSubscriptions } from "../lib/knowledge/delivery.js";
import { pushToTarget } from "../lib/push/adapter.js";
import { buildPayload } from "../lib/push/payload.js";
import { isoWeekdayInTimeZone } from "../lib/subscriptions/schedule.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const holidayCalendar = new Holidays(process.env.HOLIDAY_COUNTRY ?? "CN");
const skipNonWorkingDays = process.env.SKIP_NON_WORKING_DAYS !== "false";
const schedulerTZ = process.env.SCHEDULER_TIMEZONE ?? "Asia/Shanghai";

function getCurrentTimeHHMM(): string {
  const now = new Date();
  const formatted = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: schedulerTZ,
    hour12: false,
  });
  return formatted;
}

function shouldSkipPushToday(date: Date): {
  skip: boolean;
  reason?: "weekend" | "holiday";
  holidayName?: string;
} {
  if (!skipNonWorkingDays) {
    return { skip: false };
  }

  const dayStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: schedulerTZ,
  });
  if (dayStr === "Sat" || dayStr === "Sun") {
    return { skip: true, reason: "weekend" };
  }

  const holiday = holidayCalendar.isHoliday(date);
  if (holiday) {
    const holidays = Array.isArray(holiday) ? holiday : [holiday];
    return {
      skip: true,
      reason: "holiday",
      holidayName: (holidays[0] as { name?: string })?.name ?? "Unknown holiday",
    };
  }

  return { skip: false };
}

async function selectQuestion(
  targetType: TargetType,
  targetId: string,
  bankId: string,
) {
  const unpushed = await prisma.question.findFirst({
    where: {
      bankId,
      status: "PUBLISHED",
      pushLogs: { none: { targetType, targetId } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (unpushed) return unpushed;
  return null;
}

async function handleSubscriptionComplete(sub: {
  id: string;
  targetType: TargetType;
  targetId: string;
  bankId: string;
  endCondition: EndCondition;
  repeatCount: number;
  currentCycle: number;
}): Promise<boolean> {
  if (
    sub.endCondition === "REPEAT_N_TIMES" &&
    sub.currentCycle < sub.repeatCount
  ) {
    await prisma.$transaction([
      prisma.pushLog.deleteMany({
        where: {
          targetType: sub.targetType,
          targetId: sub.targetId,
          question: { bankId: sub.bankId },
        },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: { currentCycle: { increment: 1 } },
      }),
    ]);
    console.log(
      `[Scheduler] Cycle ${sub.currentCycle + 1}/${sub.repeatCount} for ${sub.targetType}:${sub.targetId}, resetting push logs`
    );
    return true;
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { isActive: false },
  });
  console.log(
    `[Scheduler] Subscription ${sub.id} completed, deactivated`
  );
  return false;
}

async function resolveReceiver(
  targetType: TargetType,
  targetId: string,
): Promise<string> {
  if (targetType === "GROUP") {
    return targetId;
  }
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { uid: true },
  });
  return user?.uid ?? targetId;
}

function shouldRunFixedBankScheduleToday(
  bank: {
    subscriptionScheduleMode: string;
    subscriptionCadence: string;
    subscriptionWeekdays: number[];
  },
  date: Date,
): boolean {
  if (bank.subscriptionScheduleMode !== "FIXED") return true;
  if (bank.subscriptionCadence !== "WEEKLY") return true;
  const weekdays = bank.subscriptionWeekdays.length
    ? bank.subscriptionWeekdays
    : [1];
  return weekdays.includes(isoWeekdayInTimeZone(date, schedulerTZ));
}

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentTime = getCurrentTimeHHMM();
  console.log(`[Scheduler] Tick at ${currentTime}`);

  const skipDecision = shouldSkipPushToday(now);
  if (skipDecision.skip) {
    if (skipDecision.reason === "holiday") {
      console.log(
        `[Scheduler] Skip all pushes on holiday: ${skipDecision.holidayName ?? "Unknown holiday"}`
      );
    } else {
      console.log("[Scheduler] Skip all pushes on weekend");
    }
    return;
  }

  await runDueDigestSubscriptions(prisma, currentTime, schedulerTZ);
  await runDueKnowledgeSubscriptions(prisma, currentTime, schedulerTZ);

  const matchedSubs = await prisma.subscription.findMany({
    where: {
      isActive: true,
      OR: [
        {
          pushTimes: { has: currentTime },
          bank: { subscriptionScheduleMode: "CUSTOM" },
        },
        {
          bank: {
            subscriptionScheduleMode: "FIXED",
            subscriptionPushTimes: { has: currentTime },
          },
        },
      ],
    },
    include: { bank: true },
  });

  for (const sub of matchedSubs) {
    try {
      if (!shouldRunFixedBankScheduleToday(sub.bank, now)) continue;

      let question = await selectQuestion(sub.targetType, sub.targetId, sub.bankId);

      if (!question) {
        const continued = await handleSubscriptionComplete(sub);
        if (continued) {
          question = await selectQuestion(sub.targetType, sub.targetId, sub.bankId);
        }
        if (!question) continue;
      }

      const receiver = await resolveReceiver(sub.targetType, sub.targetId);
      const payload = buildPayload(receiver, sub.bank.title, question, {
        authorId: sub.subscriberId ?? sub.targetId,
        businessId: question.id,
        domain: sub.bank.title,
        scene: "daily-question",
      });
      const success = await pushToTarget({
        ...payload,
        receiver,
        options: question.options as string[],
      });
      if (success) {
        await prisma.pushLog.create({
          data: {
            targetType: sub.targetType,
            targetId: sub.targetId,
            questionId: question.id,
          },
        });
        console.log(
          `[Scheduler] Pushed to ${sub.targetType}:${sub.targetId}`
        );
      }
    } catch (err) {
      console.error(`[Scheduler] Error for subscription ${sub.id}:`, err);
    }
  }
});

console.log("[Scheduler] Started. Checking every minute...");
