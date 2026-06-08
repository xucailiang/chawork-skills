import Link from "next/link";
import type { HubSkill } from "@/lib/api";
import { Blocks } from "lucide-react";

export function SkillCard({ skill }: { skill: HubSkill }) {
  return (
    <Link
      href={`/market/skills/${encodeURIComponent(skill.id)}`}
      className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Blocks className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
            {skill.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{skill.profession}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {skill.description_zh || skill.description_en || "暂无描述"}
      </p>
      {skill.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 3).map((tag) => (
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
