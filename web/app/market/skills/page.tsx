import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSkills, getProfessions, type HubSkill, type PaginatedResponse, type ProfessionInfo } from "@/lib/api";
import { SkillCard } from "@/components/market/SkillCard";
import { ProfessionFilter } from "@/components/market/ProfessionFilter";
import { SearchBar } from "@/components/market/SearchBar";
import { MarketTabs } from "@/components/market/MarketTabs";

export const metadata: Metadata = {
  title: "技能市场",
};

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; profession?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const profession = params.profession;
  const page = Number(params.page || "1");

  let skills: PaginatedResponse<HubSkill> = { total: 0, page: 1, limit: 20, items: [] };
  let professions: ProfessionInfo[] = [];

  try {
    [skills, professions] = await Promise.all([
      getSkills({ q, profession, page, limit: 20 }),
      getProfessions(),
    ]);
  } catch {
    // API not available
  }

  const totalPages = Math.ceil(skills.total / skills.limit) || 1;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "140px 0 80px",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <MarketTabs active="skills" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 360 }}>
          <Suspense>
            <SearchBar basePath="/market/skills" />
          </Suspense>
        </div>
      </div>

      {/* 12-column asymmetric: sidebar cols 1-3, content cols 4-12 */}
      <div className="market-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 24 }}>
        <aside style={{ gridColumn: "1 / 4" }}>
          <Suspense>
            <ProfessionFilter professions={professions} totalSkills={skills.total} />
          </Suspense>
        </aside>

        <div style={{ gridColumn: "4 / 13" }}>
          {skills.items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 20px",
                color: "var(--text-dim)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {q || profession ? "没有找到匹配的技能" : "暂无技能数据"}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                  background: "var(--border)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                }}
              >
                {skills.items.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 32,
                  }}
                >
                  {page > 1 && (
                    <Link
                      href={`/market/skills?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(profession ? { profession } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                      className="btn btn--ghost btn--sm"
                    >
                      上一页
                    </Link>
                  )}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      color: "var(--text-dim)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                    }}
                  >
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/market/skills?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(profession ? { profession } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                      className="btn btn--ghost btn--sm"
                    >
                      下一页
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
