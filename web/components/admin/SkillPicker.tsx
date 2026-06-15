"use client";

import { useState, useEffect, useMemo } from "react";
import { getSkills, type HubSkill } from "@/lib/api";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function SkillPicker({ selected, onChange }: Props) {
  const [allSkills, setAllSkills] = useState<HubSkill[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSkills({ limit: 500 });
        setAllSkills(res.items);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allSkills;
    const q = search.toLowerCase();
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.description_zh.toLowerCase().includes(q) ||
        s.profession.toLowerCase().includes(q),
    );
  }, [allSkills, search]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  const selectedSkills = allSkills.filter((s) => selectedSet.has(s.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Selected tags */}
      {selectedSkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selectedSkills.map((s) => (
            <span
              key={s.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: "rgba(0,229,255,0.06)",
                border: "1px solid rgba(0,229,255,0.18)",
                borderRadius: 999,
                fontSize: "0.78rem",
                color: "var(--text-hi)",
              }}
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  fontSize: "0.85rem",
                  padding: "0 2px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索技能..."
        style={{
          padding: "8px 12px",
          background: "rgba(0,0,0,0.2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-hi)",
          fontSize: "0.82rem",
          outline: "none",
        }}
      />

      {/* Skill list */}
      <div
        style={{
          maxHeight: 240,
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        {loading ? (
          <div style={{ padding: 16, textAlign: "center", fontSize: "0.82rem", color: "var(--text-dim)" }}>
            加载技能列表...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", fontSize: "0.82rem", color: "var(--text-dim)" }}>
            {search ? "无匹配技能" : "暂无技能"}
          </div>
        ) : (
          filtered.map((s) => {
            const checked = selectedSet.has(s.id);
            return (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: checked ? "rgba(0,229,255,0.04)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s.id)}
                  style={{ accentColor: "var(--amber)", flexShrink: 0 }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "0.82rem",
                    color: "var(--text-hi)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-dim)",
                    flexShrink: 0,
                    padding: "1px 6px",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.12)",
                    borderRadius: 999,
                  }}
                >
                  {s.profession}
                </span>
              </label>
            );
          })
        )}
      </div>

      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
        已选 {selected.length} 个技能，共 {allSkills.length} 个可选
      </span>
    </div>
  );
}
