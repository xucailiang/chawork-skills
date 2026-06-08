import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { getSkillDetail } from "@/lib/api";
import { InstallButton } from "@/components/market/InstallButton";
import { ArrowLeft, GitBranch } from "lucide-react";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let skill;
  try {
    skill = await getSkillDetail(decodeURIComponent(id));
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/market/skills"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回技能市场
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{skill.name}</h1>
          <p className="mt-2 text-muted-foreground">{skill.description_zh || skill.description_en}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {skill.profession}
            </span>
            {skill.source.type === "github" && skill.source.repo && (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                {skill.source.repo}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <InstallButton type="skill" id={skill.id} />
        </div>
      </div>

      {skill.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <hr className="my-8 border-border" />

      <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-pre:bg-muted prose-pre:border prose-pre:border-border">
        <Markdown>{skill.skill_md}</Markdown>
      </article>

      {skill.referenced_by_employees.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold">引用此技能的员工</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skill.referenced_by_employees.map((eid) => (
              <Link
                key={eid}
                href={`/market/employees/${encodeURIComponent(eid)}`}
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                {eid}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
