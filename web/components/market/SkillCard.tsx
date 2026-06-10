"use client";

import Link from "next/link";
import type { HubSkill } from "@/lib/api";
import { useCallback, useRef } from "react";
import { PuzzlePiece } from "@phosphor-icons/react";

export function SkillCard({ skill }: { skill: HubSkill; index?: number }) {
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
      href={`/market/skills/${encodeURIComponent(skill.id)}`}
      className="skill-card"
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "background 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <PuzzlePiece size={28} weight="duotone" style={{ color: "var(--amber)" }} />
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--amber)",
            background: "var(--amber-dim)",
            border: "1px solid rgba(245,158,11,0.15)",
          }}
        >
          {skill.profession}
        </span>
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.05rem",
          fontWeight: 650,
          color: "var(--text-hi)",
        }}
      >
        {skill.name}
      </h3>
      <p
        style={{
          fontSize: "0.83rem",
          color: "var(--text-body)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {skill.description_zh || skill.description_en || "暂无描述"}
      </p>
      {skill.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--amber)",
                background: "var(--amber-dim)",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

    </Link>
  );
}
