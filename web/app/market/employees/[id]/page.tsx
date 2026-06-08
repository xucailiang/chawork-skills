import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { getEmployeeDetail } from "@/lib/api";
import { InstallButton } from "@/components/market/InstallButton";
import { SkillCard } from "@/components/market/SkillCard";
import { ArrowLeft, ChevronDown } from "lucide-react";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let employee;
  try {
    employee = await getEmployeeDetail(decodeURIComponent(id));
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/market/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回员工市场
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{employee.name}</h1>
          <p className="mt-2 text-muted-foreground">{employee.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {employee.kind === "dream" ? "梦想员工" : "普通员工"}
            </span>
            <span>{employee.skill_count} 个技能</span>
          </div>
        </div>
        <div className="shrink-0">
          <InstallButton type="employee" id={employee.id} />
        </div>
      </div>

      {employee.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {employee.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <hr className="my-8 border-border" />

      <section>
        <h2 className="text-lg font-semibold">系统提示词</h2>
        <details className="mt-4 rounded-xl border border-border">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-medium hover:bg-muted/50">
            <ChevronDown className="h-4 w-4" />
            查看完整提示词
          </summary>
          <div className="border-t border-border px-5 py-4">
            <article className="prose prose-zinc prose-sm max-w-none dark:prose-invert">
              <Markdown>{employee.prompt_md}</Markdown>
            </article>
          </div>
        </details>
      </section>

      {employee.skills.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">包含的技能</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {employee.skills.map((skill) => (
              <Link
                key={skill.id}
                href={`/market/skills/${encodeURIComponent(skill.id)}`}
                className="rounded-xl border border-border p-4 transition-colors hover:bg-accent/30"
              >
                <div className="font-medium">{skill.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {skill.description_zh || "暂无描述"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
