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
import { SOURCES_DIR } from "../utils/paths.js"
import { parseSkill } from "../utils/markdown.js"
import { rebuildIndex } from "../server/search.js"
import { log } from "../utils/logger.js"

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function tryReadFile(p: string): Promise<string | null> {
  if (!(await pathExists(p))) return null
  return readFile(p, "utf8")
}

interface ImportJob {
  id: string
  url: string
  ref?: string
  status: "syncing" | "translating" | "done" | "error"
  imported: number
  skills: ImportGithubResponse["skills"]
  error?: string
  started_at: string
  finished_at?: string
}

const jobs = new Map<string, ImportJob>()
let jobCounter = 0

let onTranslateDone: (() => void) | null = null

export function setOnTranslateDone(cb: () => void) {
  onTranslateDone = cb
}

export function getJob(id: string): ImportJob | undefined {
  return jobs.get(id)
}

export function listJobs(): ImportJob[] {
  return [...jobs.values()].reverse()
}

async function importSkillsFromState(cfg: AppConfig): Promise<ImportGithubResponse["skills"]> {
  const state = await readState()
  const imported: ImportGithubResponse["skills"] = []

  for (const [id, skill] of Object.entries(state.skills)) {
    if (skill.status === "deleted") continue

    const translatedDir = translatedDirOf(id)
    const translatedSkillMd = resolve(translatedDir, "SKILL.md")
    const sourceSkillMd = resolve(SOURCES_DIR, skill.source_name, skill.source_path)

    const skillMd =
      (await tryReadFile(translatedSkillMd)) ??
      (await tryReadFile(sourceSkillMd))

    if (!skillMd) {
      log.error(`[pipeline] skip ${id}: no SKILL.md found`)
      continue
    }

    const profession = skill.profession || "通用技能"

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
          profession,
          skill_md: skillMd,
        })
      }
    } else {
      await createSkill({
        id,
        name: skill.name ?? id,
        description_zh: skill.description_zh ?? "",
        description_en: skill.description_en ?? "",
        profession,
        skill_md: skillMd,
        source,
      })
    }

    const originalMd = resolve(translatedDir, "SKILL.original.md")
    if (await pathExists(originalMd)) {
      const destOriginal = resolve(SKILLS_DIR, id, "SKILL.original.md")
      await copyFile(originalMd, destOriginal)
    }

    imported.push({ id, name: skill.name ?? id, profession })
  }

  return imported
}

interface ParsedGitUrl {
  repoUrl: string
  ref?: string
  subpath?: string
}

function parseGitHubUrl(url: string): ParsedGitUrl | null {
  // https://github.com/user/repo/tree/branch/path/to/dir
  // https://github.com/user/repo/blob/branch/path/to/file.md
  const treeMatch = url.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)\/(tree|blob)\/([^/]+)\/(.+)$/)
  if (treeMatch?.[1]) {
    return {
      repoUrl: treeMatch[1],
      ref: treeMatch[3] ?? "main",
      subpath: treeMatch[4] ?? "",
    }
  }

  // https://gitlab.com/user/repo/-/tree/branch/path
  const gitlabMatch = url.match(/^(https:\/\/[^/]+\/[^/]+\/[^/]+)\/-\/(tree|blob)\/([^/]+)\/(.+)$/)
  if (gitlabMatch?.[1]) {
    return {
      repoUrl: gitlabMatch[1],
      ref: gitlabMatch[3] ?? "main",
      subpath: gitlabMatch[4] ?? "",
    }
  }

  return null
}

function isDirectFileUrl(url: string): boolean {
  const lower = url.toLowerCase()
  if (lower.includes("raw.githubusercontent.com")) return true
  if (lower.includes("gist.githubusercontent.com")) return true
  // blob pointing to a .md file
  if (/\/blob\/[^/]+\/.+\.md$/i.test(lower)) return true
  // plain .md URL (but not tree/blob paths)
  if (lower.endsWith(".md") && !lower.includes("/tree/") && !lower.includes("/blob/")) return true
  return false
}

function githubBlobToRaw(url: string): string {
  // https://github.com/user/repo/blob/main/path/SKILL.md
  // → https://raw.githubusercontent.com/user/repo/main/path/SKILL.md
  return url.replace(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/,
    "https://raw.githubusercontent.com/$1/$2",
  )
}

type ImportResult = { job_id: string; status: string; imported: number; skills: ImportGithubResponse["skills"] }

export async function runImportFromUrl(url: string, ref: string = "main"): Promise<ImportResult> {
  // Direct file link (raw URL or blob to .md)
  if (isDirectFileUrl(url)) {
    const rawUrl = githubBlobToRaw(url)
    return importFromDirectUrl(rawUrl)
  }

  // GitHub/GitLab URL with tree/blob path → extract repo + ref + subpath
  const parsed = parseGitHubUrl(url)
  if (parsed) {
    if (parsed.subpath?.toLowerCase().endsWith(".md")) {
      // Pointing to a single file → direct download
      const rawUrl = `https://raw.githubusercontent.com/${parsed.repoUrl.replace("https://github.com/", "")}/${parsed.ref}/${parsed.subpath}`
      return importFromDirectUrl(rawUrl)
    }
    // Pointing to a directory → clone repo with ref + include_paths
    return importFromGitRepo(parsed.repoUrl, parsed.ref || ref, parsed.subpath)
  }

  // Plain repo URL
  return importFromGitRepo(url, ref)
}

async function importFromDirectUrl(
  url: string,
): Promise<{ job_id: string; status: string; imported: number; skills: ImportGithubResponse["skills"] }> {
  const jobId = `job-${++jobCounter}-${Date.now()}`
  const job: ImportJob = {
    id: jobId,
    url,
    status: "syncing",
    imported: 0,
    skills: [],
    started_at: new Date().toISOString(),
  }
  jobs.set(jobId, job)

  log.info(`[pipeline] ${jobId}: direct file import from ${url}`)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  const skillMd = await res.text()

  const parsed = parseSkill(skillMd)
  const frontmatter = parsed.data
  const name = (frontmatter.name as string) || deriveNameFromUrl(url)
  const id = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
  const description = (frontmatter.description as string) || ""

  const source: SkillSourceInfo = { type: "manual", author: url }

  const existing = await getSkill(id)
  if (existing) {
    await updateSkill(id, {
      name,
      description_zh: description,
      description_en: description,
      profession: "通用技能",
      skill_md: skillMd,
    })
  } else {
    await createSkill({
      id,
      name,
      description_zh: description,
      description_en: description,
      profession: "通用技能",
      skill_md: skillMd,
      source,
    })
  }

  const imported = [{ id, name, profession: "通用技能" }]
  job.imported = 1
  job.skills = imported
  job.status = "translating"

  log.info(`[pipeline] ${jobId}: imported skill "${name}" from direct URL`)

  await rebuildIndex()

  // Background translate
  runTranslateDirectBackground(jobId, id).catch(() => {})

  return {
    job_id: jobId,
    status: "translating",
    imported: 1,
    skills: imported,
  }
}

function deriveNameFromUrl(url: string): string {
  const parts = url.split("/")
  const filename = parts[parts.length - 1] || "imported-skill"
  return filename.replace(/\.md$/i, "").replace(/SKILL/i, "").replace(/^-+|-+$/g, "") || "imported-skill"
}

async function runTranslateDirectBackground(jobId: string, skillId: string): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  try {
    const cfg = await loadConfig()
    const skill = await getSkill(skillId)
    if (!skill) return

    const { buildProvider } = await import("../llm/provider.js")
    const llm = buildProvider(cfg.llm)

    const skillMdRaw = await readFile(resolve(SKILLS_DIR, skillId, "SKILL.md"), "utf8")
    const truncated = skillMdRaw.slice(0, 3000)

    // Translate description
    try {
      const translateResult = await llm.complete({
        system: "你是专业的技术翻译。将以下 Skill 的描述翻译成中文。只输出翻译后的中文描述，不要任何解释。",
        user: `Skill 内容:\n${truncated}`,
        temperature: 0.2,
      })
      await updateSkill(skillId, { description_zh: translateResult.trim().slice(0, 500) })
    } catch (e) {
      log.error(`[pipeline] ${jobId}: translate failed: ${e instanceof Error ? e.message : e}`)
    }

    // Classify profession
    try {
      const classifyResult = await llm.complete({
        system: '你是 Skill 分类器。将以下 Skill 分类到最匹配的职业。只输出 JSON: {"profession":"职业名"}。可选职业：开发工程师, AI 工程师, 数据工程师, 数据分析师, 运维工程师, 测试工程师, 安全工程师, 架构师, 技术写作, 产品经理, 设计师, 市场营销, 内容运营, 用户运营, 品牌公关, 电商运营, 销售支持, 客户支持, 项目管理, 人力资源, 财务会计, 法务合规, 行政管理, 教育培训, 翻译本地化, 科研学术, 咨询顾问, 金融科技, 医疗健康, 智能制造, 供应链管理, 创业管理, 团队管理, 个人效率, 通用技能',
        user: `Skill 内容:\n${truncated}`,
        json: true,
        temperature: 0.1,
      })
      const parsed = JSON.parse(classifyResult)
      if (parsed.profession) {
        await updateSkill(skillId, { profession: parsed.profession })
      }
    } catch (e) {
      log.error(`[pipeline] ${jobId}: classify failed: ${e instanceof Error ? e.message : e}`)
    }

    job.status = "done"
    job.finished_at = new Date().toISOString()
    log.info(`[pipeline] ${jobId}: direct import translate+classify done`)

    if (onTranslateDone) onTranslateDone()
  } catch (e) {
    log.error(`[pipeline] ${jobId}: background failed: ${e instanceof Error ? e.message : e}`)
    job.status = "done"
    job.finished_at = new Date().toISOString()
    if (onTranslateDone) onTranslateDone()
  }
}

async function importFromGitRepo(
  url: string,
  ref: string,
  subpath?: string,
): Promise<ImportResult> {
  const name = url
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\.git$/, "")
    .replace(/\//g, "-")
    || `import-${Date.now()}`

  const jobId = `job-${++jobCounter}-${Date.now()}`
  const job: ImportJob = {
    id: jobId,
    url,
    ref,
    status: "syncing",
    imported: 0,
    skills: [],
    started_at: new Date().toISOString(),
  }
  jobs.set(jobId, job)

  const cfg: AppConfig = {
    sources: [
      {
        name,
        type: "git",
        url,
        ref: ref === "main" ? undefined : ref,
        skills_glob: "**/SKILL.md",
        include_paths: subpath ? [subpath] : undefined,
      },
    ],
    llm: (await loadConfig()).llm,
  }

  // Fully async — return immediately, run everything in background
  runGitImportBackground(jobId, cfg).catch(() => {})

  return {
    job_id: jobId,
    status: "syncing",
    imported: 0,
    skills: [],
  }
}

async function runGitImportBackground(jobId: string, cfg: AppConfig): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  try {
    log.info(`[pipeline] ${jobId}: sync → scan → import from ${job.url}`)
    await syncAllSources(cfg)
    await scanAndUpdateState(cfg)
    const imported = await importSkillsFromState(cfg)

    job.imported = imported.length
    job.skills = imported

    const sourceName = cfg.sources.map((s) => s.name).join(", ")
    log.info(`[pipeline] ${jobId}: imported ${imported.length} skills from ${sourceName} (raw)`)

    if (onTranslateDone) onTranslateDone()

    // Phase 2: translate + classify
    job.status = "translating"
    await runTranslateBackground(jobId, cfg)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[pipeline] ${jobId}: import failed: ${msg}`)
    job.status = "error"
    job.error = msg
    job.finished_at = new Date().toISOString()
  }
}

async function runTranslateBackground(jobId: string, cfg: AppConfig): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  try {
    log.info(`[pipeline] ${jobId}: background translate starting...`)
    await runTranslate(cfg, {})
    await runClassify(cfg, {})

    const updated = await importSkillsFromState(cfg)
    job.skills = updated
    job.imported = updated.length
    job.status = "done"
    job.finished_at = new Date().toISOString()
    log.info(`[pipeline] ${jobId}: translate+classify done, ${updated.length} skills updated`)

    if (onTranslateDone) onTranslateDone()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[pipeline] ${jobId}: background translate failed: ${msg}`)
    job.status = "done"
    job.finished_at = new Date().toISOString()

    if (onTranslateDone) onTranslateDone()
  }
}

// Legacy: full sync pipeline (used by CLI `run` command)
export async function runImportPipeline(cfg: AppConfig): Promise<ImportGithubResponse> {
  log.info("[pipeline] starting: sync → scan → translate → classify → import to hub")

  await syncAllSources(cfg)
  await scanAndUpdateState(cfg)

  try { await runTranslate(cfg, {}) } catch (e) {
    log.error(`[pipeline] translate failed (non-fatal): ${e instanceof Error ? e.message : e}`)
  }
  try { await runClassify(cfg, {}) } catch (e) {
    log.error(`[pipeline] classify failed (non-fatal): ${e instanceof Error ? e.message : e}`)
  }

  const imported = await importSkillsFromState(cfg)
  const sourceName = cfg.sources.map((s) => s.name).join(", ")
  log.info(`[pipeline] imported ${imported.length} skills from ${sourceName}`)

  return { source: sourceName, imported: imported.length, skills: imported }
}
