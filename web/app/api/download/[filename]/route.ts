import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DOWNLOADS_DIR = path.join(process.cwd(), "public/downloads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // 防止路径穿越
  if (filename.includes("..") || filename.includes("/")) {
    return new NextResponse(null, { status: 404 });
  }

  const filepath = path.join(DOWNLOADS_DIR, filename);

  if (!existsSync(filepath)) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = await readFile(filepath);

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".dmg": "application/x-apple-diskimage",
    ".exe": "application/vnd.microsoft.portable-executable",
    ".zip": "application/zip",
    ".tar.gz": "application/gzip",
  };
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
