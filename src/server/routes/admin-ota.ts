import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  createRelease,
  getReleaseById,
  listReleases,
  updateRelease,
  updateReleaseStatus,
  deleteRelease,
  rollbackRelease,
  getArtifactsForRelease,
  insertArtifact,
} from "../services/release-service.js"
import { createGrayRule, deleteGrayRule, listGrayRules } from "../services/gray-service.js"
import { getStatsOverview, getRecentEvents, getVersionDistribution, getStatsByRelease } from "../services/stats-service.js"
import { generatePatches, computeFileHash, getArtifactDir } from "../services/patch-service.js"
import { getDb } from "../db/sqlite.js"
import type { Channel } from "../services/ota-types.js"

const adminOta = new Hono()

// Admin Token 认证中间件
const adminToken = process.env.OTA_ADMIN_TOKEN
if (adminToken) {
  adminOta.use("*", bearerAuth({ token: adminToken }))
}

// ─── Releases ────────────────────────────────────────────────

adminOta.get("/releases", (c) => {
  const channel = c.req.query("channel")
  const platform = c.req.query("platform")
  const status = c.req.query("status")
  const page = Number(c.req.query("page") || "1")
  const limit = Number(c.req.query("limit") || "20")

  const result = listReleases({ channel, platform, status, page, limit })
  return c.json(result)
})

adminOta.post("/releases", async (c) => {
  const body = await c.req.json()
  const { version, update_type, channel, platform, release_notes, force_update, min_compatible_version } = body

  if (!version || !update_type || !platform) {
    return c.json({ error: "version, update_type, and platform are required" }, 400)
  }

  try {
    const release = createRelease({
      version,
      update_type,
      channel,
      platform,
      release_notes,
      force_update,
      min_compatible_version,
    })
    return c.json(release, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return c.json({ error: msg }, 409)
  }
})

adminOta.get("/releases/:id", (c) => {
  const id = Number(c.req.param("id"))
  const release = getReleaseById(id)
  if (!release) return c.json({ error: "Release not found" }, 404)

  const artifacts = getArtifactsForRelease(id)
  const stats = getStatsByRelease(id)
  return c.json({ ...release, artifacts, stats })
})

adminOta.patch("/releases/:id", async (c) => {
  const id = Number(c.req.param("id"))
  const body = await c.req.json()

  const updated = updateRelease(id, body)
  if (!updated) return c.json({ error: "Release not found" }, 404)
  return c.json(updated)
})

adminOta.post("/releases/:id/publish", (c) => {
  const id = Number(c.req.param("id"))
  const updated = updateReleaseStatus(id, "active")
  if (!updated) return c.json({ error: "Release not found" }, 404)
  return c.json(updated)
})

adminOta.post("/releases/:id/rollback", (c) => {
  const id = Number(c.req.param("id"))
  const updated = rollbackRelease(id)
  if (!updated) return c.json({ error: "Cannot rollback (not active)" }, 400)
  return c.json(updated)
})

adminOta.delete("/releases/:id", (c) => {
  const id = Number(c.req.param("id"))
  const deleted = deleteRelease(id)
  if (!deleted) return c.json({ error: "Cannot delete (not a draft or not found)" }, 400)
  return c.json({ ok: true })
})

// ─── Upload ──────────────────────────────────────────────────

adminOta.post("/releases/:id/upload", async (c) => {
  const id = Number(c.req.param("id"))
  const release = getReleaseById(id)
  if (!release) return c.json({ error: "Release not found" }, 404)

  const formData = await c.req.formData()
  const file = formData.get("file") as File | null
  const type = (formData.get("type") as string) ?? "full"

  if (!file) return c.json({ error: "file is required" }, 400)

  const dir = getArtifactDir()
  mkdirSync(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = join(dir, file.name)
  writeFileSync(filePath, buffer)

  const hash = await computeFileHash(filePath)
  const artifact = insertArtifact({
    release_id: id,
    type: type as "full" | "patch" | "signature",
    filename: file.name,
    file_size: buffer.length,
    hash_sha256: hash,
    from_version: null,
    file_path: filePath,
  })

  return c.json(artifact, 201)
})

// ─── Patch Generation ────────────────────────────────────────

adminOta.post("/releases/:id/generate-patches", async (c) => {
  const id = Number(c.req.param("id"))
  try {
    const result = await generatePatches(id)
    return c.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return c.json({ error: msg }, 400)
  }
})

// ─── Gray Rules ──────────────────────────────────────────────

adminOta.get("/gray-rules", (c) => {
  const releaseId = c.req.query("release_id")
  const rules = listGrayRules(releaseId ? Number(releaseId) : undefined)
  return c.json(rules)
})

adminOta.post("/gray-rules", async (c) => {
  const body = await c.req.json()
  const { release_id, rule_type, percentage, device_ids } = body

  if (!release_id || !rule_type) {
    return c.json({ error: "release_id and rule_type are required" }, 400)
  }

  const rule = createGrayRule({ release_id, rule_type, percentage, device_ids })
  return c.json(rule, 201)
})

adminOta.delete("/gray-rules/:id", (c) => {
  const id = Number(c.req.param("id"))
  const deleted = deleteGrayRule(id)
  if (!deleted) return c.json({ error: "Rule not found" }, 404)
  return c.json({ ok: true })
})

// ─── Channels ────────────────────────────────────────────────

adminOta.get("/channels", (c) => {
  const db = getDb()
  const channels = db.prepare("SELECT * FROM channels").all() as Channel[]
  return c.json(channels)
})

// ─── Stats ───────────────────────────────────────────────────

adminOta.get("/stats", (c) => {
  const days = Number(c.req.query("days") || "7")
  const overview = getStatsOverview(days)
  const distribution = getVersionDistribution()
  const recentEvents = getRecentEvents(20)
  return c.json({ overview, distribution, recent_events: recentEvents })
})

export { adminOta }
