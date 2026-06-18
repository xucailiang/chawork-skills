import { getDb } from "../db/sqlite.js"
import type { Release, Artifact, CreateReleaseInput } from "./ota-types.js"

export function createRelease(input: CreateReleaseInput): Release {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO releases (version, update_type, channel, platform, release_notes, force_update, min_compatible_version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    input.version,
    input.update_type,
    input.channel ?? "stable",
    input.platform,
    input.release_notes ?? null,
    input.force_update ? 1 : 0,
    input.min_compatible_version ?? null,
  )
  return getReleaseById(result.lastInsertRowid as number)!
}

export function getReleaseById(id: number): Release | undefined {
  const db = getDb()
  return db.prepare("SELECT * FROM releases WHERE id = ?").get(id) as Release | undefined
}

export function getReleaseByVersion(version: string): Release | undefined {
  const db = getDb()
  return db.prepare("SELECT * FROM releases WHERE version = ?").get(version) as Release | undefined
}

export function listReleases(filters?: {
  channel?: string
  platform?: string
  status?: string
  page?: number
  limit?: number
}): { items: Release[]; total: number } {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.channel) {
    conditions.push("channel = ?")
    params.push(filters.channel)
  }
  if (filters?.platform) {
    conditions.push("platform = ?")
    params.push(filters.platform)
  }
  if (filters?.status) {
    conditions.push("status = ?")
    params.push(filters.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const total = (db.prepare(`SELECT COUNT(*) as count FROM releases ${where}`).get(...params) as { count: number }).count

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const offset = (page - 1) * limit

  const items = db.prepare(
    `SELECT * FROM releases ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset) as Release[]

  return { items, total }
}

export function updateReleaseStatus(id: number, status: Release["status"]): Release | undefined {
  const db = getDb()
  const publishedAt = status === "active" ? new Date().toISOString() : null

  if (status === "active") {
    db.prepare("UPDATE releases SET status = ?, published_at = ? WHERE id = ?").run(status, publishedAt, id)
  } else {
    db.prepare("UPDATE releases SET status = ? WHERE id = ?").run(status, id)
  }
  return getReleaseById(id)
}

export function updateRelease(id: number, fields: Partial<Omit<Release, "id" | "created_at">>): Release | undefined {
  const db = getDb()
  const allowedKeys = ["version", "update_type", "channel", "platform", "release_notes", "force_update", "min_compatible_version", "status", "published_at"]
  const updates: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(fields)) {
    if (allowedKeys.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`)
      values.push(key === "force_update" ? (value ? 1 : 0) : value)
    }
  }

  if (updates.length === 0) return getReleaseById(id)
  values.push(id)
  db.prepare(`UPDATE releases SET ${updates.join(", ")} WHERE id = ?`).run(...values)
  return getReleaseById(id)
}

export function deleteRelease(id: number): boolean {
  const db = getDb()
  const release = getReleaseById(id)
  if (!release || release.status !== "draft") return false
  db.prepare("DELETE FROM releases WHERE id = ?").run(id)
  return true
}

/** 回滚：将目标版本标记为 rollback，同时取消后续版本 */
export function rollbackRelease(id: number): Release | undefined {
  const db = getDb()
  const release = getReleaseById(id)
  if (!release || release.status !== "active") return undefined

  db.prepare("UPDATE releases SET status = 'rollback' WHERE id = ?").run(id)
  return getReleaseById(id)
}

export function getLatestActiveRelease(platform: string, channel: string): Release | undefined {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM releases WHERE (platform = ? OR platform = 'all') AND channel = ? AND status = 'active' ORDER BY published_at DESC LIMIT 1",
  ).get(platform, channel) as Release | undefined
}

export function getRecentActiveVersions(platform: string, limit: number): Release[] {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM releases WHERE platform = ? AND status = 'active' ORDER BY published_at DESC LIMIT ?",
  ).all(platform, limit) as Release[]
}

export function getArtifactsForRelease(releaseId: number): Artifact[] {
  const db = getDb()
  return db.prepare("SELECT * FROM artifacts WHERE release_id = ?").all(releaseId) as Artifact[]
}

export function insertArtifact(input: Omit<Artifact, "id" | "created_at">): Artifact {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO artifacts (release_id, type, filename, file_size, hash_sha256, from_version, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(input.release_id, input.type, input.filename, input.file_size, input.hash_sha256, input.from_version, input.file_path)
  return db.prepare("SELECT * FROM artifacts WHERE id = ?").get(result.lastInsertRowid) as Artifact
}

export function deleteArtifact(id: number): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM artifacts WHERE id = ?").run(id)
  return result.changes > 0
}
