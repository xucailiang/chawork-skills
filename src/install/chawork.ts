import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { homedir, platform } from "node:os"
import { resolve } from "node:path"
import type { ProfessionsManifest } from "../types.js"
import { DIST_MANIFEST, DIST_PROFESSIONS_DIR } from "../utils/paths.js"
import { log } from "../utils/logger.js"
import { isProfession } from "../classify/professions.js"

const MANIFEST_FILE = "_chawork_skills_manifest.json"

export function defaultChaworkRoot(): string {
  const p = platform()
  const home = homedir()
  if (p === "darwin") return resolve(home, "Library/Application Support/com.chawork.app/root")
  if (p === "linux") return resolve(home, ".local/share/com.chawork.app/root")
  if (p === "win32") {
    const appData = process.env.APPDATA ?? resolve(home, "AppData", "Roaming")
    return resolve(appData, "com.chawork.app", "root")
  }
  return resolve(home, ".chawork", "root")
}

export interface InstallManifest {
  installed_at: string
  by: "chawork-skills"
  entries: {
    skill_id: string
    profession: string
    installed_at: string
    files: string[] // relative paths inside skill dir
  }[]
}

async function readInstallManifest(chaworkRoot: string): Promise<InstallManifest> {
  const path = resolve(chaworkRoot, "skills", MANIFEST_FILE)
  try {
    const raw = await readFile(path, "utf8")
    return JSON.parse(raw) as InstallManifest
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === "ENOENT") {
      return { installed_at: "", by: "chawork-skills", entries: [] }
    }
    throw err
  }
}

async function writeInstallManifest(chaworkRoot: string, m: InstallManifest): Promise<void> {
  const dir = resolve(chaworkRoot, "skills")
  await mkdir(dir, { recursive: true })
  await writeFile(resolve(dir, MANIFEST_FILE), JSON.stringify(m, null, 2) + "\n", "utf8")
}

async function copyDirRecursive(from: string, to: string, files: string[], relPrefix = ""): Promise<void> {
  const entries = await readdir(from, { withFileTypes: true })
  for (const e of entries) {
    const src = resolve(from, e.name)
    const dst = resolve(to, e.name)
    const rel = relPrefix ? `${relPrefix}/${e.name}` : e.name
    if (e.isDirectory()) {
      await mkdir(dst, { recursive: true })
      await copyDirRecursive(src, dst, files, rel)
    } else if (e.isFile()) {
      if (e.name === "SKILL.original.md") continue
      await copyFile(src, dst)
      files.push(rel)
    }
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

export interface InstallOptions {
  professions: string[]
  chaworkRoot?: string
  force?: boolean
}

export interface InstallReport {
  chawork_root: string
  installed: { skill_id: string; profession: string }[]
  skipped: { skill_id: string; reason: string }[]
}

export async function listProfessionsFromManifest(): Promise<{ name: string; skill_count: number }[]> {
  const raw = await readFile(DIST_MANIFEST, "utf8")
  const m = JSON.parse(raw) as ProfessionsManifest
  return m.professions.map((p) => ({ name: p.name, skill_count: p.skill_count }))
}

export async function installToChawork(opts: InstallOptions): Promise<InstallReport> {
  for (const p of opts.professions) {
    if (!isProfession(p)) throw new Error(`unknown profession: ${p}`)
  }
  const chaworkRoot = opts.chaworkRoot ?? defaultChaworkRoot()

  const raw = await readFile(DIST_MANIFEST, "utf8")
  const manifest = JSON.parse(raw) as ProfessionsManifest

  const wanted = new Set(opts.professions)
  const skillsDir = resolve(chaworkRoot, "skills")
  await mkdir(skillsDir, { recursive: true })

  const install: InstallManifest = await readInstallManifest(chaworkRoot)
  const installed: InstallReport["installed"] = []
  const skipped: InstallReport["skipped"] = []
  const installedAt = new Date().toISOString()

  for (const prof of manifest.professions) {
    if (!wanted.has(prof.name)) continue
    for (const skillId of prof.skills) {
      const srcDir = resolve(DIST_PROFESSIONS_DIR, prof.name, "skills", skillId)
      if (!(await pathExists(srcDir))) {
        skipped.push({ skill_id: skillId, reason: "missing in dist/" })
        continue
      }
      const dstDir = resolve(skillsDir, skillId)
      const dstSkillMd = resolve(dstDir, "SKILL.md")
      const alreadyInstalled = await pathExists(dstSkillMd)
      const ourEntry = install.entries.find((e) => e.skill_id === skillId)
      if (alreadyInstalled && !ourEntry && !opts.force) {
        skipped.push({ skill_id: skillId, reason: "destination occupied by a non-chawork-skills skill (use --force)" })
        continue
      }
      // refresh: remove previously installed files we placed (only the dir tree if ours), then re-copy
      if (ourEntry) {
        await rm(dstDir, { recursive: true, force: true })
      }
      await mkdir(dstDir, { recursive: true })
      const files: string[] = []
      await copyDirRecursive(srcDir, dstDir, files)
      installed.push({ skill_id: skillId, profession: prof.name })

      const newEntry = { skill_id: skillId, profession: prof.name, installed_at: installedAt, files }
      const idx = install.entries.findIndex((e) => e.skill_id === skillId)
      if (idx >= 0) install.entries[idx] = newEntry
      else install.entries.push(newEntry)
    }
  }

  install.installed_at = installedAt
  await writeInstallManifest(chaworkRoot, install)

  log.info(`[install] ${installed.length} skills → ${skillsDir}`)
  return { chawork_root: chaworkRoot, installed, skipped }
}
