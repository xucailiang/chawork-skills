import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSkills, getProfessions } from "@/lib/api";
import { SkillCard } from "@/components/market/SkillCard";
import { ProfessionFilter } from "@/components/market/ProfessionFilter";
import { SearchBar } from "@/components/market/SearchBar";

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

  let skills = { total: 0, page: 1, limit: 20, items: [] as any[] };
  let professions = [] as { name: string; skill_count: number; employee_count: number }[];

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">技能市场</h1>
        <p className="mt-1 text-muted-foreground">浏览和搜索 AI 技能</p>
      </div>

      <Suspense>
        <SearchBar basePath="/market/skills" />
      </Suspense>

      <div className="mt-6 flex items-center gap-4 border-b border-border pb-4">
        <Link
          href="/market/skills"
          className="text-sm font-semibold text-primary border-b-2 border-primary pb-2"
        >
          技能
        </Link>
        <Link
          href="/market/employees"
          className="text-sm font-medium text-muted-foreground hover:text-foreground pb-2"
        >
          员工
        </Link>
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-48 shrink-0 lg:block">
          <Suspense>
            <ProfessionFilter professions={professions} totalSkills={skills.total} />
          </Suspense>
        </aside>

        <div className="flex-1">
          {skills.items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {q || profession ? "没有找到匹配的技能" : "暂无技能数据，请先通过 API 导入"}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {skills.items.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/market/skills?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(profession ? { profession } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      上一页
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/market/skills?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(profession ? { profession } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
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
