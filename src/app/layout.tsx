import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyBits - 学习推送",
  description: "支持 AI 自动化解析、多时段精准推送的碎片化知识刷题平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <template
          data-impeccable-direction="2138cb91"
          dangerouslySetInnerHTML={{
            __html:
              "<!-- THESIS: DailyBits is a content discovery desk for scheduled learning, refusing the decorative SaaS hero and admin-console metric wall. OWN-WORLD: clear white work surfaces, ink active states, cobalt focus, compact tabs, real cards, and restrained environment light. STORY: users choose a content type, search, inspect real activity, subscribe, or create material without reading instructions. FIRST VIEWPORT: a short command bar sits above a horizontal channel switcher and live content stream. FORM: code-led impeccable refresh informed by open-source knowledge and newsletter products, preserving routes and behavior. FINISH: unreviewed and undocumented is unfinished; this build ends with screenshots, detector, validation, and DESIGN.md kept in sync. -->",
          }}
        />
        <Providers>
          <div className="app-stage flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto box-border w-full min-w-0 max-w-[1320px] flex-1 px-4 py-5 sm:px-6 lg:py-6">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
