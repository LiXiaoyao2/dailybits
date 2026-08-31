"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpenCheck, CheckCircle2, Users } from "lucide-react";
import { startLogin, useSession } from "@/lib/client-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricLine, PageHeader, WorkbenchPanel } from "@/components/ui/workbench";

interface AdminOverview {
  generatedAt: string;
  timezone: string;
  days: number;
  totals: {
    banks: number;
    questionBanks: number;
    knowledgeBanks: number;
    questions: number;
    knowledgePoints: number;
    activeSubscriptions: number;
    subscriptions: number;
    periodAnswers: number;
    periodAnswerers: number;
    todayAnswers: number;
    todayAnswerers: number;
    todayAccuracy: number;
  };
  daily: Array<{
    date: string;
    answers: number;
    answerers: number;
    correctAnswers: number;
    accuracy: number;
  }>;
  topBanks: Array<{
    id: string;
    title: string;
    questionCount: number;
    subscriberCount: number;
    answers: number;
    answerers: number;
    correctAnswers: number;
    accuracy: number;
  }>;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      startLogin();
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isAdmin) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/overview?days=${days}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data?.totals) setOverview(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [days, session?.user?.isAdmin, status]);

  const maxAnswers = useMemo(
    () => Math.max(1, ...(overview?.daily.map((item) => item.answers) ?? [1])),
    [overview?.daily],
  );

  if (status === "loading" || loading) {
    return (
      <div className="workbench-panel flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        加载总览中...
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="page-enter workbench-panel p-6">
        <h1 className="text-xl font-semibold">需要管理员权限</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前账号没有访问总览的权限。
        </p>
      </div>
    );
  }

  const totals = overview?.totals;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="DailyBits 使用情况"
        description="跟踪内容规模、活跃订阅、答题人数和题库使用排行。"
        action={
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((value) => (
              <Button
                key={value}
                variant={days === value ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(value)}
              >
                {value} 天
              </Button>
            ))}
          </div>
        }
      />

      <div className="metric-strip grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricLine
          icon={BookOpenCheck}
          label="内容库"
          value={formatNumber(totals?.banks ?? 0)}
          detail={`题库 ${formatNumber(totals?.questionBanks ?? 0)}，知识库 ${formatNumber(totals?.knowledgeBanks ?? 0)}`}
        />
        <MetricLine
          icon={BarChart3}
          label="题目与知识点"
          value={formatNumber((totals?.questions ?? 0) + (totals?.knowledgePoints ?? 0))}
          detail={`题目 ${formatNumber(totals?.questions ?? 0)}，知识点 ${formatNumber(totals?.knowledgePoints ?? 0)}`}
          tone="ink"
        />
        <MetricLine
          icon={Users}
          label="今日答题人数"
          value={formatNumber(totals?.todayAnswerers ?? 0)}
          detail={`${formatNumber(totals?.todayAnswers ?? 0)} 次答题，正确率 ${totals?.todayAccuracy ?? 0}%`}
          tone="accent"
        />
        <MetricLine
          icon={CheckCircle2}
          label={`最近 ${days} 天答题`}
          value={formatNumber(totals?.periodAnswers ?? 0)}
          detail={`${formatNumber(totals?.periodAnswerers ?? 0)} 人参与，活跃订阅 ${formatNumber(totals?.activeSubscriptions ?? 0)}`}
          tone="citrine"
        />
      </div>

      <WorkbenchPanel>
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-0 pt-0">
          <CardTitle className="text-lg">每日答题趋势</CardTitle>
          <Badge variant="outline">{overview?.timezone ?? "Asia/Shanghai"}</Badge>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="flex h-52 items-end gap-3 overflow-x-auto pb-2">
            {overview?.daily.map((item) => (
              <div key={item.date} className="flex min-w-16 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end justify-center border-b border-border px-2">
                  <div
                    className={
                      item.answers > 0
                        ? "w-full max-w-14 rounded-t bg-primary"
                        : "h-0.5 w-full max-w-14 rounded-full bg-border"
                    }
                    style={
                      item.answers > 0
                        ? { height: `${Math.max(4, (item.answers / maxAnswers) * 128)}px` }
                        : undefined
                    }
                    tabIndex={0}
                    aria-label={`${item.date}，${item.answers} 次答题，${item.answerers} 人参与，正确率 ${item.accuracy}%`}
                    title={`${item.date}，${item.answers} 次，${item.answerers} 人`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{item.date.slice(5)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.answerers} 人
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </WorkbenchPanel>

      <WorkbenchPanel>
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg">题库使用量排行</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {overview?.topBanks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">题库</th>
                    <th className="pb-2 font-medium">答题人数</th>
                    <th className="pb-2 font-medium">答题次数</th>
                    <th className="pb-2 font-medium">正确率</th>
                    <th className="pb-2 font-medium">订阅</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.topBanks.map((bank) => (
                    <tr key={bank.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link href={`/bank/${bank.id}`} className="font-medium hover:underline">
                          {bank.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {bank.questionCount} 题
                        </p>
                      </td>
                      <td className="py-3">{formatNumber(bank.answerers)}</td>
                      <td className="py-3">{formatNumber(bank.answers)}</td>
                      <td className="py-3">{bank.accuracy}%</td>
                      <td className="py-3">{formatNumber(bank.subscriberCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              最近 {days} 天还没有答题事件。
            </p>
          )}
        </CardContent>
      </WorkbenchPanel>
    </div>
  );
}
