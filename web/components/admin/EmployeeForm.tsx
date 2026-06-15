"use client";

import { useState, useEffect } from "react";
import {
  createEmployee,
  updateEmployee,
  getEmployeeDetail,
  type EmployeeDetail,
} from "@/lib/api";
import { SkillPicker } from "./SkillPicker";
import { PromptEditor } from "./PromptEditor";

interface Props {
  mode: "create" | "edit";
  employeeId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export function EmployeeForm({ mode, employeeId, onSave, onCancel }: Props) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"ordinary" | "dream">("ordinary");
  const [promptMd, setPromptMd] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && employeeId) {
      setLoading(true);
      getEmployeeDetail(employeeId)
        .then((data) => {
          setId(data.id);
          setName(data.name);
          setDescription(data.description);
          setKind(data.kind);
          setPromptMd(data.prompt_md);
          setSkillIds(data.skill_ids);
          setTags(data.tags.join(", "));
        })
        .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
        .finally(() => setLoading(false));
    }
  }, [mode, employeeId]);

  async function handleSave() {
    if (!id.trim() || !name.trim() || !promptMd.trim()) {
      setError("ID、名称和系统提示词为必填项");
      return;
    }
    setSaving(true);
    setError("");

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (mode === "create") {
        await createEmployee({
          id: id.trim(),
          name: name.trim(),
          description: description.trim(),
          kind,
          prompt_md: promptMd,
          skill_ids: skillIds,
          tags: parsedTags,
        });
      } else {
        await updateEmployee(employeeId!, {
          name: name.trim(),
          description: description.trim(),
          prompt_md: promptMd,
          skill_ids: skillIds,
          tags: parsedTags,
        });
      }
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
        加载中...
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        overflowY: "auto",
        padding: "60px 0 40px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
          width: "min(640px, 92%)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 650,
              color: "var(--text-hi)",
            }}
          >
            {mode === "create" ? "新增员工" : "编辑员工"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontSize: "1.2rem",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
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

        {/* ID */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            ID <span style={{ color: "#ef4444" }}>*</span>
          </span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={mode === "edit"}
            placeholder="frontend-dev"
            style={{
              ...inputStyle,
              opacity: mode === "edit" ? 0.5 : 1,
            }}
          />
        </label>

        {/* Name */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            名称 <span style={{ color: "#ef4444" }}>*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="前端开发工程师"
            style={inputStyle}
          />
        </label>

        {/* Description */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>描述</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="精通 React/Vue/TypeScript 的前端开发角色"
            style={inputStyle}
          />
        </label>

        {/* Kind */}
        <fieldset style={{ display: "flex", alignItems: "center", gap: 16, border: "none", padding: 0 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>类型</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input
              type="radio"
              name="kind"
              value="ordinary"
              checked={kind === "ordinary"}
              onChange={() => setKind("ordinary")}
              style={{ accentColor: "var(--amber)" }}
            />
            <span style={{ fontSize: "0.85rem", color: "var(--text-hi)" }}>ordinary</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input
              type="radio"
              name="kind"
              value="dream"
              checked={kind === "dream"}
              onChange={() => setKind("dream")}
              style={{ accentColor: "var(--amber)" }}
            />
            <span style={{ fontSize: "0.85rem", color: "var(--text-hi)" }}>dream</span>
          </label>
        </fieldset>

        {/* Tags */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>标签（逗号分隔）</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="开发, 前端, React"
            style={inputStyle}
          />
        </label>

        {/* Skills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>技能组合</span>
          <SkillPicker selected={skillIds} onChange={setSkillIds} />
        </div>

        {/* Prompt */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            系统提示词 <span style={{ color: "#ef4444" }}>*</span>
          </span>
          <PromptEditor value={promptMd} onChange={setPromptMd} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn--ghost"
            style={{ padding: "8px 20px" }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn--primary"
            style={{ padding: "8px 20px", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "rgba(0,0,0,0.2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-hi)",
  fontSize: "0.85rem",
  outline: "none",
};
