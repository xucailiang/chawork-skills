import { readFile } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import type { AppConfig, LLMProviderName, SourceConfig } from "./types.js"
import { CONFIG_PATH } from "./utils/paths.js"

function expandEnv(input: unknown): unknown {
  if (typeof input === "string") {
    return input.replace(/\$\{([A-Z0-9_]+)\}/g, (_m, name: string) => process.env[name] ?? "")
  }
  if (Array.isArray(input)) return input.map(expandEnv)
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) out[k] = expandEnv(v)
    return out
  }
  return input
}

function validate(raw: unknown): AppConfig {
  if (!raw || typeof raw !== "object") throw new Error("config: root must be an object")
  const obj = raw as Record<string, unknown>

  const sourcesRaw = obj.sources
  if (!Array.isArray(sourcesRaw) || sourcesRaw.length === 0) {
    throw new Error("config.sources: must be a non-empty array")
  }
  const sources: SourceConfig[] = sourcesRaw.map((s, i) => {
    if (!s || typeof s !== "object") throw new Error(`config.sources[${i}]: must be object`)
    const o = s as Record<string, unknown>
    if (typeof o.name !== "string" || !o.name) throw new Error(`config.sources[${i}].name required`)
    if (o.type !== "git") throw new Error(`config.sources[${i}].type must be "git"`)
    if (typeof o.url !== "string" || !o.url) throw new Error(`config.sources[${i}].url required`)
    return {
      name: o.name,
      type: "git",
      url: o.url,
      ref: typeof o.ref === "string" ? o.ref : "main",
      skills_glob: typeof o.skills_glob === "string" ? o.skills_glob : "**/SKILL.md",
      include_paths: Array.isArray(o.include_paths) ? (o.include_paths as string[]) : undefined,
      skill_filenames: Array.isArray(o.skill_filenames) ? (o.skill_filenames as string[]) : undefined,
    }
  })

  const llmRaw = (obj.llm ?? {}) as Record<string, unknown>
  const provider = (llmRaw.provider ?? "claude-cli") as LLMProviderName
  if (provider !== "claude-cli" && provider !== "openai") {
    throw new Error(`config.llm.provider: must be "claude-cli" or "openai", got ${provider}`)
  }

  const claudeCliRaw = (llmRaw.claude_cli ?? {}) as Record<string, unknown>
  const openaiRaw = (llmRaw.openai ?? {}) as Record<string, unknown>

  return {
    sources,
    llm: {
      provider,
      claude_cli: {
        command: typeof claudeCliRaw.command === "string" ? claudeCliRaw.command : "claude",
        args: Array.isArray(claudeCliRaw.args) ? (claudeCliRaw.args as string[]) : ["-p"],
        cwd: typeof claudeCliRaw.cwd === "string" ? claudeCliRaw.cwd : undefined,
      },
      openai: {
        base_url: typeof openaiRaw.base_url === "string" ? openaiRaw.base_url : "https://api.openai.com/v1",
        api_key_env: typeof openaiRaw.api_key_env === "string" ? openaiRaw.api_key_env : "OPENAI_API_KEY",
        model: typeof openaiRaw.model === "string" ? openaiRaw.model : "gpt-4o-mini",
      },
    },
  }
}

export async function loadConfig(path: string = CONFIG_PATH): Promise<AppConfig> {
  const raw = await readFile(path, "utf8")
  const parsed = parseYaml(raw)
  return validate(expandEnv(parsed))
}
