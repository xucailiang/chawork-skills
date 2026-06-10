import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppleLogo } from "@phosphor-icons/react/dist/ssr/AppleLogo";
import { WindowsLogo } from "@phosphor-icons/react/dist/ssr/WindowsLogo";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";

export const metadata: Metadata = {
  title: "下载 ChaWork",
};

function getVersion(): string {
  try {
    const raw = readFileSync(
      path.join(process.cwd(), "public/downloads/version.json"),
      "utf-8"
    );
    const { version } = JSON.parse(raw);
    if (version) return version;
  } catch {}
  return "v1.0.0";
}

const VERSION = getVersion();

const PLATFORMS = [
  {
    name: "macOS",
    Icon: AppleLogo,
    desc: "仅支持 Apple Silicon (M 系列芯片)",
    arch: "ARM64",
    cmd: "brew install chawork",
    version: VERSION,
    file: "/downloads/ChaWork.dmg",
  },
  {
    name: "Windows",
    Icon: WindowsLogo,
    desc: "Windows 10 及以上",
    arch: "x64",
    cmd: "winget install ChaWork",
    version: VERSION,
    file: "/downloads/ChaWork-Setup.exe",
  },
];

export default function DownloadPage() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "180px 0 100px",
      }}
    >
      {/* Section head */}
      <div className="section-head">
        <h2 className="section-head__title">
          下载 ChaWork
          <br />
          桌面客户端
        </h2>
        <p className="section-head__desc">
          安装后可直接从技能市场一键安装技能和员工，支持 macOS 和 Windows。开源免费。
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {PLATFORMS.map(({ name, Icon, desc, arch, cmd, version, file }) => (
          <div
            key={name}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "border-color 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Icon size={36} weight="duotone" style={{ color: "var(--text-hi)" }} />
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--text-dim)",
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                {arch}
              </span>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.3rem",
                  fontWeight: 650,
                  color: "var(--text-hi)",
                  marginBottom: 4,
                }}
              >
                {name}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-dim)" }}>{desc}</p>
            </div>

            {/* Terminal install command */}
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "14px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                color: "var(--text-body)",
              }}
            >
              <span style={{ color: "var(--amber)" }}>$</span> {cmd}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
              <a
                href={file}
                download
                className="btn btn--primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                下载
              </a>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text-dim)",
                }}
              >
                {version}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Source build note */}
      <div
        style={{
          textAlign: "center",
          marginTop: 40,
          padding: "28px 32px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <GithubLogo size={20} weight="duotone" style={{ color: "var(--text-dim)" }} />
        <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>
          ChaWork 是开源项目，你也可以从{" "}
          <a
            href="https://github.com/xucailiang/chawork"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--amber)", textDecoration: "none" }}
          >
            GitHub
          </a>{" "}
          获取源码自行编译。
        </p>
      </div>

    </div>
  );
}
