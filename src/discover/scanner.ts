import { readFile, readdir, stat } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"
import type { AppConfig, SkillState, SourceConfig, StateFile } from "../types.js"
import { sourceDir } from "../sources/git.js"
import { parseSkill } from "../utils/markdown.js"
import { sha256 } from "../utils/hash.js"
import { log } from "../utils/logger.js"
import { nowIso, readState, writeState } from "../state/store.js"

export interface ScannedSkill {
  id: string
  source_name: string
  source_path: string  // relative to source dir
  abs_skill_md: string
  abs_skill_dir: string
  content_hash: string
  frontmatter: Record<string, unknown>
}

const IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", "target", ".github", ".vscode", ".idea"])

async function walkForSkillMd(root: string, filenames?: string[]): Promise<string[]> {
  const targetNames = new Set(filenames?.length ? filenames : ["SKILL.md"])
  const found: string[] = []
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      if (IGNORE_DIRS.has(e.name)) continue
      const full = resolve(dir, e.name)
      if (e.isDirectory()) {
        await walk(full)
      } else if (e.isFile() && targetNames.has(e.name)) {
        found.push(full)
      }
    }
  }
  if ((await stat(root).catch(() => null))?.isDirectory()) {
    await walk(root)
  }
  return found
}

function slugFromRelDir(relDir: string): string {
  return relDir
    .split(sep)
    .filter(Boolean)
    .join("--")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase() || "root"
}

export function makeSkillId(sourceName: string, relSkillMdPath: string): string {
  const relDir = dirname(relSkillMdPath)
  const slug = slugFromRelDir(relDir)
  return `${sourceName}--${slug}`
}

export async function scanSource(source: SourceConfig): Promise<ScannedSkill[]> {
  const root = sourceDir(source)
  const includePaths = source.include_paths
  const scanRoots = includePaths?.length
    ? includePaths.map(p => resolve(root, p))
    : [root]

  let skillMdFiles: string[] = []
  for (const sr of scanRoots) {
    skillMdFiles.push(...await walkForSkillMd(sr, source.skill_filenames))
  }

  const out: ScannedSkill[] = []
  for (const abs of skillMdFiles) {
    const rel = relative(root, abs)
    const raw = await readFile(abs, "utf8")
    const parsed = parseSkill(raw)
    out.push({
      id: makeSkillId(source.name, rel),
      source_name: source.name,
      source_path: rel,
      abs_skill_md: abs,
      abs_skill_dir: dirname(abs),
      content_hash: sha256(raw),
      frontmatter: parsed.data,
    })
  }
  return out
}

export interface ScanReport {
  added: string[]
  changed: string[]
  unchanged: string[]
  deleted: string[]
  total: number
}

export async function scanAndUpdateState(config: AppConfig): Promise<ScanReport> {
  const state: StateFile = await readState()
  const allScanned: ScannedSkill[] = []
  for (const src of config.sources) {
    const list = await scanSource(src)
    allScanned.push(...list)
    log.info(`[scan] ${src.name}: ${list.length} skills`)
  }

  const report: ScanReport = { added: [], changed: [], unchanged: [], deleted: [], total: allScanned.length }
  const sourceCommits: Record<string, string | undefined> = {}
  for (const [name, s] of Object.entries(state.sources)) sourceCommits[name] = s.last_commit

  const seenIds = new Set<string>()
  for (const sk of allScanned) {
    seenIds.add(sk.id)
    const prev = state.skills[sk.id]
    const name = typeof sk.frontmatter.name === "string" ? sk.frontmatter.name : sk.id
    const desc = typeof sk.frontmatter.description === "string" ? sk.frontmatter.description : ""
    const patch: Partial<SkillState> = {
      source_name: sk.source_name,
      source_path: sk.source_path,
      source_commit: sourceCommits[sk.source_name],
      name,
      description_en: desc,
      content_hash: sk.content_hash,
    }
    if (!prev) {
      report.added.push(sk.id)
      state.skills[sk.id] = {
        ...patch,
        id: sk.id,
        status: "pending",
        updated_at: nowIso(),
      } as SkillState
    } else if (prev.content_hash !== sk.content_hash) {
      report.changed.push(sk.id)
      state.skills[sk.id] = {
        ...prev,
        ...patch,
        status: "pending",
        updated_at: nowIso(),
      }
    } else {
      report.unchanged.push(sk.id)
      state.skills[sk.id] = { ...prev, ...patch, updated_at: prev.updated_at }
    }
  }

  for (const id of Object.keys(state.skills)) {
    if (!seenIds.has(id) && state.skills[id]?.status !== "deleted") {
      const existing = state.skills[id]!
      state.skills[id] = { ...existing, status: "deleted", updated_at: nowIso() }
      report.deleted.push(id)
    }
  }

  await writeState(state)
  log.info(
    `[scan] +${report.added.length} ~${report.changed.length} =${report.unchanged.length} -${report.deleted.length}`,
  )
  return report
}
