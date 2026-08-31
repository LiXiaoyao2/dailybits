import { notFound } from "next/navigation";
import { GroupDashboard } from "@/components/group/group-dashboard";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params;

  if (!/^\d+$/.test(groupId)) {
    notFound();
  }

  return (
    <div className="page-enter space-y-6">
      <header className="page-hero space-y-1">
        <h1 className="text-3xl font-semibold">
          群组看板
        </h1>
        <p className="text-muted-foreground">
          管理群组的答题练习、知识卡片和资讯摘要推送。
        </p>
      </header>
      <GroupDashboard groupId={groupId} />
    </div>
  );
}
