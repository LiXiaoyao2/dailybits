"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarClock, FileText, LockKeyhole, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DepartmentSelector,
  type SelectedDepartment,
} from "@/components/bank/department-selector";
import {
  SubscriptionScheduleForm,
  defaultScheduleDraft,
  type ScheduleDraft,
} from "@/components/bank/subscription-schedule-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, WorkbenchPanel } from "@/components/ui/workbench";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatSubscriptionSchedule } from "@/lib/subscriptions/schedule";

type Visibility = "PRIVATE" | "PUBLIC" | "PARTIAL";

const VISIBILITY_LABELS: Record<Visibility, string> = {
  PRIVATE: "仅自己可见",
  PUBLIC: "全部员工可见",
  PARTIAL: "指定部门可见",
};

const VISIBILITY_SUMMARY: Record<Visibility, string> = {
  PRIVATE: "不会出现在其他人的发现页",
  PUBLIC: "登录员工都可以发现并订阅",
  PARTIAL: "仅命中的部门成员可见",
};

export default function NewBankPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [departments, setDepartments] = useState<SelectedDepartment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDraft>(defaultScheduleDraft);
  const [newScheduleTime, setNewScheduleTime] = useState("09:30");
  const [submitting, setSubmitting] = useState(false);

  const titlePreview = title.trim() || "未命名题库";
  const departmentSummary = useMemo(() => {
    if (visibility !== "PARTIAL") return VISIBILITY_SUMMARY[visibility];
    if (departments.length === 0) return "尚未选择部门";
    return departments.map((item) => item.name).join("、");
  }, [departments, visibility]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("请输入题库标题");
      return;
    }
    if (visibility === "PARTIAL" && departments.length === 0) {
      toast.error("指定部门可见时请至少选择一个部门");
      return;
    }
    if (
      schedule.subscriptionScheduleMode === "FIXED" &&
      schedule.subscriptionPushTimes.length === 0
    ) {
      toast.error("请至少设置一个固定推送时间");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
          visibleDepartments:
            visibility === "PARTIAL" ? departments.map((item) => item.id) : [],
          visibleDepartmentNames:
            visibility === "PARTIAL" ? departments.map((item) => item.name) : [],
          ...schedule,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "创建失败");
        return;
      }
      toast.success("题库已创建");
      router.push(`/bank/${data.id}/edit`);
    } catch {
      toast.error("创建失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="创建题库"
        description="配置可见范围和订阅节奏，创建后进入题目管理。"
        action={
          <Button type="submit" form="new-bank-form" disabled={submitting}>
            {submitting ? "创建中..." : "创建并进入题目管理"}
          </Button>
        }
      />

      <form
        id="new-bank-form"
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <WorkbenchPanel className="space-y-5">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h2 className="text-base font-semibold">基础信息</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如 AI 工程基础每日练习"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>可见范围</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as Visibility)}
                >
                  <SelectTrigger>
                    <SelectValue>{VISIBILITY_LABELS[visibility]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">仅自己可见</SelectItem>
                    <SelectItem value="PUBLIC">全部员工可见</SelectItem>
                    <SelectItem value="PARTIAL">指定部门可见</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="覆盖的主题、适合人群、推送节奏"
                rows={4}
              />
            </div>
          </section>

          {visibility === "PARTIAL" ? (
            <section className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <h2 className="text-base font-semibold">部门范围</h2>
              </div>
              <DepartmentSelector value={departments} onChange={setDepartments} />
            </section>
          ) : null}

          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="text-base font-semibold">订阅节奏</h2>
            </div>
            <SubscriptionScheduleForm
              value={schedule}
              onChange={setSchedule}
              newTime={newScheduleTime}
              onNewTimeChange={setNewScheduleTime}
            />
          </section>
        </WorkbenchPanel>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <WorkbenchPanel>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold" title={titlePreview}>
                  {titlePreview}
                </h2>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {description.trim() || "创建后可导入或 AI 生成题目。"}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                新题库
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <LockKeyhole className="size-4 text-muted-foreground" />
                <span className="min-w-0 truncate">{VISIBILITY_LABELS[visibility]}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="min-w-0 truncate">{departmentSummary}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <span className="min-w-0 truncate">
                  {formatSubscriptionSchedule(schedule)}
                </span>
              </div>
            </div>
          </WorkbenchPanel>
        </aside>
      </form>
    </div>
  );
}
