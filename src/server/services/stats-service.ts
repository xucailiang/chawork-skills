import { getDb } from "../db/sqlite.js"
import type { UpdateStat, StatsOverview, ReportInput } from "./ota-types.js"

export function recordUpdateEvent(input: ReportInput & { release_id: number }): UpdateStat {
  const db = getDb()
  const completedAt = (input.status === "success" || input.status === "failed")
    ? new Date().toISOString()
    : null

  const result = db.prepare(`
    INSERT INTO update_stats (release_id, device_id, from_version, to_version, update_type, status, error_message, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.release_id,
    input.device_id,
    input.from_version,
    input.to_version,
    input.update_type,
    input.status,
    input.error_message ?? null,
    completedAt,
  )

  return db.prepare("SELECT * FROM update_stats WHERE id = ?").get(result.lastInsertRowid) as UpdateStat
}

export function getStatsOverview(days = 7): StatsOverview {
  const db = getDb()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const totalDevices = (db.prepare(
    "SELECT COUNT(DISTINCT device_id) as count FROM update_stats",
  ).get() as { count: number }).count

  const latestVersion = (db.prepare(
    "SELECT version FROM releases WHERE status = 'active' ORDER BY published_at DESC LIMIT 1",
  ).get() as { version: string } | undefined)?.version ?? null

  const recentStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM update_stats
    WHERE started_at >= ?
    GROUP BY status
  `).all(since) as { status: string; count: number }[]

  const successCount = recentStats.find((s) => s.status === "success")?.count ?? 0
  const failedCount = recentStats.find((s) => s.status === "failed")?.count ?? 0
  const totalAttempts = recentStats.reduce((sum, s) => sum + s.count, 0)

  return {
    total_devices: totalDevices,
    latest_version: latestVersion,
    upgrade_rate: totalAttempts > 0 ? Math.round((successCount / totalAttempts) * 100) : 0,
    failure_rate: totalAttempts > 0 ? Math.round((failedCount / totalAttempts) * 100) : 0,
  }
}

export function getRecentEvents(limit = 50): UpdateStat[] {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM update_stats ORDER BY started_at DESC LIMIT ?",
  ).all(limit) as UpdateStat[]
}

export function getVersionDistribution(): { version: string; count: number }[] {
  const db = getDb()
  return db.prepare(`
    SELECT to_version as version, COUNT(DISTINCT device_id) as count
    FROM update_stats
    WHERE status = 'success'
    GROUP BY to_version
    ORDER BY count DESC
  `).all() as { version: string; count: number }[]
}

export function getStatsByRelease(releaseId: number): {
  total: number
  success: number
  failed: number
  downloading: number
  installing: number
} {
  const db = getDb()
  const stats = db.prepare(`
    SELECT status, COUNT(*) as count FROM update_stats
    WHERE release_id = ?
    GROUP BY status
  `).all(releaseId) as { status: string; count: number }[]

  const byStatus = Object.fromEntries(stats.map((s) => [s.status, s.count]))
  return {
    total: stats.reduce((sum, s) => sum + s.count, 0),
    success: byStatus["success"] ?? 0,
    failed: byStatus["failed"] ?? 0,
    downloading: byStatus["downloading"] ?? 0,
    installing: byStatus["installing"] ?? 0,
  }
}
