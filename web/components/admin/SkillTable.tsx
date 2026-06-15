"use client";

import { useState } from "react";
import type { HubSkill } from "@/lib/api";
import { PageJumper } from "./PageJumper";
import { SkillDetail } from "./SkillDetail";

interface Props {
  skills: HubSkill[];
  total: number;
  page: number;
  loading: boolean;
  search: string;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function SkillTable({ skills, total, page, loading, search, onSearchChange, onPageChange, onDelete, onRefresh }: Props) {
  const totalPages = Math.ceil(total / 20) || 1;
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", flexShrink: 0 }}>
          共 {total} 个技能
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索技能名称、ID、描述..."
          style={{
            flex: 1,
            maxWidth: 300,
            padding: "6px 12px",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-hi)",
            fontSize: "0.82rem",
            outline: "none",
          }}
        />
        <button onClick={onRefresh} className="btn btn--ghost btn--sm">
          刷新
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                textAlign: "left",
              }}
            >
              <th style={{ ...thStyle }}>名称</th>
              <th style={{ ...thStyle }}>ID</th>
              <th style={{ ...thStyle }}>职业</th>
              <th style={{ ...thStyle }}>来源</th>
              <th style={{ ...thStyle }}>更新时间</th>
              <th style={{ ...thStyle, textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && skills.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--text-dim)" }}>
                  加载中...
                </td>
              </tr>
            ) : skills.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--text-dim)" }}>
                  暂无技能
                </td>
              </tr>
            ) : (
              skills.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...tdStyle, color: "var(--text-hi)", fontWeight: 500 }}>
                    {s.name}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-dim)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.id}
                  </td>
                  <td style={{ ...tdStyle }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        background: "rgba(245,158,11,0.08)",
                        color: "var(--amber)",
                        border: "1px solid rgba(245,158,11,0.15)",
                      }}
                    >
                      {s.profession}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.78rem", color: "var(--text-dim)" }}>
                    {s.source.type === "github" ? s.source.repo : "手动"}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    {new Date(s.updated_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setDetailId(s.id)}
                        style={{ padding: "4px 10px", fontSize: "0.78rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "var(--radius-sm)", color: "#3b82f6", cursor: "pointer" }}
                      >
                        查看
                      </button>
                      <button
                        onClick={() => onDelete(s.id)}
                        style={{ padding: "4px 10px", fontSize: "0.78rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-sm)", color: "#ef4444", cursor: "pointer" }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailId && <SkillDetail skillId={detailId} onClose={() => setDetailId(null)} />}

      {/* Pagination */}
      {totalPages > 1 && (
        <PageJumper page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--text-dim)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "var(--text-mid)",
};
