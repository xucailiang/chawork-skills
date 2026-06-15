"use client";

import { useState, useEffect } from "react";
import { getSkillDetail, type SkillDetail as SkillDetailType } from "@/lib/api";

interface Props {
  skillId: string;
  onClose: () => void;
}

export function SkillDetail({ skillId, onClose }: Props) {
  const [data, setData] = useState<SkillDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    getSkillDetail(skillId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [skillId]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        overflowY: "auto",
        padding: "60px 0 40px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
          width: "min(720px, 92%)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 650, color: "var(--text-hi)" }}>
            技能详情
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: "1.2rem" }}>×</button>
        </div>

        {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>加载中...</div>}
        {error && <div style={{ padding: 16, color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}

        {data && (
          <>
            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 12px", fontSize: "0.85rem" }}>
              <Field label="ID" value={data.id} mono />
              <Field label="名称" value={data.name} />
              <Field label="职业" value={data.profession} tag />
              <Field label="来源" value={data.source.type === "github" ? `${data.source.repo} / ${data.source.path}` : "手动"} mono />
              <Field label="Hash" value={data.content_hash.slice(0, 16) + "..."} mono />
              <Field label="创建时间" value={new Date(data.created_at).toLocaleString("zh-CN")} />
              <Field label="更新时间" value={new Date(data.updated_at).toLocaleString("zh-CN")} />
              {data.tags.length > 0 && <Field label="标签" value={data.tags.join(", ")} />}
              {data.referenced_by_employees.length > 0 && (
                <Field label="被引用" value={data.referenced_by_employees.join(", ")} mono />
              )}
            </div>

            {/* Description */}
            {(data.description_zh || data.description_en) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>描述</span>
                <div style={{ fontSize: "0.85rem", color: "var(--text-hi)", lineHeight: 1.7, padding: "12px 14px", background: "rgba(0,0,0,0.15)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  {data.description_zh || data.description_en}
                </div>
              </div>
            )}

            {/* SKILL.md */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>SKILL.md</span>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  style={{ fontSize: "0.75rem", color: "var(--amber)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showRaw ? "收起" : "展开原文"}
                </button>
              </div>
              {showRaw && (
                <pre style={{
                  fontSize: "0.8rem",
                  color: "var(--text-hi)",
                  lineHeight: 1.6,
                  padding: "14px 16px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  overflow: "auto",
                  maxHeight: 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "var(--font-mono)",
                }}>
                  {data.skill_md}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono, tag }: { label: string; value: string; mono?: boolean; tag?: boolean }) {
  return (
    <>
      <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "right" }}>{label}</span>
      {tag ? (
        <span>
          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.75rem", background: "rgba(245,158,11,0.08)", color: "var(--amber)", border: "1px solid rgba(245,158,11,0.15)" }}>
            {value}
          </span>
        </span>
      ) : (
        <span style={{ color: "var(--text-hi)", fontFamily: mono ? "var(--font-mono)" : undefined, fontSize: mono ? "0.8rem" : undefined, wordBreak: "break-all" }}>
          {value}
        </span>
      )}
    </>
  );
}
