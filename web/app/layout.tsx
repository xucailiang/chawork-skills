import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Background } from "@/components/layout/Background";
import { AdminPanel } from "@/components/download/AdminPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChaWork - AI 驱动的智能工作流平台",
    template: "%s | ChaWork",
  },
  description: "ChaWork 技能市场 - 浏览、搜索和安装 AI 技能与员工模板",
  openGraph: {
    title: "ChaWork - AI 驱动的智能工作流平台",
    description: "浏览、搜索和安装 AI 技能与数字员工模板。开源、本地优先、为一人公司而建。",
    siteName: "ChaWork",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "ChaWork - AI 驱动的智能工作流平台",
    description: "浏览、搜索和安装 AI 技能与数字员工模板。开源、本地优先、为一人公司而建。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-muted-foreground">
        <Background />
        <Navbar />
        <main className="relative z-[1] flex-1">{children}</main>
        <Footer />
        <AdminPanel />
      </body>
    </html>
  );
}
