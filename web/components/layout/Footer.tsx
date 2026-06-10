"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid var(--border)",
        padding: "36px 0",
      }}
    >
      <div
        style={{
          width: "min(1320px, 92%)",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 650,
              color: "var(--text-hi)",
            }}
          >
            <Image src="/logo.png" alt="ChaWork" width={20} height={20} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
            ChaWork
          </span>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-dim)",
              marginTop: 4,
            }}
          >
            开放核心 · 本地优先 · 为一人公司而建的 AI 工作助手。
          </p>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          <a
            href="https://github.com/xucailiang/chawork"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text-dim)",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "color 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-hi)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
          >
            GitHub
          </a>
          <Link
            href="/market/skills"
            style={{
              color: "var(--text-dim)",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "color 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-hi)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
          >
            技能市场
          </Link>
          <Link
            href="/market/employees"
            style={{
              color: "var(--text-dim)",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "color 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-hi)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
          >
            员工市场
          </Link>
        </div>
      </div>

    </footer>
  );
}
