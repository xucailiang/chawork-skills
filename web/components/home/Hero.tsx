import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon";

const STEPS = [
  { Icon: FolderSimple, label: "导入资料", sub: "整理项目文档与知识库" },
  { Icon: User, label: "绑定员工", sub: "为任务匹配合适的技能" },
  { Icon: Lightning, label: "自动执行", sub: "AI 接管重复性工作" },
  { Icon: Moon, label: "复盘进化", sub: "每次执行都变得更好" },
];

export function Hero() {
  return (
    <section
      className="hero-grid"
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "160px 0 100px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 80,
        alignItems: "center",
      }}
    >
      {/* Left: content */}
      <div className="fade-up" style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-dim)",
            letterSpacing: "0.04em",
            marginBottom: 32,
            width: "fit-content",
          }}
        >
          开放核心 · 本地优先 · 为一人公司而建
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(2.6rem, 5.5vw, 4.6rem)",
            letterSpacing: "-0.04em",
            color: "var(--text-hi)",
            lineHeight: 1.06,
            marginBottom: 24,
          }}
        >
          一个人的公司，
          <br />
          也需要一支<span style={{ color: "var(--amber)" }}>团队</span>。
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-dim)",
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: "48ch",
          }}
        >
          ChaWork 将 AI 封装为可长期运行的工作 runtime。导入资料 - 绑定业务员工 - 执行 - 复盘 - 进化。让每一次工作都沉淀为下一次更好的执行方式。
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/market/skills" className="btn btn--primary">
            <span>探索技能市场</span>
            <ArrowRight size={15} weight="bold" />
          </Link>
          <Link href="/download" className="btn btn--ghost">
            下载桌面端
          </Link>
        </div>
      </div>

      {/* Right: instrumentation */}
      <div
        className="fade-up"
        style={{
          animationDelay: "0.2s",
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {STEPS.map(({ Icon, label, sub }, i) => (
          <div key={label} style={{ display: "contents" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 0",
                borderBottom: i < STEPS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <Icon size={24} weight="regular" style={{ color: i === 0 ? "var(--amber)" : "var(--text-dim)", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-hi)", fontSize: "0.95rem" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 2 }}>
                  {sub}
                </div>
              </div>
              {i === 0 && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "0.6rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--amber)",
                  background: "var(--amber-dim)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  flexShrink: 0,
                }}>
                  当前
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
