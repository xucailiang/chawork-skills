"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InstallButton({ type, id }: { type: "skill" | "employee"; id: string }) {
  const [copied, setCopied] = useState(false);
  const installId = `chawork://install/${type}/${id}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(installId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={installId}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        在 ChaWork 中安装
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            已复制
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            复制安装链接
          </>
        )}
      </button>
    </div>
  );
}
