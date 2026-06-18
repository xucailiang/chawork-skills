import { createHash } from "node:crypto"
import { getDb } from "../db/sqlite.js"
import type { GrayRule, Release } from "./ota-types.js"

export function getActiveGrayRules(releaseId: number): GrayRule[] {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM gray_rules WHERE release_id = ? AND is_active = 1",
  ).all(releaseId) as GrayRule[]
}

export function createGrayRule(input: {
  release_id: number
  rule_type: "percentage" | "device_list"
  percentage?: number
  device_ids?: string[]
}): GrayRule {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO gray_rules (release_id, rule_type, percentage, device_ids)
    VALUES (?, ?, ?, ?)
  `).run(
    input.release_id,
    input.rule_type,
    input.percentage ?? null,
    input.device_ids ? JSON.stringify(input.device_ids) : null,
  )
  return db.prepare("SELECT * FROM gray_rules WHERE id = ?").get(result.lastInsertRowid) as GrayRule
}

export function deleteGrayRule(id: number): boolean {
  const db = getDb()
  return db.prepare("DELETE FROM gray_rules WHERE id = ?").run(id).changes > 0
}

export function listGrayRules(releaseId?: number): GrayRule[] {
  const db = getDb()
  if (releaseId) {
    return db.prepare("SELECT * FROM gray_rules WHERE release_id = ?").all(releaseId) as GrayRule[]
  }
  return db.prepare("SELECT * FROM gray_rules ORDER BY created_at DESC").all() as GrayRule[]
}

/**
 * 判断设备是否应该收到该版本更新
 * 无灰度规则 = 全量推送
 */
export function shouldReceiveUpdate(release: Release, deviceId: string): boolean {
  const rules = getActiveGrayRules(release.id)
  if (rules.length === 0) return true

  for (const rule of rules) {
    if (rule.rule_type === "device_list" && rule.device_ids) {
      const devices: string[] = JSON.parse(rule.device_ids)
      if (devices.includes(deviceId)) return true
    }
    if (rule.rule_type === "percentage" && rule.percentage != null) {
      const hash = stableHash(deviceId + String(release.id))
      if (hash % 100 < rule.percentage) return true
    }
  }
  return false
}

/** 基于 device_id 的稳定 hash，确保同一设备每次结果一致 */
function stableHash(input: string): number {
  const hash = createHash("md5").update(input).digest()
  return hash.readUInt32BE(0)
}
