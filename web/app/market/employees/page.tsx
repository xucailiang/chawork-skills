import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getEmployees, type HubEmployee, type PaginatedResponse } from "@/lib/api";
import { EmployeeCard } from "@/components/market/EmployeeCard";
import { SearchBar } from "@/components/market/SearchBar";
import { MarketTabs } from "@/components/market/MarketTabs";

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

  let employees: PaginatedResponse<HubEmployee> = { total: 0, page: 1, limit: 20, items: [] };

  try {
    employees = await getEmployees({ q, tags, page, limit: 20 });
  } catch {
    // API not available
  }

  const totalPages = Math.ceil(employees.total / employees.limit) || 1;

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
        <MarketTabs active="employees" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 360 }}>
          <Suspense>
            <SearchBar basePath="/market/employees" />
          </Suspense>
        </div>
      </div>

      <div>
        {employees.items.length === 0 ? (
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
            {q || tags ? "没有找到匹配的员工" : "暂无员工模板"}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 1,
                background: "var(--border)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              {employees.items.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
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
                    href={`/market/employees?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(tags ? { tags } : {}),
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
                    href={`/market/employees?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(tags ? { tags } : {}),
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
  );
}
