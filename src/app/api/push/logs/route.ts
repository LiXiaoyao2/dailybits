import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPushHistoryPage } from "@/lib/push/history";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const take = page * PAGE_SIZE;
    const [questionLogs, questionTotal, knowledgeLogs, knowledgeTotal] = await Promise.all([
      prisma.pushLog.findMany({
        where: { targetType: "USER", targetId: session.user.id },
        orderBy: { pushedAt: "desc" },
        take,
        select: {
          pushedAt: true,
          question: {
            select: {
              content: true,
              correctAnswer: true,
              bank: { select: { title: true } },
            },
          },
        },
      }),
      prisma.pushLog.count({
        where: { targetType: "USER", targetId: session.user.id },
      }),
      prisma.knowledgePushLog.findMany({
        where: { targetType: "USER", targetId: session.user.id },
        orderBy: { pushedAt: "desc" },
        take,
        select: {
          pushedAt: true,
          contentSnapshot: true,
          knowledgePoint: {
            select: {
              bank: { select: { title: true } },
            },
          },
        },
      }),
      prisma.knowledgePushLog.count({
        where: { targetType: "USER", targetId: session.user.id },
      }),
    ]);

    const history = buildPushHistoryPage({
      questionLogs,
      knowledgeLogs: knowledgeLogs.map((log) => ({
        pushedAt: log.pushedAt,
        contentSnapshot: log.contentSnapshot,
        bank: log.knowledgePoint.bank,
      })),
      page,
      pageSize: PAGE_SIZE,
    });

    return NextResponse.json({
      logs: history.logs,
      total: questionTotal + knowledgeTotal,
      page,
      totalPages: Math.ceil((questionTotal + knowledgeTotal) / PAGE_SIZE),
    });
  } catch (error) {
    console.error("[GET /api/push/logs]", error);
    return NextResponse.json(
      { error: "Failed to fetch push logs" },
      { status: 500 }
    );
  }
}
