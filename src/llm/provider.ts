import type { LLMConfig } from "../types.js"
import { ClaudeCliProvider } from "./claude-cli.js"
import { OpenAIProvider } from "./openai.js"

export interface LLMCompleteOpts {
  system?: string
  user: string
  json?: boolean
  temperature?: number
  max_tokens?: number
}

export interface LLMProvider {
  readonly name: string
  complete(opts: LLMCompleteOpts): Promise<string>
}

export function buildProvider(cfg: LLMConfig): LLMProvider {
  if (cfg.provider === "claude-cli") return new ClaudeCliProvider(cfg.claude_cli ?? {})
  if (cfg.provider === "openai") return new OpenAIProvider(cfg.openai ?? {})
  throw new Error(`unknown LLM provider: ${cfg.provider}`)
}

export function extractFirstJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // fall through
    }
  }
  // try to find a fenced JSON block
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed)
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1])
    } catch {
      // fall through
    }
  }
  // try to find first balanced { ... }
  const start = trimmed.indexOf("{")
  if (start !== -1) {
    let depth = 0
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i]
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          const slice = trimmed.slice(start, i + 1)
          try {
            return JSON.parse(slice)
          } catch {
            break
          }
        }
      }
    }
  }
  throw new Error(`extractFirstJson: no JSON object found in response. First 200 chars: ${trimmed.slice(0, 200)}`)
}
