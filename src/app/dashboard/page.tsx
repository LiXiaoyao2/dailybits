"use client";

import { useEffect } from "react";
import { startLogin, useSession } from "@/lib/client-auth";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CreatedContentList } from "@/components/dashboard/created-content-list";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { KnowledgeSubscriptionList } from "@/components/dashboard/knowledge-subscription-list";
import { DigestSubscriptionList } from "@/components/dashboard/digest-subscription-list";
import { PushHistory } from "@/components/dashboard/push-history";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      startLogin();
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8">
      <h1 className="font-serif text-3xl font-semibold tracking-wide text-foreground">我的书房</h1>
      <StatsCards />
      <CreatedContentList />
      <SubscriptionList />
      <KnowledgeSubscriptionList />
      <DigestSubscriptionList />
      <PushHistory />
    </div>
  );
}
