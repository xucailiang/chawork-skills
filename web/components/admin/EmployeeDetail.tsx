"use client";

import { useState, useEffect } from "react";
import { getEmployeeDetail, type EmployeeDetail as EmployeeDetailType } from "@/lib/api";

interface Props {
  employeeId: string;
  onClose: () => void;
}

export function EmployeeDetail({ employeeId, onClose }: Props) {
  const [data, setData] = useState<EmployeeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    getEmployeeDetail(employeeId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [employeeId]);

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
            员工详情
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
              <Field label="类型" value={data.kind} tag kind={data.kind} />
              <Field label="描述" value={data.description || "—"} />
              <Field label="创建时间" value={new Date(data.created_at).toLocaleString("zh-CN")} />
              <Field label="更新时间" value={new Date(data.updated_at).toLocaleString("zh-CN")} />
            </div>

            {/* Tags */}
            {data.tags.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>标签</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.tags.map((tag) => (
                    <span key={tag} style={{ padding: "3px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 999, fontSize: "0.78rem", color: "var(--text-dim)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                技能组合 ({data.skills.length})
              </span>
              {data.skills.length === 0 ? (
                <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>无技能</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" }}>
                  {data.skills.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(0,0,0,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-hi)", fontWeight: 500 }}>{s.name}</span>
                      {s.description_zh && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {s.description_zh.slice(0, 60)}{s.description_zh.length > 60 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>系统提示词</span>
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  style={{ fontSize: "0.75rem", color: "var(--amber)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPrompt ? "收起" : "展开"}
                </button>
              </div>
              {!showPrompt && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.6, padding: "10px 14px", background: "rgba(0,0,0,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  {data.prompt_preview || data.prompt_md.slice(0, 200)}
                  {(data.prompt_md.length > 200) ? "..." : ""}
                </div>
              )}
              {showPrompt && (
                <pre style={{
                  fontSize: "0.82rem",
                  color: "var(--text-hi)",
                  lineHeight: 1.7,
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
                  {data.prompt_md}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono, tag, kind }: { label: string; value: string; mono?: boolean; tag?: boolean; kind?: string }) {
  return (
    <>
      <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "right" }}>{label}</span>
      {tag ? (
        <span>
          <span style={{
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: "0.75rem",
            background: kind === "dream" ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.08)",
            color: kind === "dream" ? "#8b5cf6" : "#3b82f6",
            border: `1px solid ${kind === "dream" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)"}`,
          }}>
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
