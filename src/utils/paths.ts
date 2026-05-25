import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..")

export const DATA_DIR = resolve(REPO_ROOT, "data")
export const SOURCES_DIR = resolve(DATA_DIR, "sources")
export const OVERRIDES_DIR = resolve(DATA_DIR, "overrides")
export const TRANSLATED_DIR = resolve(DATA_DIR, "translated")
export const STATE_PATH = resolve(DATA_DIR, "state.json")
export const DIST_DIR = resolve(REPO_ROOT, "dist")
export const DIST_PROFESSIONS_DIR = resolve(DIST_DIR, "professions")
export const DIST_MANIFEST = resolve(DIST_DIR, "professions.json")
export const CONFIG_PATH = resolve(REPO_ROOT, "config", "sources.yaml")
