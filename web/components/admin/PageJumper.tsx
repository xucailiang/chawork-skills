"use client";

import { useState } from "react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function PageJumper({ page, totalPages, onPageChange }: Props) {
  const [input, setInput] = useState("");

  function jump() {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n);
      setInput("");
    }
  }

  return (
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
      <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginLeft: 8 }}>跳转</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && jump()}
        placeholder={String(page)}
        style={{
          width: 44,
          textAlign: "center",
          padding: "4px 0",
          background: "rgba(0,0,0,0.2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-hi)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.82rem",
          outline: "none",
        }}
      />
      <button onClick={jump} className="btn btn--ghost btn--sm">
        GO
      </button>
    </div>
  );
}
