"use client";

import { useState, useEffect, useRef } from "react";
import { onOpenAdminPanel } from "@/lib/admin-events";

function FileUploadRow({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = !!file;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        style={{ display: "none" }}
      />
      {selected ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(0,229,255,0.06)",
            border: "1px solid rgba(0,229,255,0.18)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-hi)", fontFamily: "var(--font-mono)" }}>
            {file.name}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", flexShrink: 0, marginLeft: 12 }}>
            {(file.size / 1e6).toFixed(1)} MB
          </span>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "18px 24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--text-dim)",
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--amber)";
            e.currentTarget.style.color = "var(--amber)";
            e.currentTarget.style.background = "rgba(245,158,11,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          }}
        >
          <UploadIcon />
          选择文件
        </button>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("v1.0.0");
  const [macosFile, setMacosFile] = useState<File | null>(null);
  const [windowsFile, setWindowsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    return onOpenAdminPanel(() => setOpen(true));
  }, []);

  async function handleUpload() {
    setUploading(true);
    setStatus("idle");
    const fd = new FormData();
    fd.append("version", version);

    if (macosFile) {
      const renamed = new File([macosFile], "ChaWork.dmg", { type: macosFile.type });
      fd.append("macos", renamed);
    }
    if (windowsFile) {
      const renamed = new File([windowsFile], "ChaWork-Setup.exe", { type: windowsFile.type });
      fd.append("windows", renamed);
    }

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      setStatus(res.ok ? "ok" : "err");
      if (res.ok) setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
    } catch {
      setStatus("err");
    }
    setUploading(false);
  }

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 32px",
          width: "min(460px, 92%)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 650,
            color: "var(--text-hi)",
          }}
        >
          上传安装包
        </h3>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>版本号</span>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-hi)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </label>

        {/* macOS */}
        <FileUploadRow
          label="macOS (.dmg)"
          accept=".dmg"
          file={macosFile}
          onChange={setMacosFile}
        />

        {/* Windows */}
        <FileUploadRow
          label="Windows (.exe)"
          accept=".exe"
          file={windowsFile}
          onChange={setWindowsFile}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn btn--primary"
          style={{ justifyContent: "center", width: "100%" }}
        >
          {uploading ? "上传中..." : status === "ok" ? "已完成" : status === "err" ? "失败，重试" : "上传"}
        </button>
      </div>
    </div>
  );
}
