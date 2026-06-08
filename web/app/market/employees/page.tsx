import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getEmployees } from "@/lib/api";
import { EmployeeCard } from "@/components/market/EmployeeCard";
import { SearchBar } from "@/components/market/SearchBar";

export const metadata: Metadata = {
  title: "员工市场",
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const tags = params.tags;
  const page = Number(params.page || "1");

  let employees = { total: 0, page: 1, limit: 20, items: [] as any[] };

  try {
    employees = await getEmployees({ q, tags, page, limit: 20 });
  } catch {
    // API not available
  }

  const totalPages = Math.ceil(employees.total / employees.limit) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">员工市场</h1>
        <p className="mt-1 text-muted-foreground">浏览和搜索 AI 数字员工</p>
      </div>

      <Suspense>
        <SearchBar basePath="/market/employees" />
      </Suspense>

      <div className="mt-6 flex items-center gap-4 border-b border-border pb-4">
        <Link
          href="/market/skills"
          className="text-sm font-medium text-muted-foreground hover:text-foreground pb-2"
        >
          技能
        </Link>
        <Link
          href="/market/employees"
          className="text-sm font-semibold text-primary border-b-2 border-primary pb-2"
        >
          员工
        </Link>
      </div>

      <div className="mt-6">
        {employees.items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {q || tags ? "没有找到匹配的员工" : "暂无员工数据，请先通过管理后台创建"}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.items.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/market/employees?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(tags ? { tags } : {}),
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
                    href={`/market/employees?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(tags ? { tags } : {}),
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
  );
}
