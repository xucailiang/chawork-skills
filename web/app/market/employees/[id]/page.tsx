import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { getEmployeeDetail } from "@/lib/api";
import { InstallButton } from "@/components/market/InstallButton";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

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
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(960px, 92%)",
        margin: "0 auto",
        padding: "140px 0 80px",
      }}
    >
      <Link
        href="/market/employees"
        className="btn btn--ghost btn--sm"
        style={{ marginBottom: 32, gap: 6 }}
      >
        <ArrowLeft size={14} weight="bold" />
        返回员工市场
      </Link>

      {/* Header */}
      <section
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {employee.kind === "dream"
            ? <Sparkle size={48} weight="duotone" style={{ color: "var(--amber)" }} />
            : <User size={48} weight="duotone" style={{ color: "var(--cyan)" }} />
          }
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-hi)",
                marginBottom: 8,
              }}
            >
              {employee.name}
            </h1>
            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--text-dim)",
                lineHeight: 1.7,
              }}
            >
              {employee.description}
            </p>
          </div>
        </div>

        <InstallButton type="employee" id={employee.id} />

        {/* Meta chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
          }}
        >
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--amber)",
              background: "var(--amber-dim)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            {employee.kind === "dream" ? "梦想员工" : "普通员工"}
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--cyan)",
              background: "var(--cyan-dim)",
              border: "1px solid rgba(0,229,255,0.12)",
            }}
          >
            {employee.skill_count} skills
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {employee.updated_at?.slice(0, 10) || "-"}
          </span>
        </div>

        {employee.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {employee.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  color: "var(--amber)",
                  background: "var(--amber-dim)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* System prompt */}
      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 40px",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            fontWeight: 650,
            color: "var(--text-hi)",
            marginBottom: 16,
          }}
        >
          系统提示词
        </h2>
        <pre
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--text-body)",
            lineHeight: 1.7,
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: 20,
            whiteSpace: "pre-wrap",
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          <Markdown>{employee.prompt_md}</Markdown>
        </pre>
      </section>

      {/* Linked skills */}
      {employee.skills.length > 0 && (
        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 40px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 650,
              color: "var(--text-hi)",
              marginBottom: 16,
            }}
          >
            包含的技能
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {employee.skills.map((s) => (
              <Link
                key={s.id}
                href={`/market/skills/${encodeURIComponent(s.id)}`}
                style={{
                  padding: "16px 20px",
                  background: "rgba(0,0,0,0.15)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    color: "var(--text-hi)",
                    marginBottom: 4,
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-dim)",
                    lineHeight: 1.5,
                  }}
                >
                  {s.description_zh || "暂无描述"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
