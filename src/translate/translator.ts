import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { AppConfig, OverrideFile, SkillState, StateFile } from "../types.js"
import { sourceDir } from "../sources/git.js"
import { parseSkill, stringifySkill } from "../utils/markdown.js"
import { sha256 } from "../utils/hash.js"
import { log } from "../utils/logger.js"
import { nowIso, readState, writeState } from "../state/store.js"
import { buildProvider } from "../llm/provider.js"
import { readOverride } from "../state/overrides.js"
import { TRANSLATED_DIR } from "../utils/paths.js"

export function translatedDirOf(id: string): string {
  return resolve(TRANSLATED_DIR, id)
}

export interface TranslateResult {
  id: string
  translated_markdown: string
  translated_description: string
  original_description: string
  source_lang: string
  translated_by: string
}

const SYSTEM_PROMPT = `你是一名资深技术文档译者。请把英文 Claude Code Skill 文档翻译成简体中文，遵循以下铁律：

1. 保持 markdown 结构（标题层级、列表、表格、引用、加粗、斜体）不变。
2. 所有代码块（含 \`\`\` 围栏）、行内代码、URL、文件路径、命令、环境变量、函数名、变量名、API 端点、参数名都必须**原样保留**，不要翻译，不要改大小写。
3. 只翻译说明性自然语言：段落、标题、列表中的描述性文字。
4. frontmatter 已经被剥离，请只翻译正文。
5. 译文要专业、自然、准确，符合中文技术读者的阅读习惯，避免机翻腔。
6. 输出只包含翻译后的正文 markdown，不要任何前后说明、不要再包代码围栏。`

const DESC_SYSTEM_PROMPT = `请把以下英文 description 翻译成简体中文。要求：准确、专业、自然，保留所有产品名、命令、文件路径、关键词。只输出译文一行，不要引号、不要说明。`

export async function translateOne(
  cfg: AppConfig,
  state: StateFile,
  skill: SkillState,
): Promise<SkillState> {
  if (!skill.source_name || !skill.source_path) {
    throw new Error(`translateOne(${skill.id}): missing source_name/source_path`)
  }
  const src = cfg.sources.find((s) => s.name === skill.source_name)
  if (!src) throw new Error(`translateOne(${skill.id}): source ${skill.source_name} not in config`)

  const abs = resolve(sourceDir(src), skill.source_path)
  const raw = await readFile(abs, "utf8")
  const parsed = parseSkill(raw)

  const provider = buildProvider(cfg.llm)
  const originalDesc = typeof parsed.data.description === "string" ? parsed.data.description : ""
  let translatedDesc = ""
  if (originalDesc.trim()) {
    translatedDesc = (
      await provider.complete({ system: DESC_SYSTEM_PROMPT, user: originalDesc, temperature: 0.2 })
    )
      .trim()
      .replace(/^["'`]|["'`]$/g, "")
  }
  // For very short / placeholder bodies, skip LLM call to avoid chat-style noise.
  const meaningfulBody = parsed.body.replace(/^#+\s.*$/gm, "").replace(/\s+/g, " ").trim()
  const translatedBody = meaningfulBody.length < 40
    ? parsed.body
    : (await provider.complete({ system: SYSTEM_PROMPT, user: parsed.body, temperature: 0.2 })).trim()

  const newData: Record<string, unknown> = { ...parsed.data }
  if (translatedDesc) {
    newData.description = translatedDesc
    newData.original_description = originalDesc
  }
  newData.source_lang = "en"
  newData.translated_by = provider.name
  newData.translated_at = nowIso()
  if (skill.source_commit) newData.source_commit = skill.source_commit

  const translatedMarkdown = stringifySkill(newData, translatedBody)
  const translatedHash = sha256(translatedMarkdown)

  // Persist translation artifacts to disk for the export step.
  const outDir = translatedDirOf(skill.id)
  await mkdir(outDir, { recursive: true })
  await writeFile(resolve(outDir, "SKILL.md"), translatedMarkdown, "utf8")
  await writeFile(resolve(outDir, "SKILL.original.md"), raw, "utf8")

  return {
    ...skill,
    description_en: originalDesc,
    description_zh: translatedDesc || originalDesc,
    translated_hash: translatedHash,
    translated_at: nowIso(),
    status: "ok",
    error: undefined,
    updated_at: nowIso(),
  }
}

export interface TranslateRunOptions {
  limit?: number
  force?: boolean
  ids?: string[]
}

export interface TranslateRunReport {
  translated: string[]
  skipped: string[]
  failed: { id: string; error: string }[]
}

export async function runTranslate(
  cfg: AppConfig,
  opts: TranslateRunOptions = {},
): Promise<TranslateRunReport> {
  const state = await readState()
  const report: TranslateRunReport = { translated: [], skipped: [], failed: [] }
  const ids = opts.ids ?? Object.keys(state.skills)
  let count = 0

  for (const id of ids) {
    const skill = state.skills[id]
    if (!skill) continue
    if (skill.status === "deleted") {
      report.skipped.push(id)
      continue
    }
    const override: OverrideFile = await readOverride(id)
    if (override.translation_locked) {
      log.info(`[translate] ${id}: locked by override`)
      report.skipped.push(id)
      continue
    }
    // Invariant: scanner resets status to "pending" when content_hash changes.
    // So status==="ok" + translated_hash present means translation is up to date.
    if (!opts.force && skill.status === "ok" && skill.translated_hash) {
      report.skipped.push(id)
      continue
    }
    if (opts.limit !== undefined && count >= opts.limit) break

    try {
      log.info(`[translate] ${id}`)
      const next = await translateOne(cfg, state, skill)
      state.skills[id] = next
      // persist translated artifact in-memory; archive step writes to dist/
      report.translated.push(id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error(`[translate] ${id} failed: ${msg}`)
      state.skills[id] = {
        ...skill,
        status: "failed",
        error: msg,
        updated_at: nowIso(),
      }
      report.failed.push({ id, error: msg })
    }
    count++
    await writeState(state)
  }
  return report
}
