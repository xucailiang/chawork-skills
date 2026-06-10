"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ProfessionInfo } from "@/lib/api";

export function ProfessionFilter({
  professions,
  totalSkills,
}: {
  professions: ProfessionInfo[];
  totalSkills: number;
}) {
  const searchParams = useSearchParams();
  const activeProfession = searchParams.get("profession") ?? "";

  const active = professions.filter((p) => p.skill_count > 0);

  function buildHref(profession: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (profession) {
      params.set("profession", profession);
    } else {
      params.delete("profession");
    }
    params.delete("page");
    return `/market/skills?${params.toString()}`;
  }

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Link
        href={buildHref("")}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.88rem",
          textDecoration: "none",
          fontWeight: !activeProfession ? 600 : 400,
          color: !activeProfession ? "var(--text-hi)" : "var(--text-dim)",
          background: !activeProfession ? "var(--amber-dim)" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <span>全部</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>{totalSkills}</span>
      </Link>
      {active.map((p) => (
        <Link
          key={p.name}
          href={buildHref(p.name)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.88rem",
            textDecoration: "none",
            fontWeight: activeProfession === p.name ? 600 : 400,
            color: activeProfession === p.name ? "var(--amber)" : "var(--text-dim)",
            background: activeProfession === p.name ? "var(--amber-dim)" : "transparent",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", flexShrink: 0, marginLeft: 8 }}>
            {p.skill_count}
          </span>
        </Link>
      ))}
    </nav>
  );
}
