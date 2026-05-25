import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parse as parseYaml } from "yaml"
import type { OverrideFile } from "../types.js"
import { OVERRIDES_DIR } from "../utils/paths.js"

export function overridePath(skillId: string): string {
  return resolve(OVERRIDES_DIR, `${skillId}.yaml`)
}

export async function readOverride(skillId: string): Promise<OverrideFile> {
  try {
    const raw = await readFile(overridePath(skillId), "utf8")
    const parsed = (parseYaml(raw) ?? {}) as OverrideFile
    return parsed
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === "ENOENT") return {}
    throw err
  }
}
