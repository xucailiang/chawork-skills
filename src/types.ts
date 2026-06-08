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
  server?: ServerConfig
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

// ── Hub Data Models ─────────────────────────────────────────────

export type SkillSourceInfo =
  | { type: "github"; repo: string; path: string; commit?: string }
  | { type: "manual"; author?: string }

export interface HubSkill {
  id: string
  name: string
  description_zh: string
  description_en: string
  profession: string
  content_hash: string
  source: SkillSourceInfo
  tags: string[]
  created_at: string
  updated_at: string
}

export type EmployeeSourceInfo =
  | { type: "official" }
  | { type: "community"; author_id?: string }

export interface HubEmployee {
  id: string
  name: string
  description: string
  kind: "ordinary" | "dream"
  prompt_preview: string
  skill_ids: string[]
  skill_count: number
  tags: string[]
  source: EmployeeSourceInfo
  created_at: string
  updated_at: string
}

// ── API Request/Response Types ──────────────────────────────────

export interface CreateSkillRequest {
  id: string
  name: string
  description_zh: string
  description_en: string
  profession: string
  skill_md: string
  tags?: string[]
}

export interface UpdateSkillRequest {
  name?: string
  description_zh?: string
  description_en?: string
  profession?: string
  skill_md?: string
  tags?: string[]
}

export interface SkillDetailResponse extends HubSkill {
  skill_md: string
  referenced_by_employees: string[]
}

export interface CreateEmployeeRequest {
  id: string
  name: string
  description: string
  kind: "ordinary" | "dream"
  prompt_md: string
  skill_ids: string[]
  tags?: string[]
}

export interface UpdateEmployeeRequest {
  name?: string
  description?: string
  kind?: "ordinary" | "dream"
  prompt_md?: string
  skill_ids?: string[]
  tags?: string[]
}

export interface EmployeeDetailResponse extends HubEmployee {
  prompt_md: string
  skills: { id: string; name: string; description_zh: string }[]
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  items: T[]
}

export interface ImportGithubRequest {
  url: string
  ref?: string
}

export interface ImportGithubResponse {
  source: string
  imported: number
  skills: { id: string; name: string; profession: string }[]
}

export interface ManifestResponse {
  total_skills: number
  total_employees: number
  professions: { name: string; skill_count: number; employee_count: number }[]
}

export interface ServerConfig {
  port: number
  host: string
  cors_origins: string[]
}
