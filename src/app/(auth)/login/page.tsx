"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { startLogin } from "@/lib/client-auth";

export default function LoginPage() {
  return (
    <div className="page-enter flex min-h-[58vh] items-center justify-center">
      <Card className="w-full max-w-md border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              统一认证入口
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              DailyBits 不再处理 OAuth 登录。请通过公司 Auth Hub 保护的正式域名访问。
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={startLogin}>
            重新进入认证
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
