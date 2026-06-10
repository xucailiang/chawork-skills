import Link from "next/link";
import { House } from "@phosphor-icons/react/dist/ssr/House";

export default function NotFound() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "200px 0 100px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "var(--amber)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 24,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700,
          color: "var(--text-hi)",
          marginBottom: 12,
        }}
      >
        页面未找到
      </h1>
      <p
        style={{
          color: "var(--text-dim)",
          fontSize: "1rem",
          marginBottom: 40,
        }}
      >
        你访问的页面不存在或已被移除。
      </p>
      <Link href="/" className="btn btn--primary">
        <House size={16} weight="bold" />
        <span>返回首页</span>
      </Link>
    </div>
  );
}
