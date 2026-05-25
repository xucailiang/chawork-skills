import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { SkillState, StateFile } from "../types.js"
import { STATE_PATH } from "../utils/paths.js"

function emptyState(): StateFile {
  return { version: 1, sources: {}, skills: {} }
}

export async function readState(path: string = STATE_PATH): Promise<StateFile> {
  try {
    const raw = await readFile(path, "utf8")
    const parsed = JSON.parse(raw) as Partial<StateFile>
    if (!parsed || parsed.version !== 1) return emptyState()
    return {
      version: 1,
      sources: parsed.sources ?? {},
      skills: parsed.skills ?? {},
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === "ENOENT") return emptyState()
    throw err
  }
}

export async function writeState(state: StateFile, path: string = STATE_PATH): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(state, null, 2) + "\n", "utf8")
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function upsertSkill(state: StateFile, id: string, patch: Partial<SkillState>): SkillState {
  const prev = state.skills[id]
  const merged = { ...(prev ?? {}), ...patch }
  const next: SkillState = {
    id,
    source_name: merged.source_name ?? "",
    source_path: merged.source_path ?? "",
    content_hash: merged.content_hash ?? "",
    status: merged.status ?? "pending",
    source_commit: merged.source_commit,
    name: merged.name,
    description_en: merged.description_en,
    description_zh: merged.description_zh,
    translated_hash: merged.translated_hash,
    classified_hash: merged.classified_hash,
    profession: merged.profession,
    classification_confidence: merged.classification_confidence,
    manual_override: merged.manual_override,
    error: merged.error,
    translated_at: merged.translated_at,
    classified_at: merged.classified_at,
    updated_at: nowIso(),
  }
  state.skills[id] = next
  return next
}
