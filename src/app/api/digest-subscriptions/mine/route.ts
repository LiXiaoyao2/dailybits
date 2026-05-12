import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildDigestSubscriptionCounts } from "@/lib/digest/subscription-counts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscriptions, countRows] = await Promise.all([
      prisma.digestSubscription.findMany({
        where: {
          targetType: "USER",
          targetId: session.user.id,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.digestSubscription.groupBy({
        by: ["digestType"],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      subscriptions,
      subscriberCounts: buildDigestSubscriptionCounts(countRows),
    });
  } catch (error) {
    console.error("[GET /api/digest-subscriptions/mine]", error);
    return NextResponse.json(
      { error: "Failed to fetch digest subscriptions" },
      { status: 500 },
    );
  }
}
