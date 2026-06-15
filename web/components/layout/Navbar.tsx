"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { List as ListIcon, X as XIcon } from "@phosphor-icons/react";
import { emitOpenAdminPanel } from "@/lib/admin-events";

const NAV_ITEMS = [
  { href: "/market/skills", label: "技能市场" },
  { href: "/market/employees", label: "员工市场" },
  { href: "/download", label: "下载" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctaClickCountRef = useRef(0);
  const ctaClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCtaClick = useCallback((e: React.MouseEvent) => {
    ctaClickCountRef.current += 1;
    if (ctaClickTimerRef.current) clearTimeout(ctaClickTimerRef.current);
    if (ctaClickCountRef.current >= 5) {
      e.preventDefault();
      ctaClickCountRef.current = 0;
      router.push("/admin");
      return;
    }
    ctaClickTimerRef.current = setTimeout(() => {
      ctaClickCountRef.current = 0;
    }, 1500);
  }, [router]);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      e.preventDefault();
      clickCountRef.current = 0;
      emitOpenAdminPanel();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([e]) => setScrolled(!e.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Sentinel for scroll detection */}
      <div ref={sentinelRef} style={{ position: "absolute", top: 0, height: 1, pointerEvents: "none" }} />

      <header
        className={`nav ${scrolled ? "nav--scrolled" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 0",
          transition: "background 0.3s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
          ...(scrolled
            ? {
                background: "rgba(12,12,18,0.88)",
                backdropFilter: "blur(20px) saturate(1.4)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
              }
            : {}),
        }}
      >
        <div
          style={{
            width: "min(1320px, 92%)",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            onClick={handleLogoClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "var(--text-hi)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            <img
              src="/logo.png"
              alt="ChaWork"
              style={{
                height: 32,
                width: "auto",
              }}
            />
            <span>ChaWork</span>
          </Link>

          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav__link"
                style={{
                  color: pathname.startsWith(item.href) ? "var(--text-hi)" : "var(--text-body)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 450,
                  position: "relative",
                  transition: "color 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
                }}
              >
                {item.label}
                <span
                  style={{
                    position: "absolute",
                    bottom: -4,
                    left: 0,
                    width: pathname.startsWith(item.href) ? "100%" : "0",
                    height: "1.5px",
                    background: "var(--amber)",
                    transition: "width 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                />
              </Link>
            ))}
            <Link
              href="/market/skills"
              onClick={handleCtaClick}
              style={{
                padding: "9px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "var(--text-hi)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
              }}
            >
              开始使用
            </Link>
          </div>

          <button
            className="nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-hi)",
            }}
          >
            {menuOpen ? <XIcon size={22} weight="bold" /> : <ListIcon size={22} weight="bold" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "rgba(8,8,12,0.97)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 600,
                color: "var(--text-hi)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

    </>
  );
}
