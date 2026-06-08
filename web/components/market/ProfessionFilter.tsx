"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
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
    <nav className="space-y-1">
      <Link
        href={buildHref("")}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
          !activeProfession
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span>全部</span>
        <span className="text-xs">({totalSkills})</span>
      </Link>
      {active.map((p) => (
        <Link
          key={p.name}
          href={buildHref(p.name)}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
            activeProfession === p.name
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="truncate">{p.name}</span>
          <span className="ml-2 shrink-0 text-xs">({p.skill_count})</span>
        </Link>
      ))}
    </nav>
  );
}
