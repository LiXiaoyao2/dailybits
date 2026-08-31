"use client";

import { useEffect, useState } from "react";
import { BellRing, LibraryBig, Send } from "lucide-react";
import { MetricLine } from "@/components/ui/workbench";

interface Stats {
  subscribedCount: number;
  todayPushed: number;
  todayTotal: number;
  createdQuestionBanksCount: number;
  createdKnowledgeBanksCount: number;
  createdBanksCount: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscribedCount !== undefined) {
          setStats(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="metric-strip grid-cols-1 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="metric-cell animate-pulse">
              <div className="h-10 w-16 rounded bg-muted" />
              <div className="mt-2 h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const s = stats ?? {
    subscribedCount: 0,
    todayPushed: 0,
    todayTotal: 0,
    createdQuestionBanksCount: 0,
    createdKnowledgeBanksCount: 0,
    createdBanksCount: 0,
  };

  return (
    <div className="metric-strip grid-cols-1 sm:grid-cols-3">
      <MetricLine icon={BellRing} label="已订阅" value={s.subscribedCount} tone="primary" />
      <MetricLine
        icon={Send}
        label="今日推送"
        value={`${s.todayPushed} / ${s.todayTotal}`}
        tone="accent"
      />
      <MetricLine
        icon={LibraryBig}
        label="我创建的"
        value={s.createdBanksCount}
        detail={`题库 ${s.createdQuestionBanksCount}，知识库 ${s.createdKnowledgeBanksCount}`}
        tone="ink"
      />
    </div>
  );
}
