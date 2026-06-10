import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { getSkillDetail } from "@/lib/api";
import { InstallButton } from "@/components/market/InstallButton";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

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
        href="/market/skills"
        className="btn btn--ghost btn--sm"
        style={{ marginBottom: 32, gap: 6 }}
      >
        <ArrowLeft size={14} weight="bold" />
        返回技能市场
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
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-hi)",
                marginBottom: 16,
              }}
            >
              {skill.name}
            </h1>
            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--text-dim)",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              {skill.description_zh || skill.description_en}
            </p>
            <InstallButton type="skill" id={skill.id} />
          </div>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
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
              {skill.profession}
            </span>
            {skill.source.type === "github" && skill.source.repo && (
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
                {skill.source.repo}
              </span>
            )}
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
              {skill.updated_at?.slice(0, 10) || "-"}
            </span>
          </div>

          {skill.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skill.tags.map((tag) => (
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
        </div>
      </section>

      {/* Markdown body */}
      <article
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px",
          fontSize: "0.92rem",
          lineHeight: 1.8,
          color: "var(--text-body)",
        }}
      >
        <style>{`
          article h1, article h2, article h3 {
            font-family: var(--font-display);
            color: var(--text-hi);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          article h1 { font-size: 1.6rem; }
          article h2 { font-size: 1.3rem; }
          article h3 { font-size: 1.1rem; }
          article code {
            font-family: var(--font-mono);
            font-size: 0.85em;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(0,0,0,0.2);
            color: var(--amber);
          }
          article pre {
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 20px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 0.82rem;
            line-height: 1.7;
          }
          article pre code {
            background: none;
            padding: 0;
            color: var(--text-body);
          }
          article strong { color: var(--text-hi); }
          article a { color: var(--amber); }
          article ul, article ol { padding-left: 1.5em; }
          article li { margin: 0.3em 0; }
        `}</style>
        <Markdown>{skill.skill_md}</Markdown>
      </article>

      {/* Referenced employees */}
      {skill.referenced_by_employees.length > 0 && (
        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 40px",
            marginTop: 16,
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
            引用此技能的员工
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skill.referenced_by_employees.map((eid) => (
              <Link
                key={eid}
                href={`/market/employees/${encodeURIComponent(eid)}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: "0.85rem",
                  color: "var(--cyan)",
                  background: "var(--cyan-dim)",
                  border: "1px solid rgba(0,229,255,0.12)",
                  textDecoration: "none",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.3s ease",
                }}
              >
                {eid}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
