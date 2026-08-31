"use client";

import { useEffect } from "react";
import Link from "next/link";
import { startLogin, useSession } from "@/lib/client-auth";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CreatedContentList } from "@/components/dashboard/created-content-list";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { KnowledgeSubscriptionList } from "@/components/dashboard/knowledge-subscription-list";
import { DigestSubscriptionList } from "@/components/dashboard/digest-subscription-list";
import { PushHistory } from "@/components/dashboard/push-history";
import { Button } from "@/components/ui/button";
import { PageHeader, WorkbenchPanel } from "@/components/ui/workbench";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      startLogin();
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="workbench-panel flex min-h-[220px] items-center justify-center">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8">
      <PageHeader
        title="我的 DailyBits"
        description="查看自己创建和订阅的内容，跟踪推送进度与答题情况。"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href="/knowledge/new" />}
              nativeButton={false}
            >
              创建知识库
            </Button>
            <Button render={<Link href="/bank/new" />} nativeButton={false}>
              创建题库
            </Button>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <section className="min-w-0 space-y-5">
          <StatsCards />
          <CreatedContentList />
          <WorkbenchPanel>
            <DigestSubscriptionList />
          </WorkbenchPanel>
          <WorkbenchPanel>
            <PushHistory />
          </WorkbenchPanel>
        </section>
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
          <WorkbenchPanel>
            <SubscriptionList />
          </WorkbenchPanel>
          <WorkbenchPanel>
            <KnowledgeSubscriptionList />
          </WorkbenchPanel>
        </aside>
      </div>
    </div>
  );
}
