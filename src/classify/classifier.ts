import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { AppConfig, OverrideFile, SkillState, StateFile } from "../types.js"
import { sourceDir } from "../sources/git.js"
import { parseSkill, truncateForPrompt } from "../utils/markdown.js"
import { log } from "../utils/logger.js"
import { nowIso, readState, writeState } from "../state/store.js"
import { buildProvider, extractFirstJson } from "../llm/provider.js"
import { readOverride } from "../state/overrides.js"
import { FALLBACK_PROFESSION, PROFESSIONS, isProfession } from "./professions.js"

const SYSTEM_PROMPT = `你是一名职业能力分类专家。给你一个 Claude Code skill 的英文 name + description + 正文片段，请把它归类到下列固定的职业白名单中的**一个**：

${PROFESSIONS.map((p, i) => `${i + 1}. ${p}`).join("\n")}

要求：
- 只能从上面 ${PROFESSIONS.length} 个职业里挑一个。
- 选最直接服务该 skill 的职业，不要选近义词。
- 如果实在判断不出来或它服务所有职业（如「写好提交信息」「整理文件」），归到「通用技能」。
- 输出严格的 JSON：{"profession": "<职业名>", "confidence": "high|medium|low", "reason": "<不超过 30 字>"}`

interface ClassifyOutput {
  profession: string
  confidence?: "high" | "medium" | "low"
  reason?: string
}

export async function classifyOne(
  cfg: AppConfig,
  skill: SkillState,
): Promise<{ profession: string; confidence: "high" | "medium" | "low" }> {
  if (!skill.source_name || !skill.source_path) {
    throw new Error(`classifyOne(${skill.id}): missing source paths`)
  }
  const src = cfg.sources.find((s) => s.name === skill.source_name)
  if (!src) throw new Error(`classifyOne(${skill.id}): source ${skill.source_name} not in config`)

  const abs = resolve(sourceDir(src), skill.source_path)
  const raw = await readFile(abs, "utf8")
  const parsed = parseSkill(raw)
  const name = (parsed.data.name as string | undefined) ?? skill.name ?? skill.id
  const description = (parsed.data.description as string | undefined) ?? skill.description_en ?? ""
  const body = truncateForPrompt(parsed.body, 1500)

  const user = `name: ${name}\n\ndescription: ${description}\n\nbody (truncated):\n${body}`

  const provider = buildProvider(cfg.llm)
  const text = await provider.complete({ system: SYSTEM_PROMPT, user, json: true, temperature: 0.1 })

  let out: ClassifyOutput
  try {
    out = extractFirstJson(text) as ClassifyOutput
  } catch (err) {
    log.warn(`[classify] ${skill.id}: cannot parse JSON, fallback. raw=${text.slice(0, 200)}`)
    return { profession: FALLBACK_PROFESSION, confidence: "low" }
  }

  if (!out.profession || !isProfession(out.profession)) {
    log.warn(`[classify] ${skill.id}: invalid profession ${out.profession}, fallback`)
    return { profession: FALLBACK_PROFESSION, confidence: "low" }
  }
  const confidence: "high" | "medium" | "low" =
    out.confidence === "high" || out.confidence === "medium" || out.confidence === "low"
      ? out.confidence
      : "medium"
  return { profession: out.profession, confidence }
}

export interface ClassifyRunOptions {
  limit?: number
  force?: boolean
  ids?: string[]
}

export interface ClassifyRunReport {
  classified: { id: string; profession: string }[]
  skipped: string[]
  failed: { id: string; error: string }[]
}

export async function runClassify(
  cfg: AppConfig,
  opts: ClassifyRunOptions = {},
): Promise<ClassifyRunReport> {
  const state = await readState()
  const report: ClassifyRunReport = { classified: [], skipped: [], failed: [] }
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
    if (override.profession && isProfession(override.profession)) {
      const prev = skill.profession
      state.skills[id] = {
        ...skill,
        profession: override.profession,
        classified_hash: skill.content_hash,
        classified_at: nowIso(),
        manual_override: { ...(skill.manual_override ?? {}), profession: true },
        updated_at: nowIso(),
      }
      if (prev !== override.profession) {
        report.classified.push({ id, profession: override.profession })
      } else {
        report.skipped.push(id)
      }
      continue
    }
    if (
      !opts.force &&
      skill.profession &&
      skill.classified_hash === skill.content_hash &&
      isProfession(skill.profession)
    ) {
      report.skipped.push(id)
      continue
    }
    if (opts.limit !== undefined && count >= opts.limit) break

    try {
      log.info(`[classify] ${id}`)
      const { profession, confidence } = await classifyOne(cfg, skill)
      state.skills[id] = {
        ...skill,
        profession,
        classification_confidence: confidence,
        classified_hash: skill.content_hash,
        classified_at: nowIso(),
        updated_at: nowIso(),
      }
      report.classified.push({ id, profession })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error(`[classify] ${id} failed: ${msg}`)
      report.failed.push({ id, error: msg })
    }
    count++
    await writeState(state)
  }
  return report
}
