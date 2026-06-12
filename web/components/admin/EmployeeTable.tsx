"use client";

import type { HubEmployee } from "@/lib/api";

interface Props {
  employees: HubEmployee[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function EmployeeTable({ employees, total, page, loading, onPageChange, onDelete, onRefresh }: Props) {
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          共 {total} 个员工
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
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ ...thStyle }}>名称</th>
              <th style={{ ...thStyle }}>ID</th>
              <th style={{ ...thStyle }}>类型</th>
              <th style={{ ...thStyle }}>技能数</th>
              <th style={{ ...thStyle }}>标签</th>
              <th style={{ ...thStyle }}>更新时间</th>
              <th style={{ ...thStyle, textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && employees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "var(--text-dim)" }}>
                  加载中...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "var(--text-dim)" }}>
                  暂无员工
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...tdStyle, color: "var(--text-hi)", fontWeight: 500 }}>
                    {e.name}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-dim)" }}>
                    {e.id}
                  </td>
                  <td style={{ ...tdStyle }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        background: e.kind === "dream" ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.08)",
                        color: e.kind === "dream" ? "#8b5cf6" : "#3b82f6",
                        border: `1px solid ${e.kind === "dream" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)"}`,
                      }}
                    >
                      {e.kind}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                    {e.skill_count}
                  </td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {e.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "1px 6px",
                            borderRadius: 999,
                            fontSize: "0.72rem",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--border)",
                            color: "var(--text-dim)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    {new Date(e.updated_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      onClick={() => onDelete(e.id)}
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
