import type { OpenAIConfig } from "../types.js"
import type { LLMCompleteOpts, LLMProvider } from "./provider.js"

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai"
  private baseUrl: string
  private apiKeyEnv: string
  private model: string

  constructor(cfg: OpenAIConfig) {
    this.baseUrl = (cfg.base_url ?? "https://api.openai.com/v1").replace(/\/+$/, "")
    this.apiKeyEnv = cfg.api_key_env ?? "OPENAI_API_KEY"
    this.model = cfg.model ?? "gpt-4o-mini"
  }

  async complete(opts: LLMCompleteOpts): Promise<string> {
    const apiKey = process.env[this.apiKeyEnv]
    if (!apiKey) throw new Error(`OpenAIProvider: env ${this.apiKeyEnv} is not set`)

    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        ...(opts.system ? [{ role: "system", content: opts.system }] : []),
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.2,
    }
    if (opts.max_tokens) body.max_tokens = opts.max_tokens
    if (opts.json) body.response_format = { type: "json_object" }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 400)}`)
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== "string") throw new Error("OpenAI API: missing choices[0].message.content")
    return content
  }
}
