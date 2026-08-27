import {
  BarChart3,
  BookOpenCheck,
  Brain,
  MessageCircle,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { BankExplorer } from "@/components/bank/bank-explorer";
import { DigestSubscriptionList } from "@/components/dashboard/digest-subscription-list";
import { KnowledgeExplorer } from "@/components/knowledge/knowledge-explorer";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const channels = [
  {
    label: "答题练习",
    value: "banks",
    icon: BookOpenCheck,
    copy: "用题目保持手感",
    detail: "订阅公开或部门题库，按固定节奏答题。",
  },
  {
    label: "知识卡片",
    value: "knowledge",
    icon: Brain,
    copy: "把长内容拆成每日片段",
    detail: "把文档、文章和经验沉淀成可持续推送的短知识。",
  },
  {
    label: "资讯摘要",
    value: "digests",
    icon: Newspaper,
    copy: "固定时间看重点动态",
    detail: "AI 新闻、GitHub 趋势和论文摘要统一订阅。",
  },
];

export default function Home() {
  const groupChatId = process.env.GROUP_CHAT_ID?.trim();

  return (
    <div className="page-enter space-y-6">
      <section className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              DailyBits 内容中心
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              内容发现
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              订阅题库、知识卡片和 AI 资讯，在固定节奏里持续更新一点有用内容。
            </p>
            {groupChatId ? (
              <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="size-4 shrink-0" aria-hidden />
                <span className="shrink-0 text-foreground">交流群</span>
                <span className="truncate font-mono">{groupChatId}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              <BarChart3 className="size-4" aria-hidden />
              我的内容
            </Button>
          </div>
        </div>
      </section>

      <Tabs defaultValue="banks" className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start gap-2 rounded-none p-0 sm:w-auto sm:gap-6"
          >
            {channels.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="h-11 min-w-0 flex-1 rounded-none border-0 px-2 sm:flex-none sm:px-0"
                >
                  <Icon className="size-4" aria-hidden />
                  <span>{item.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="banks" className="space-y-4">
          <ChannelIntro channel={channels[0]} />
          <BankExplorer />
        </TabsContent>
        <TabsContent value="knowledge" className="space-y-4">
          <ChannelIntro channel={channels[1]} />
          <KnowledgeExplorer />
        </TabsContent>
        <TabsContent value="digests" className="space-y-4">
          <ChannelIntro channel={channels[2]} />
          <DigestSubscriptionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelIntro({
  channel,
}: {
  channel: (typeof channels)[number];
}) {
  const Icon = channel.icon;
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm leading-6 text-muted-foreground">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="shrink-0 font-medium text-foreground">
        {channel.label}
      </span>
      <span className="min-w-0 truncate">{channel.detail}</span>
    </div>
  );
}
