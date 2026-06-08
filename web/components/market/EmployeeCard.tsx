import Link from "next/link";
import type { HubEmployee } from "@/lib/api";
import { Users } from "lucide-react";

export function EmployeeCard({ employee }: { employee: HubEmployee }) {
  return (
    <Link
      href={`/market/employees/${encodeURIComponent(employee.id)}`}
      className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
            {employee.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {employee.skill_count} 个技能 · {employee.kind === "dream" ? "梦想员工" : "普通员工"}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {employee.description || "暂无描述"}
      </p>
      {employee.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {employee.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
