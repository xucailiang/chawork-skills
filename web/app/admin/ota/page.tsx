"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getReleases,
  createRelease,
  publishRelease,
  rollbackRelease,
  deleteRelease,
  uploadArtifact,
  generatePatches,
  getStats,
  getGrayRules,
  createGrayRule,
  deleteGrayRule,
  type Release,
  type StatsResponse,
  type GrayRule,
} from "@/lib/ota-api";

type Tab = "releases" | "stats" | "gray-rules";

export default function OTAAdminPage() {
  const [tab, setTab] = useState<Tab>("releases");
  const [tokenSet, setTokenSet] = useState(false);

  useEffect(() => {
    setTokenSet(!!localStorage.getItem("ota_admin_token"));
  }, []);

  const handleSaveToken = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (fd.get("token") as string).trim();
    if (val) {
      localStorage.setItem("ota_admin_token", val);
      setTokenSet(true);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "releases", label: "版本管理" },
    { key: "gray-rules", label: "灰度规则" },
    { key: "stats", label: "统计面板" },
  ];

  return (
    <div className="relative z-1 w-[min(1200px,92%)] mx-auto pt-36 pb-20">
      <h1 className="font-display text-2xl font-bold text-[var(--text-hi)] mb-2">
        OTA 版本管理
      </h1>
      <p className="text-sm text-[var(--text-dim)] mb-8">
        管理应用版本发布、灰度策略和升级统计
      </p>

      {!tokenSet && (
        <form onSubmit={handleSaveToken} className="flex items-center gap-2 mb-6 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <span className="text-sm text-[var(--text-dim)]">Admin Token:</span>
          <input name="token" type="password" placeholder="输入 OTA_ADMIN_TOKEN" className="flex-1 px-2 py-1 text-sm rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-hi)]" />
          <button type="submit" className="px-3 py-1 text-sm bg-[var(--amber)] text-black rounded cursor-pointer">保存</button>
          <span className="text-xs text-[var(--text-dim)]">不设 token 启动 API 则无需填写</span>
        </form>
      )}

      <div className="flex gap-0 border-b border-[var(--border)] mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-all cursor-pointer bg-transparent ${
              tab === t.key
                ? "font-semibold text-[var(--text-hi)] border-[var(--amber)]"
                : "font-normal text-[var(--text-dim)] border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "releases" && <ReleasesPanel />}
      {tab === "gray-rules" && <GrayRulesPanel />}
      {tab === "stats" && <StatsPanel />}
    </div>
  );
}

// ─── Releases Panel ──────────────────────────────────────────────

function ReleasesPanel() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getReleases({ page: p });
      setReleases(res.items);
      setTotal(res.total);
      setPage(p);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (id: number) => {
    if (!confirm("确定发布此版本？")) return;
    try { await publishRelease(id); load(page); } catch (e) { alert(String(e)); }
  };

  const handleRollback = async (id: number) => {
    if (!confirm("确定回滚此版本？")) return;
    try { await rollbackRelease(id); load(page); } catch (e) { alert(String(e)); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此草稿版本？")) return;
    try { await deleteRelease(id); load(page); } catch (e) { alert(String(e)); }
  };

  const handleGeneratePatches = async (id: number) => {
    try {
      const result = await generatePatches(id);
      alert(`生成完成\n成功: ${result.generated.length}\n跳过: ${result.skipped.length}`);
    } catch (e) { alert(String(e)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[var(--text-dim)]">共 {total} 个版本</span>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium bg-[var(--amber)] text-black rounded-lg hover:opacity-90 cursor-pointer"
        >
          + 创建版本
        </button>
      </div>

      {showCreate && (
        <CreateReleaseForm
          onCreated={() => { setShowCreate(false); load(1); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="space-y-3">
        {releases.map((r) => (
          <ReleaseCard
            key={r.id}
            release={r}
            onPublish={() => handlePublish(r.id)}
            onRollback={() => handleRollback(r.id)}
            onDelete={() => handleDelete(r.id)}
            onGeneratePatches={() => handleGeneratePatches(r.id)}
            onUploadDone={() => load(page)}
          />
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1 text-sm border border-[var(--border)] rounded disabled:opacity-30">上一页</button>
          <span className="px-3 py-1 text-sm text-[var(--text-dim)]">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1)} className="px-3 py-1 text-sm border border-[var(--border)] rounded disabled:opacity-30">下一页</button>
        </div>
      )}
    </div>
  );
}

// ─── Release Card ────────────────────────────────────────────────

function ReleaseCard({
  release: r,
  onPublish,
  onRollback,
  onDelete,
  onGeneratePatches,
  onUploadDone,
}: {
  release: Release;
  onPublish: () => void;
  onRollback: () => void;
  onDelete: () => void;
  onGeneratePatches: () => void;
  onUploadDone: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    active: "bg-green-500/20 text-green-400",
    rollback: "bg-red-500/20 text-red-400",
    archived: "bg-gray-500/20 text-gray-500",
  };

  const handleUpload = async (type: "full" | "signature") => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await uploadArtifact(r.id, file, type);
        onUploadDone();
      } catch (e) { alert(String(e)); }
      setUploading(false);
    };
    input.click();
  };

  const statusLabel: Record<string, string> = { draft: "草稿", active: "活跃", rollback: "已回滚", archived: "已归档" };
  const typeLabel: Record<string, string> = { full: "全量", hot: "热更新", both: "全量+热更新" };

  return (
    <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-1)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-[var(--text-hi)]">v{r.version}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[r.status]}`}>
            {statusLabel[r.status]}
          </span>
          <span className="text-xs text-[var(--text-dim)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
            {r.channel}
          </span>
          <span className="text-xs text-[var(--text-dim)]">{r.platform}</span>
        </div>
        <div className="flex gap-2">
          {r.status === "draft" && (
            <>
              <button onClick={() => handleUpload("full")} disabled={uploading} className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-[var(--surface-2)] cursor-pointer">
                {uploading ? "上传中..." : "上传全量包"}
              </button>
              <button onClick={onGeneratePatches} className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-[var(--surface-2)] cursor-pointer">
                生成补丁
              </button>
              <button onClick={onPublish} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
                发布
              </button>
              <button onClick={onDelete} className="text-xs px-2 py-1 text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 cursor-pointer">
                删除
              </button>
            </>
          )}
          {r.status === "active" && (
            <button onClick={onRollback} className="text-xs px-2 py-1 text-orange-400 border border-orange-400/30 rounded hover:bg-orange-400/10 cursor-pointer">
              回滚
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-4 text-xs text-[var(--text-dim)]">
        <span>类型: {typeLabel[r.update_type]}</span>
        {r.force_update === 1 && <span className="text-red-400">强制更新</span>}
        {r.published_at && <span>发布: {new Date(r.published_at).toLocaleString()}</span>}
        <span>创建: {new Date(r.created_at).toLocaleString()}</span>
      </div>
      {r.release_notes && (
        <p className="mt-2 text-xs text-[var(--text-dim)] line-clamp-2">{r.release_notes}</p>
      )}
    </div>
  );
}

// ─── Create Release Form ─────────────────────────────────────────

function CreateReleaseForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [version, setVersion] = useState("");
  const [updateType, setUpdateType] = useState<"full" | "hot" | "both">("both");
  const [channel, setChannel] = useState("stable");
  const [platform, setPlatform] = useState("darwin-aarch64");
  const [notes, setNotes] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [minVersion, setMinVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version) return;
    if (!file) { alert("请选择要上传的安装包文件"); return; }
    setSubmitting(true);
    try {
      const release = await createRelease({
        version,
        update_type: updateType,
        channel,
        platform,
        release_notes: notes || undefined,
        force_update: forceUpdate,
        min_compatible_version: minVersion || undefined,
      });
      await uploadArtifact(release.id, file, "full");
      onCreated();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">版本号</span>
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="0.2.0" required
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]" />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">更新类型</span>
          <select value={updateType} onChange={(e) => setUpdateType(e.target.value as typeof updateType)}
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
            <option value="both">全量+热更新</option>
            <option value="full">仅全量</option>
            <option value="hot">仅热更新</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">渠道</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
            <option value="stable">stable</option>
            <option value="beta">beta</option>
            <option value="canary">canary</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">平台</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
            <option value="darwin-aarch64">macOS (arm64)</option>
            <option value="darwin-x86_64">macOS (x86_64)</option>
            <option value="windows-x86_64">Windows (x64)</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-[var(--text-dim)]">更新日志</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Markdown 格式"
          className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)] resize-y" />
      </label>
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <input type="checkbox" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} />
          强制更新
        </label>
        <label className="block flex-1">
          <span className="text-xs text-[var(--text-dim)]">最低兼容版本</span>
          <input value={minVersion} onChange={(e) => setMinVersion(e.target.value)} placeholder="可选"
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-[var(--text-dim)]">安装包文件 *</span>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".tar.gz,.gz,.zip,.dmg,.msi,.exe"
          className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)] file:mr-3 file:px-3 file:py-1 file:text-xs file:border-0 file:rounded file:bg-[var(--amber)] file:text-black file:cursor-pointer" />
        <span className="text-xs text-[var(--text-dim)] mt-1 block">
          macOS: .app.tar.gz / .dmg | Windows: .nsis.zip / .msi | 热更新: 前端 bundle .tar.gz
        </span>
      </label>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={submitting}
          className="px-4 py-2 text-sm font-medium bg-[var(--amber)] text-black rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer">
          {submitting ? "创建中..." : "创建并上传"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-[var(--text-dim)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
          取消
        </button>
      </div>
    </form>
  );
}

// ─── Gray Rules Panel ────────────────────────────────────────────

function GrayRulesPanel() {
  const [rules, setRules] = useState<GrayRule[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, rel] = await Promise.all([getGrayRules(), getReleases()]);
      setRules(r);
      setReleases(rel.items);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此灰度规则？")) return;
    try { await deleteGrayRule(id); load(); } catch (e) { alert(String(e)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[var(--text-dim)]">共 {rules.length} 条规则</span>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-sm font-medium bg-[var(--amber)] text-black rounded-lg hover:opacity-90 cursor-pointer">
          + 添加规则
        </button>
      </div>

      {showCreate && (
        <CreateGrayRuleForm
          releases={releases}
          onCreated={() => { setShowCreate(false); load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="space-y-2">
        {rules.map((rule) => {
          const rel = releases.find((r) => r.id === rule.release_id);
          return (
            <div key={rule.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg bg-[var(--surface-1)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-hi)]">
                  v{rel?.version ?? rule.release_id}
                </span>
                <span className="text-xs bg-[var(--surface-2)] px-2 py-0.5 rounded text-[var(--text-dim)]">
                  {rule.rule_type === "percentage" ? `${rule.percentage}% 设备` : `${JSON.parse(rule.device_ids || "[]").length} 台设备`}
                </span>
              </div>
              <button onClick={() => handleDelete(rule.id)}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer">删除</button>
            </div>
          );
        })}
        {rules.length === 0 && (
          <p className="text-sm text-[var(--text-dim)] text-center py-8">暂无灰度规则（无规则 = 全量推送）</p>
        )}
      </div>
    </div>
  );
}

function CreateGrayRuleForm({
  releases,
  onCreated,
  onCancel,
}: {
  releases: Release[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [releaseId, setReleaseId] = useState<number>(releases[0]?.id ?? 0);
  const [ruleType, setRuleType] = useState<"percentage" | "device_list">("percentage");
  const [percentage, setPercentage] = useState(10);
  const [deviceIds, setDeviceIds] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGrayRule({
        release_id: releaseId,
        rule_type: ruleType,
        percentage: ruleType === "percentage" ? percentage : undefined,
        device_ids: ruleType === "device_list" ? deviceIds.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      });
      onCreated();
    } catch (e) { alert(String(e)); }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">目标版本</span>
          <select value={releaseId} onChange={(e) => setReleaseId(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
            {releases.map((r) => <option key={r.id} value={r.id}>v{r.version} ({r.status})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-[var(--text-dim)]">规则类型</span>
          <select value={ruleType} onChange={(e) => setRuleType(e.target.value as typeof ruleType)}
            className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
            <option value="percentage">按百分比</option>
            <option value="device_list">指定设备</option>
          </select>
        </label>
        {ruleType === "percentage" ? (
          <label className="block">
            <span className="text-xs text-[var(--text-dim)]">百分比</span>
            <input type="number" min={1} max={100} value={percentage} onChange={(e) => setPercentage(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]" />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs text-[var(--text-dim)]">设备ID (逗号分隔)</span>
            <input value={deviceIds} onChange={(e) => setDeviceIds(e.target.value)} placeholder="device1,device2"
              className="mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]" />
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-[var(--amber)] text-black rounded-lg cursor-pointer">添加</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-[var(--text-dim)] border border-[var(--border)] rounded-lg cursor-pointer">取消</button>
      </div>
    </form>
  );
}

// ─── Stats Panel ─────────────────────────────────────────────────

function StatsPanel() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    getStats(days).then(setStats).catch(() => {});
  }, [days]);

  if (!stats) return <p className="text-sm text-[var(--text-dim)]">加载中...</p>;

  const { overview, distribution, recent_events } = stats;

  return (
    <div className="space-y-6">
      {/* 时间范围 */}
      <div className="flex justify-end">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-hi)]">
          <option value={1}>最近 1 天</option>
          <option value={7}>最近 7 天</option>
          <option value={30}>最近 30 天</option>
        </select>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="总设备数" value={String(overview.total_devices)} />
        <StatCard label="最新版本" value={overview.latest_version ?? "无"} />
        <StatCard label="升级率" value={`${overview.upgrade_rate}%`} />
        <StatCard label="失败率" value={`${overview.failure_rate}%`} color={overview.failure_rate > 5 ? "text-red-400" : undefined} />
      </div>

      {/* 版本分布 */}
      <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-1)]">
        <h3 className="text-sm font-semibold text-[var(--text-hi)] mb-3">版本分布</h3>
        {distribution.length === 0 ? (
          <p className="text-xs text-[var(--text-dim)]">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {distribution.map((d) => {
              const maxCount = Math.max(...distribution.map((x) => x.count));
              return (
                <div key={d.version} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-[var(--text-dim)]">v{d.version}</span>
                  <div className="flex-1 h-5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--amber)] rounded-full transition-all"
                      style={{ width: `${(d.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-[var(--text-dim)] w-8 text-right">{d.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 最近事件 */}
      <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-1)]">
        <h3 className="text-sm font-semibold text-[var(--text-hi)] mb-3">最近升级事件</h3>
        {recent_events.length === 0 ? (
          <p className="text-xs text-[var(--text-dim)]">暂无事件</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--text-dim)] border-b border-[var(--border)]">
                  <th className="pb-2 pr-3">设备</th>
                  <th className="pb-2 pr-3">版本变更</th>
                  <th className="pb-2 pr-3">类型</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2">时间</th>
                </tr>
              </thead>
              <tbody>
                {recent_events.map((ev) => (
                  <tr key={ev.id} className="border-b border-[var(--border)]/50">
                    <td className="py-2 pr-3 text-[var(--text-dim)] font-mono">{ev.device_id.slice(0, 8)}</td>
                    <td className="py-2 pr-3 text-[var(--text-hi)]">{ev.from_version} → {ev.to_version}</td>
                    <td className="py-2 pr-3">{ev.update_type}</td>
                    <td className="py-2 pr-3">
                      <span className={ev.status === "success" ? "text-green-400" : ev.status === "failed" ? "text-red-400" : "text-yellow-400"}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--text-dim)]">{new Date(ev.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-1)]">
      <p className="text-xs text-[var(--text-dim)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? "text-[var(--text-hi)]"}`}>{value}</p>
    </div>
  );
}
