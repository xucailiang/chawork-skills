"use client";

import { useState, useEffect, useRef } from "react";
import { importFromUrl, getImportJob, getImportJobs, type ImportJob } from "@/lib/api";

export function ImportPanel({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [ref, setRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ImportJob[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadHistory() {
    getImportJobs().then((jobs) => setHistory(jobs.slice(0, 10))).catch(() => {});
  }

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleImport() {
    if (!url.trim()) return;
    setSubmitting(true);
    setError("");
    setActiveJob(null);
    try {
      const res = await importFromUrl(url.trim(), ref.trim() || undefined);
      setActiveJob({
        id: res.job_id,
        url: url.trim(),
        status: res.status,
        imported: res.imported,
        skills: res.skills,
        started_at: new Date().toISOString(),
      });
      startPolling(res.job_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    }
    setSubmitting(false);
  }

  function startPolling(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const job = await getImportJob(jobId);
        setActiveJob(job);
        if (job.status === "done" || job.status === "error") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          onDone();
          loadHistory();
        }
      } catch {}
    }, 3000);
  }

  const statusLabels: Record<string, string> = {
    syncing: "正在拉取仓库...",
    translating: "已入库，正在翻译分类...",
    done: "完成",
    error: "失败",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
          导入技能
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: 20 }}>
          支持两种方式：Git 仓库地址（自动扫描所有 SKILL.md）或直接链接到 SKILL.md 文件的 URL
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>地址</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Git 仓库、目录或 SKILL.md 文件 URL"
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
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
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>分支 / 标签（可选，URL 中有分支信息时自动解析）</span>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="留空自动检测"
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
            disabled={submitting || !url.trim()}
            className="btn btn--primary"
            style={{
              justifyContent: "center",
              width: "fit-content",
              marginTop: 4,
              opacity: submitting || !url.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? "提交中..." : "开始导入"}
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

        {activeJob && (
          <div
            style={{
              marginTop: 16,
              padding: "16px",
              background: activeJob.status === "error"
                ? "rgba(239,68,68,0.06)"
                : activeJob.status === "done"
                  ? "rgba(34,197,94,0.06)"
                  : "rgba(59,130,246,0.06)",
              border: `1px solid ${
                activeJob.status === "error"
                  ? "rgba(239,68,68,0.18)"
                  : activeJob.status === "done"
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(59,130,246,0.18)"
              }`,
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {(activeJob.status === "syncing" || activeJob.status === "translating") && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: activeJob.status === "error" ? "#ef4444" : activeJob.status === "done" ? "#22c55e" : "#3b82f6",
                }}
              >
                {statusLabels[activeJob.status] || activeJob.status}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                {activeJob.id}
              </span>
            </div>

            {activeJob.error && (
              <p style={{ fontSize: "0.82rem", color: "#ef4444", marginBottom: 8 }}>{activeJob.error}</p>
            )}

            {activeJob.imported > 0 && (
              <>
                <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: 8 }}>
                  已导入 {activeJob.imported} 个技能
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {activeJob.skills.slice(0, 20).map((s) => (
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
                  {activeJob.skills.length > 20 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", padding: "3px 6px" }}>
                      +{activeJob.skills.length - 20} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
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
            最近导入记录
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map((job) => (
              <div
                key={job.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: "0.82rem",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      job.status === "done" ? "#22c55e"
                        : job.status === "error" ? "#ef4444"
                          : "#3b82f6",
                    animation: (job.status === "syncing" || job.status === "translating") ? "pulse 1.5s infinite" : "none",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    color: "var(--text-hi)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {job.url}
                </span>
                <span style={{ flexShrink: 0, fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  {job.imported} 个技能
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background:
                      job.status === "done" ? "rgba(34,197,94,0.08)"
                        : job.status === "error" ? "rgba(239,68,68,0.08)"
                          : "rgba(59,130,246,0.08)",
                    color:
                      job.status === "done" ? "#22c55e"
                        : job.status === "error" ? "#ef4444"
                          : "#3b82f6",
                    border: `1px solid ${
                      job.status === "done" ? "rgba(34,197,94,0.18)"
                        : job.status === "error" ? "rgba(239,68,68,0.18)"
                          : "rgba(59,130,246,0.18)"
                    }`,
                  }}
                >
                  {statusLabels[job.status] || job.status}
                </span>
                <span style={{ flexShrink: 0, fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  {job.started_at ? new Date(job.started_at).toLocaleString("zh-CN") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <p><strong style={{ color: "var(--text-hi)" }}>方式一：Git 仓库</strong> — 自动 clone、扫描所有 SKILL.md、翻译并入库</p>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>https://github.com/user/repo</li>
            <li>https://gitlab.com/user/repo</li>
            <li>https://gitee.com/user/repo</li>
          </ul>
          <p style={{ marginTop: 12 }}><strong style={{ color: "var(--text-hi)" }}>方式二：仓库子目录</strong> — 自动解析分支和路径</p>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>https://github.com/user/repo/tree/main/skills/my-skill</li>
          </ul>
          <p style={{ marginTop: 12 }}><strong style={{ color: "var(--text-hi)" }}>方式三：直接文件链接</strong> — 直接下载 SKILL.md 内容入库</p>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>https://raw.githubusercontent.com/user/repo/main/SKILL.md</li>
            <li>任意 HTTP(S) 链接指向 .md 文件</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: "0.8rem" }}>导入后立即入库可用，翻译和分类在后台异步完成。</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
