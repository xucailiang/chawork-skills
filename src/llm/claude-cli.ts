import { spawn } from "node:child_process"
import type { ClaudeCliConfig } from "../types.js"
import type { LLMCompleteOpts, LLMProvider } from "./provider.js"
import { log } from "../utils/logger.js"

const DEFAULT_TIMEOUT_MS = 4 * 60 * 1000  // 4 min hard cap; large bodies that hang get killed

export class ClaudeCliProvider implements LLMProvider {
  readonly name = "claude-cli"
  private command: string
  private args: string[]
  private cwd?: string
  private timeoutMs: number

  constructor(cfg: ClaudeCliConfig) {
    this.command = cfg.command ?? "claude"
    this.args = cfg.args ?? ["-p"]
    this.cwd = cfg.cwd
    const envTimeout = process.env.CHAWORK_SKILLS_CLAUDE_TIMEOUT_MS
    this.timeoutMs = envTimeout ? Number(envTimeout) : DEFAULT_TIMEOUT_MS
  }

  async complete(opts: LLMCompleteOpts): Promise<string> {
    const prompt = buildPrompt(opts)
    log.debug(`[claude-cli] prompt length=${prompt.length}`)
    return await this.run(prompt)
  }

  private run(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, {
        cwd: this.cwd,
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      })
      let stdout = ""
      let stderr = ""
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        child.kill("SIGTERM")
        setTimeout(() => child.kill("SIGKILL"), 2000)
      }, this.timeoutMs)

      child.stdout.on("data", (d: Buffer) => {
        stdout += d.toString("utf8")
      })
      child.stderr.on("data", (d: Buffer) => {
        stderr += d.toString("utf8")
      })
      child.on("error", (err) => {
        clearTimeout(timer)
        reject(err)
      })
      child.on("close", (code) => {
        clearTimeout(timer)
        if (timedOut) {
          reject(new Error(`claude CLI timed out after ${this.timeoutMs}ms`))
          return
        }
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`claude CLI exited ${code}: ${stderr.trim() || stdout.trim().slice(0, 300)}`))
        }
      })
      child.stdin.write(prompt)
      child.stdin.end()
    })
  }
}

function buildPrompt(opts: LLMCompleteOpts): string {
  const parts: string[] = []
  if (opts.system) {
    parts.push(opts.system.trim())
    parts.push("")
  }
  parts.push(opts.user.trim())
  if (opts.json) {
    parts.push("")
    parts.push("仅输出符合要求的 JSON，不要任何前后说明、不要 markdown 代码围栏。")
  }
  return parts.join("\n")
}
