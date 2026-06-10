import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DOWNLOADS_DIR = path.join(process.cwd(), "public/downloads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const version = formData.get("version") as string | null;
    const macosFile = formData.get("macos") as File | null;
    const windowsFile = formData.get("windows") as File | null;

    await mkdir(DOWNLOADS_DIR, { recursive: true });

    if (macosFile && macosFile.size > 0) {
      const buffer = Buffer.from(await macosFile.arrayBuffer());
      await writeFile(path.join(DOWNLOADS_DIR, "ChaWork.dmg"), buffer);
    }

    if (windowsFile && windowsFile.size > 0) {
      const buffer = Buffer.from(await windowsFile.arrayBuffer());
      await writeFile(path.join(DOWNLOADS_DIR, "ChaWork-Setup.exe"), buffer);
    }

    if (version) {
      await writeFile(
        path.join(DOWNLOADS_DIR, "version.json"),
        JSON.stringify({ version }),
        "utf-8"
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "upload failed" },
      { status: 500 }
    );
  }
}
