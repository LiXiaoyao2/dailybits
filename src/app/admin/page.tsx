"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { BarChart3, BookOpenCheck, CheckCircle2, Users } from "lucide-react";
import { startLogin, useSession } from "@/lib/client-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        加载总览中...
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="page-enter rounded-lg border border-border bg-card p-6">
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">管理员总览</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            DailyBits 使用情况
          </h1>
        </div>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={BookOpenCheck}
          label="内容库"
          value={formatNumber(totals?.banks ?? 0)}
          detail={`题库 ${formatNumber(totals?.questionBanks ?? 0)} · 知识库 ${formatNumber(totals?.knowledgeBanks ?? 0)}`}
        />
        <MetricCard
          icon={BarChart3}
          label="题目与知识点"
          value={formatNumber((totals?.questions ?? 0) + (totals?.knowledgePoints ?? 0))}
          detail={`题目 ${formatNumber(totals?.questions ?? 0)} · 知识点 ${formatNumber(totals?.knowledgePoints ?? 0)}`}
        />
        <MetricCard
          icon={Users}
          label="今日答题人数"
          value={formatNumber(totals?.todayAnswerers ?? 0)}
          detail={`${formatNumber(totals?.todayAnswers ?? 0)} 次答题 · 正确率 ${totals?.todayAccuracy ?? 0}%`}
        />
        <MetricCard
          icon={CheckCircle2}
          label={`最近 ${days} 天答题`}
          value={formatNumber(totals?.periodAnswers ?? 0)}
          detail={`${formatNumber(totals?.periodAnswerers ?? 0)} 人参与 · 活跃订阅 ${formatNumber(totals?.activeSubscriptions ?? 0)}`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">每日答题趋势</CardTitle>
          <Badge variant="outline">{overview?.timezone ?? "Asia/Shanghai"}</Badge>
        </CardHeader>
        <CardContent>
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
                    title={`${item.date} · ${item.answers} 次 · ${item.answerers} 人`}
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">题库使用量排行</CardTitle>
        </CardHeader>
        <CardContent>
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
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-muted-foreground">{label}</span>
          <span className="mt-1 block text-2xl font-semibold text-foreground">
            {value}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {detail}
          </span>
        </span>
      </CardContent>
    </Card>
  );
}
