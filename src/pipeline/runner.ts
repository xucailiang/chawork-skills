import { readFile, copyFile, mkdir, stat } from "node:fs/promises"
import { resolve } from "node:path"
import type { AppConfig, ImportGithubResponse, SkillSourceInfo } from "../types.js"
import { loadConfig } from "../config.js"
import { syncAllSources } from "../sources/aggregator.js"
import { scanAndUpdateState } from "../discover/scanner.js"
import { runTranslate } from "../translate/translator.js"
import { runClassify } from "../classify/classifier.js"
import { readState } from "../state/store.js"
import { translatedDirOf } from "../translate/translator.js"
import { createSkill, getSkill, updateSkill, SKILLS_DIR } from "../store/skills.js"
import { log } from "../utils/logger.js"

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

export async function runImportPipeline(cfg: AppConfig): Promise<ImportGithubResponse> {
  log.info("[pipeline] starting: sync → scan → translate → classify → import to hub")

  await syncAllSources(cfg)
  await scanAndUpdateState(cfg)
  await runTranslate(cfg, {})
  await runClassify(cfg, {})

  const state = await readState()
  const imported: ImportGithubResponse["skills"] = []

  for (const [id, skill] of Object.entries(state.skills)) {
    if (skill.status !== "ok") continue
    if (!skill.profession) continue

    const translatedDir = translatedDirOf(id)
    const translatedSkillMd = resolve(translatedDir, "SKILL.md")
    if (!(await pathExists(translatedSkillMd))) continue

    const skillMd = await readFile(translatedSkillMd, "utf8")
    const source: SkillSourceInfo = {
      type: "github",
      repo: skill.source_name,
      path: skill.source_path,
      commit: skill.source_commit,
    }

    const existing = await getSkill(id)
    if (existing) {
      if (existing.content_hash !== skill.content_hash) {
        await updateSkill(id, {
          name: skill.name ?? id,
          description_zh: skill.description_zh ?? "",
          description_en: skill.description_en ?? "",
          profession: skill.profession,
          skill_md: skillMd,
        })
      }
    } else {
      await createSkill({
        id,
        name: skill.name ?? id,
        description_zh: skill.description_zh ?? "",
        description_en: skill.description_en ?? "",
        profession: skill.profession,
        skill_md: skillMd,
        source,
      })
    }

    // Copy original md if available
    const originalMd = resolve(translatedDir, "SKILL.original.md")
    if (await pathExists(originalMd)) {
      const destOriginal = resolve(SKILLS_DIR, id, "SKILL.original.md")
      await copyFile(originalMd, destOriginal)
    }

    imported.push({
      id,
      name: skill.name ?? id,
      profession: skill.profession,
    })
  }

  const sourceName = cfg.sources.map((s) => s.name).join(", ")
  log.info(`[pipeline] imported ${imported.length} skills from ${sourceName}`)

  return {
    source: sourceName,
    imported: imported.length,
    skills: imported,
  }
}

export async function runImportFromUrl(
  url: string,
  ref: string = "main",
): Promise<ImportGithubResponse> {
  const name = url
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\//g, "-")

  const tempConfig: AppConfig = {
    sources: [
      {
        name,
        type: "git",
        url,
        ref,
        skills_glob: "**/SKILL.md",
      },
    ],
    llm: (await loadConfig()).llm,
  }

  return runImportPipeline(tempConfig)
}
