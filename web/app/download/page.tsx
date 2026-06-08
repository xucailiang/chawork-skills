import type { Metadata } from "next";
import { Download, Apple, Monitor } from "lucide-react";

export const metadata: Metadata = {
  title: "下载 ChaWork",
};

const PLATFORMS = [
  {
    name: "macOS",
    icon: Apple,
    description: "支持 Apple Silicon 和 Intel",
    filename: "ChaWork.dmg",
  },
  {
    name: "Windows",
    icon: Monitor,
    description: "Windows 10 及以上",
    filename: "ChaWork-Setup.exe",
  },
];

const DOWNLOAD_BASE = "https://github.com/xucailiang/chawork/releases";

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <Download className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">下载 ChaWork 桌面端</h1>
        <p className="mt-4 text-muted-foreground">
          安装桌面端后，可以直接从技能市场一键安装技能和员工
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <a
            key={platform.name}
            href={DOWNLOAD_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 rounded-xl border border-border p-8 transition-colors hover:bg-muted/50"
          >
            <platform.icon className="h-10 w-10 text-foreground" />
            <div className="text-center">
              <div className="text-lg font-semibold">{platform.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{platform.description}</div>
            </div>
            <div className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              前往下载
            </div>
          </a>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        ChaWork 是开源项目，你也可以从{" "}
        <a
          href="https://github.com/xucailiang/chawork"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          GitHub
        </a>{" "}
        获取源码自行编译。
      </p>
    </div>
  );
}
