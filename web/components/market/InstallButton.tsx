"use client";

import { useState } from "react";

export function InstallButton({ type, id }: { type: "skill" | "employee"; id: string }) {
  const [copied, setCopied] = useState(false);
  const installId = `chawork://install/${type}/${id}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(installId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <a href={installId} className="btn btn--primary">
        在 ChaWork 中安装
      </a>
      <button onClick={handleCopy} className="btn btn--ghost" style={{ fontSize: "0.9rem" }}>
        {copied ? "已复制" : "复制安装链接"}
      </button>
    </div>
  );
}
