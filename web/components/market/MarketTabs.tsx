import Link from "next/link";

interface MarketTabsProps {
  active: "skills" | "employees";
}

export function MarketTabs({ active }: MarketTabsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Link
        href="/market/skills"
        style={{
          padding: "9px 20px",
          borderRadius: 999,
          fontFamily: "var(--font-display)",
          fontSize: "0.9rem",
          fontWeight: active === "skills" ? 600 : 500,
          color: active === "skills" ? "#0c0c12" : "var(--text-body)",
          background: active === "skills" ? "#fff" : "transparent",
          textDecoration: "none",
          transition: "color 0.3s ease, background 0.3s ease",
        }}
      >
        技能
      </Link>
      <Link
        href="/market/employees"
        style={{
          padding: "9px 20px",
          borderRadius: 999,
          fontFamily: "var(--font-display)",
          fontSize: "0.9rem",
          fontWeight: active === "employees" ? 600 : 500,
          color: active === "employees" ? "#0c0c12" : "var(--text-body)",
          background: active === "employees" ? "#fff" : "transparent",
          textDecoration: "none",
          transition: "color 0.3s ease, background 0.3s ease",
        }}
      >
        员工
      </Link>
    </div>
  );
}
