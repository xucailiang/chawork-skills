import { Hono } from "hono"
import { createReadStream, existsSync } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { getLatestActiveRelease, getArtifactsForRelease, getReleaseByVersion } from "../services/release-service.js"
import { shouldReceiveUpdate } from "../services/gray-service.js"
import { recordUpdateEvent } from "../services/stats-service.js"
import type { UpdateCheckParams, UpdateCheckResponse, ReportInput } from "../services/ota-types.js"

const ota = new Hono()

/**
 * 检查更新 — 兼容 Tauri updater 协议
 * GET /api/ota/check?current_version=x&target=y&arch=z&device_id=d&channel=c
 */
ota.get("/check", (c) => {
  const params: UpdateCheckParams = {
    current_version: c.req.query("current_version") ?? "",
    target: c.req.query("target") ?? "",
    arch: c.req.query("arch") ?? "",
    device_id: c.req.query("device_id") ?? "unknown",
    channel: c.req.query("channel") ?? "stable",
  }

  if (!params.current_version || !params.target) {
    return c.json({ error: "current_version and target are required" }, 400)
  }

  const platform = params.target
  const release = getLatestActiveRelease(platform, params.channel!)

  if (!release) {
    return c.body(null, 204)
  }

  if (!isNewerVersion(release.version, params.current_version)) {
    return c.body(null, 204)
  }

  if (!shouldReceiveUpdate(release, params.device_id)) {
    return c.body(null, 204)
  }

  const artifacts = getArtifactsForRelease(release.id)
  const baseUrl = getBaseUrl(c)

  const response: UpdateCheckResponse = {
    update_type: resolveUpdateType(release, params.current_version),
    version: release.version,
    release_notes: release.release_notes,
    force_update: release.force_update === 1 || isForceRequired(release, params.current_version),
    pub_date: release.published_at ?? release.created_at,
  }

  const effectiveType = response.update_type

  if (effectiveType === "full") {
    const fullArtifact = artifacts.find((a) => a.type === "full")
    const sigArtifact = artifacts.find((a) => a.type === "signature")
    if (fullArtifact) {
      response.url = `${baseUrl}/api/ota/artifacts/${fullArtifact.filename}`
    }
    if (sigArtifact) {
      response.signature = sigArtifact.hash_sha256
    }
  }

  if (effectiveType === "hot") {
    const patchArtifact = artifacts.find(
      (a) => a.type === "patch" && a.from_version === params.current_version,
    )
    if (patchArtifact) {
      response.patch_url = `${baseUrl}/api/ota/artifacts/${patchArtifact.filename}`
      response.patch_hash = `sha256:${patchArtifact.hash_sha256}`
      response.patch_size = patchArtifact.file_size
    }
    const fullArtifact = artifacts.find((a) => a.type === "full")
    if (fullArtifact) {
      response.full_fallback_url = `${baseUrl}/api/ota/artifacts/${fullArtifact.filename}`
    }
    if (!patchArtifact && fullArtifact) {
      response.update_type = "full"
      response.url = `${baseUrl}/api/ota/artifacts/${fullArtifact.filename}`
    }
  }

  return c.json(response)
})

/** 下载升级包/补丁 */
ota.get("/artifacts/:filename", async (c) => {
  const filename = c.req.param("filename")
  const { getArtifactDir, getPatchDir } = await import("../services/patch-service.js")

  const possiblePaths = [
    `${getArtifactDir()}/${filename}`,
    `${getPatchDir()}/${filename}`,
  ]

  const filePath = possiblePaths.find((p) => existsSync(p))
  if (!filePath) {
    return c.json({ error: "Artifact not found" }, 404)
  }

  const fileStat = await stat(filePath)
  const stream = createReadStream(filePath)
  const webStream = Readable.toWeb(stream) as ReadableStream

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})

/** 上报升级状态 */
ota.post("/report", async (c) => {
  const body = await c.req.json<ReportInput>()

  if (!body.device_id || !body.to_version || !body.status) {
    return c.json({ error: "device_id, to_version, and status are required" }, 400)
  }

  const release = getReleaseByVersion(body.to_version)
  if (!release) {
    return c.json({ error: "Unknown version" }, 404)
  }

  const event = recordUpdateEvent({ ...body, release_id: release.id })
  return c.json({ ok: true, id: event.id })
})

/** 简单语义化版本比较: 是否 a > b */
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.replace(/^v/, "").split(".").map(Number)
  const pb = b.replace(/^v/, "").split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false
  }
  return false
}

/**
 * 决定更新类型
 * major/minor 变更 → full; 仅 patch 变更 → hot（如果 release 支持）
 */
function resolveUpdateType(release: import("../services/ota-types.js").Release, currentVersion: string): "full" | "hot" {
  if (release.update_type === "full") return "full"
  if (release.update_type === "hot") return "hot"

  const curr = currentVersion.replace(/^v/, "").split(".").map(Number)
  const next = release.version.replace(/^v/, "").split(".").map(Number)

  if (curr[0] !== next[0] || curr[1] !== next[1]) return "full"
  return "hot"
}

function isForceRequired(release: import("../services/ota-types.js").Release, currentVersion: string): boolean {
  if (!release.min_compatible_version) return false
  return isNewerVersion(release.min_compatible_version, currentVersion)
}

function getBaseUrl(c: { req: { url: string } }): string {
  const url = new URL(c.req.url)
  return `${url.protocol}//${url.host}`
}

export { ota }
