"use client";

import Link from "next/link";
import type { HubEmployee } from "@/lib/api";
import { useCallback, useRef } from "react";
import { User, Sparkle } from "@phosphor-icons/react";

export function EmployeeCard({ employee }: { employee: HubEmployee; index?: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Link
      ref={ref}
      href={`/market/employees/${encodeURIComponent(employee.id)}`}
      className="employee-card"
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "background 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {employee.kind === "dream"
            ? <Sparkle size={32} weight="duotone" style={{ color: "var(--amber)" }} />
            : <User size={32} weight="duotone" style={{ color: "var(--cyan)" }} />
          }
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                fontWeight: 650,
                color: "var(--text-hi)",
              }}
            >
              {employee.name}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
              {employee.kind === "dream" ? "梦想员工" : "普通员工"}
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: "0.78rem",
          color: "var(--text-dim)",
          lineHeight: 1.6,
          background: "rgba(0,0,0,0.2)",
          padding: 12,
          borderRadius: "var(--radius-sm)",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
        }}
      >
        {employee.description || "暂无描述"}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontFamily: "var(--font-mono)",
            fontSize: "0.68rem",
            color: "var(--cyan)",
            background: "var(--cyan-dim)",
            border: "1px solid rgba(0,229,255,0.12)",
          }}
        >
          {employee.skill_count} skills
        </span>
        {employee.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              color: "var(--cyan)",
              background: "var(--cyan-dim)",
              border: "1px solid rgba(0,229,255,0.12)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

    </Link>
  );
}
