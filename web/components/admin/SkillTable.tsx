"use client";

import type { HubSkill } from "@/lib/api";

interface Props {
  skills: HubSkill[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function SkillTable({ skills, total, page, loading, onPageChange, onDelete, onRefresh }: Props) {
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          共 {total} 个技能
        </span>
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
                    <button
                      onClick={() => onDelete(s.id)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        borderRadius: "var(--radius-sm)",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn btn--ghost btn--sm"
            style={{ opacity: page <= 1 ? 0.3 : 1 }}
          >
            上一页
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn btn--ghost btn--sm"
            style={{ opacity: page >= totalPages ? 0.3 : 1 }}
          >
            下一页
          </button>
        </div>
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
