"use client";

import { GatewaySessionProvider } from "@/lib/client-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return <GatewaySessionProvider>{children}</GatewaySessionProvider>;
}
