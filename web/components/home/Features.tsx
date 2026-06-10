"use client";

import { PuzzlePiece, Users, Globe, LinkSimple } from "@phosphor-icons/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const FEATURES = [
  {
    Icon: PuzzlePiece,
    title: "技能模块化",
    desc: "每个 AI 技能独立封装为 SKILL.md，可自由组合搭配，形成稳定的工作流积木。",
    variant: "large",
  },
  {
    Icon: Users,
    title: "数字员工",
    desc: "将多个技能组合为一个角色模板，一键安装后获得专属工作助手。",
    variant: "small",
  },
  {
    Icon: Globe,
    title: "翻译与分类",
    desc: "把上游技能转成中文归档，按职业白名单归类，降低筛选成本。",
    variant: "small",
  },
  {
    Icon: LinkSimple,
    title: "开源生态",
    desc: "对接 GitHub 开源仓库，持续导入社区技能，与全球开发者同步。",
    variant: "large",
  },
];

export function Features() {
  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "0 0 100px",
      }}
    >
      {/* Section head */}
      <ScrollReveal>
        <div className="section-head">
          <h2 className="section-head__title">
            从技能供应链
            <br />
            到可安装员工模板
          </h2>
          <p className="section-head__desc">
            不是一次性展示页，而是把上游技能、中文归档、职业分类和安装协议组织成一条可维护链路。
          </p>
        </div>
      </ScrollReveal>

      {/* Asymmetric bento grid */}
      <ScrollReveal delay={0.1}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {FEATURES.map(({ Icon, title, desc, variant }, i) => (
          <div
            key={title}
            className="feat-card"
            style={{
              background: i === 0
                ? "linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 50%)"
                : i === 3
                  ? "linear-gradient(225deg, rgba(255,255,255,0.015) 0%, transparent 50%)"
                  : "var(--bg-card)",
              padding: variant === "large" ? "48px 40px" : "36px 28px",
              transition: "background 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Icon
              size={variant === "large" ? 32 : 28}
              weight="duotone"
              style={{
                color: i === 0 ? "var(--amber)" : i === 3 ? "var(--cyan)" : "var(--text-dim)",
                marginBottom: 16,
              }}
            />
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: variant === "large" ? "1.25rem" : "1.1rem",
                fontWeight: 650,
                color: "var(--text-hi)",
                marginBottom: 8,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-body)",
                lineHeight: 1.6,
                maxWidth: "42ch",
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>
      </ScrollReveal>

    </section>
  );
}
