import { mkdir, stat } from "node:fs/promises"
import { resolve } from "node:path"
import simpleGit from "simple-git"
import type { SourceConfig } from "../types.js"
import { SOURCES_DIR } from "../utils/paths.js"
import { log } from "../utils/logger.js"

export function sourceDir(source: SourceConfig): string {
  return resolve(SOURCES_DIR, source.name)
}

async function isDir(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isDirectory()
  } catch {
    return false
  }
}

export interface SyncResult {
  source: string
  dir: string
  commit: string
}

export async function syncGitSource(source: SourceConfig): Promise<SyncResult> {
  if (source.type !== "git") throw new Error(`syncGitSource: unsupported type ${source.type}`)
  await mkdir(SOURCES_DIR, { recursive: true })
  const dir = sourceDir(source)
  const exists = await isDir(resolve(dir, ".git"))

  if (!exists) {
    log.info(`[git] cloning ${source.url} → ${dir}`)
    await simpleGit().clone(source.url, dir, ["--depth", "1", "--branch", source.ref ?? "main"])
  } else {
    log.info(`[git] pulling ${source.name}`)
    const git = simpleGit(dir)
    await git.fetch("origin", source.ref ?? "main", ["--depth", "1"])
    await git.checkout(source.ref ?? "main")
    await git.reset(["--hard", `origin/${source.ref ?? "main"}`])
  }

  const head = await simpleGit(dir).revparse(["HEAD"])
  return { source: source.name, dir, commit: head.trim() }
}
