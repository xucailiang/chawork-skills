import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { AppConfig, PackEntry, ProfessionPack, ProfessionsManifest, StateFile } from "../types.js"
import { translatedDirOf } from "../translate/translator.js"
import { DIST_DIR, DIST_MANIFEST, DIST_PROFESSIONS_DIR } from "../utils/paths.js"
import { sourceDir } from "../sources/git.js"
import { nowIso, readState } from "../state/store.js"
import { log } from "../utils/logger.js"
import { isProfession } from "../classify/professions.js"

async function copyExtraSkillFiles(srcDir: string, dstDir: string): Promise<void> {
  const entries = await readdir(srcDir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === "SKILL.md") continue
    const from = resolve(srcDir, e.name)
    const to = resolve(dstDir, e.name)
    if (e.isDirectory()) {
      await mkdir(to, { recursive: true })
      await copyExtraSkillFiles(from, to)
    } else if (e.isFile()) {
      await copyFile(from, to)
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

export interface ExportRunReport {
  professions: string[]
  skills_exported: number
  manifest_path: string
}

export async function runExport(cfg: AppConfig): Promise<ExportRunReport> {
  const state: StateFile = await readState()

  // Wipe and recreate dist/professions to avoid stale entries.
  await rm(DIST_PROFESSIONS_DIR, { recursive: true, force: true })
  await mkdir(DIST_PROFESSIONS_DIR, { recursive: true })

  const grouped = new Map<string, PackEntry[]>()
  let exported = 0

  for (const [id, skill] of Object.entries(state.skills)) {
    if (skill.status !== "ok") continue
    if (!skill.profession || !isProfession(skill.profession)) continue
    const translated = translatedDirOf(id)
    const translatedSkillMd = resolve(translated, "SKILL.md")
    if (!(await pathExists(translatedSkillMd))) {
      log.warn(`[export] ${id}: translated SKILL.md missing, skip`)
      continue
    }

    const profession = skill.profession
    const profDir = resolve(DIST_PROFESSIONS_DIR, profession)
    const targetDir = resolve(profDir, "skills", id)
    await mkdir(targetDir, { recursive: true })

    // Copy translated SKILL.md + SKILL.original.md
    await copyFile(translatedSkillMd, resolve(targetDir, "SKILL.md"))
    const originalMd = resolve(translated, "SKILL.original.md")
    if (await pathExists(originalMd)) {
      await copyFile(originalMd, resolve(targetDir, "SKILL.original.md"))
    }

    // Copy adjacent files from the source skill dir (sub-files like scripts/, references/, LICENSE.txt)
    const src = cfg.sources.find((s) => s.name === skill.source_name)
    if (src) {
      const srcSkillDir = resolve(sourceDir(src), skill.source_path, "..")
      if (await pathExists(srcSkillDir)) {
        await copyExtraSkillFiles(srcSkillDir, targetDir)
      }
    }

    const meta = {
      id,
      name: skill.name ?? id,
      description_zh: skill.description_zh ?? "",
      description_en: skill.description_en ?? "",
      profession,
      source: {
        repo: skill.source_name,
        path: skill.source_path,
        commit: skill.source_commit,
      },
      content_hash: skill.content_hash,
      translated_at: skill.translated_at,
    }
    await writeFile(resolve(targetDir, "skill.meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8")

    const entry: PackEntry = {
      id,
      name: meta.name,
      description_zh: meta.description_zh,
      description_en: meta.description_en,
      source: meta.source,
      content_hash: skill.content_hash,
      translated_at: skill.translated_at,
    }
    const list = grouped.get(profession) ?? []
    list.push(entry)
    grouped.set(profession, list)
    exported++
  }

  const generatedAt = nowIso()
  const manifestProfessions: ProfessionsManifest["professions"] = []
  for (const [profession, entries] of grouped) {
    entries.sort((a, b) => a.id.localeCompare(b.id))
    const pack: ProfessionPack = {
      profession,
      generated_at: generatedAt,
      skill_count: entries.length,
      skills: entries,
    }
    await writeFile(
      resolve(DIST_PROFESSIONS_DIR, profession, "pack.json"),
      JSON.stringify(pack, null, 2) + "\n",
      "utf8",
    )
    manifestProfessions.push({
      name: profession,
      skill_count: entries.length,
      skills: entries.map((e) => e.id),
    })
  }
  manifestProfessions.sort((a, b) => a.name.localeCompare(b.name, "zh"))

  const manifest: ProfessionsManifest = { generated_at: generatedAt, professions: manifestProfessions }
  await mkdir(DIST_DIR, { recursive: true })
  await writeFile(DIST_MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8")

  log.info(`[export] ${exported} skills across ${manifestProfessions.length} professions → ${DIST_MANIFEST}`)
  return {
    professions: manifestProfessions.map((p) => p.name),
    skills_exported: exported,
    manifest_path: DIST_MANIFEST,
  }
}
