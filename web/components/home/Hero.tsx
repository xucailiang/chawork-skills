import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI 驱动的
            <br />
            <span className="text-primary">智能工作流平台</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            ChaWork 让每个人都能通过 AI 技能组合打造专属数字员工，
            覆盖开发、设计、营销、财务等 35 个职业领域。
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/market/skills"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              浏览技能市场
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              下载桌面端
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
