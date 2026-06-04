export interface SourceConfig {
  name: string
  type: "git"
  url: string
  ref?: string
  skills_glob?: string
  include_paths?: string[]
  skill_filenames?: string[]
}

export interface ClaudeCliConfig {
  command?: string
  args?: string[]
  cwd?: string
}

export interface OpenAIConfig {
  base_url?: string
  api_key_env?: string
  model?: string
}

export type LLMProviderName = "claude-cli" | "openai"

export interface LLMConfig {
  provider: LLMProviderName
  claude_cli?: ClaudeCliConfig
  openai?: OpenAIConfig
}

export interface AppConfig {
  sources: SourceConfig[]
  llm: LLMConfig
}

export type SkillStatus = "pending" | "ok" | "failed" | "deleted"

export interface ManualOverride {
  profession?: boolean
  translation?: boolean
}

export interface SkillState {
  id: string
  source_name: string
  source_path: string
  source_commit?: string
  name?: string
  description_en?: string
  description_zh?: string
  content_hash: string
  translated_hash?: string
  classified_hash?: string
  profession?: string
  classification_confidence?: "high" | "medium" | "low"
  manual_override?: ManualOverride
  status: SkillStatus
  error?: string
  translated_at?: string
  classified_at?: string
  updated_at: string
}

export interface SourceState {
  url: string
  ref?: string
  last_sync_at?: string
  last_commit?: string
}

export interface StateFile {
  version: 1
  sources: Record<string, SourceState>
  skills: Record<string, SkillState>
}

export interface OverrideFile {
  profession?: string
  translation_locked?: boolean
  notes?: string
}

export interface PackEntry {
  id: string
  name: string
  description_zh: string
  description_en: string
  source: { repo: string; path: string; commit?: string }
  content_hash: string
  translated_at?: string
}

export interface ProfessionPack {
  profession: string
  generated_at: string
  skill_count: number
  skills: PackEntry[]
}

export interface ProfessionsManifest {
  generated_at: string
  professions: { name: string; skill_count: number; skills: string[] }[]
}
