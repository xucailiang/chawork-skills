"use client";

import { useState } from "react";
import { importFromUrl, type ImportGithubResponse } from "@/lib/api";

export function ImportPanel({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [ref, setRef] = useState("main");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportGithubResponse | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!url.trim()) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const res = await importFromUrl(url.trim(), ref.trim() || "main");
      setResult(res);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    }
    setImporting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Import from URL */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "28px 24px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--text-hi)",
            marginBottom: 4,
          }}
        >
          从 Git 仓库导入
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: 20 }}>
          输入 Git 仓库地址（GitHub、GitLab、Gitee 等），Hub 会自动拉取、扫描 SKILL.md、翻译并分类入库
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>仓库地址</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/anthropics/skills"
              style={{
                padding: "10px 14px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-hi)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>分支 / 标签</span>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="main"
              style={{
                padding: "10px 14px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-hi)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                outline: "none",
                maxWidth: 200,
              }}
            />
          </label>

          <button
            onClick={handleImport}
            disabled={importing || !url.trim()}
            className="btn btn--primary"
            style={{
              justifyContent: "center",
              width: "fit-content",
              marginTop: 4,
              opacity: importing || !url.trim() ? 0.5 : 1,
            }}
          >
            {importing ? "导入中（可能需要几分钟）..." : "开始导入"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: 16,
              padding: "16px",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.18)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#22c55e",
                marginBottom: 8,
              }}
            >
              导入成功 — {result.imported} 个技能
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {result.skills.slice(0, 20).map((s) => (
                <span
                  key={s.id}
                  style={{
                    padding: "3px 10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-dim)",
                  }}
                >
                  {s.name}
                </span>
              ))}
              {result.skills.length > 20 && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", padding: "3px 6px" }}>
                  +{result.skills.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--text-hi)",
            marginBottom: 12,
          }}
        >
          支持的格式
        </h3>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.8 }}>
          <p>仓库中需要包含标准的 <code style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>SKILL.md</code> 文件，支持的结构：</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>单个 Skill 仓库 — 根目录下有 SKILL.md</li>
            <li>多个 Skill 仓库 — 子目录各有 SKILL.md（如 skills/pdf/SKILL.md）</li>
          </ul>
          <p style={{ marginTop: 12 }}>支持的 Git 平台：</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>GitHub — https://github.com/user/repo</li>
            <li>GitLab — https://gitlab.com/user/repo</li>
            <li>Gitee — https://gitee.com/user/repo</li>
            <li>任意支持 HTTPS clone 的 Git 仓库</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
