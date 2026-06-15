"use client";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function PromptEditor({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"你是一名...\\n\\n## 核心能力\\n- ...\\n\\n## 工作原则\\n1. ..."}
        rows={16}
        style={{
          padding: "14px 16px",
          background: "rgba(0,0,0,0.2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-hi)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
          lineHeight: 1.7,
          resize: "vertical",
          outline: "none",
          minHeight: 300,
        }}
      />
      <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
        Markdown 格式，定义员工的角色、能力和行为准则
      </span>
    </div>
  );
}
