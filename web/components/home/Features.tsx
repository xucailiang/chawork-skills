import { Blocks, Users, Sparkles, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Blocks,
    title: "技能模块化",
    description: "每个 AI 技能独立封装为 SKILL.md，可自由组合搭配，像乐高一样构建工作流。",
  },
  {
    icon: Users,
    title: "数字员工",
    description: "将多个技能组合为一个角色模板，一键安装即获得专属 AI 助手。",
  },
  {
    icon: Sparkles,
    title: "智能分类",
    description: "LLM 自动翻译和职业分类，覆盖 35 个职业领域，轻松找到所需技能。",
  },
  {
    icon: Globe,
    title: "开源生态",
    description: "对接 GitHub 开源仓库，一键导入社区技能，持续扩展技能库。",
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">核心能力</h2>
          <p className="mt-4 text-muted-foreground">
            从技能到员工，从个人到团队，ChaWork 为你提供完整的 AI 工作流解决方案
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-xl border border-border p-6 transition-colors hover:bg-muted/50"
            >
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
