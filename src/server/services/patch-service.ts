import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdirSync } from "node:fs"
import { stat, unlink } from "node:fs/promises"
import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { join } from "node:path"
import { log } from "../../utils/logger.js"
import {
  getRecentActiveHotReleases,
  getRecentActiveVersions,
  getArtifactsForRelease,
  insertArtifact,
  getReleaseById,
  deleteArtifactsByType,
} from "./release-service.js"
import type { Release } from "./ota-types.js"

const execFileAsync = promisify(execFile)

const OTA_DATA_DIR = join(process.cwd(), "data/ota")

export function getArtifactDir(): string {
  return join(OTA_DATA_DIR, "artifacts")
}

export function getPatchDir(): string {
  return join(OTA_DATA_DIR, "patches")
}

/**
 * 为指定 release 生成 bsdiff 补丁
 * 与最近 N 个活跃版本对比
 */
export async function generatePatches(releaseId: number, maxPrevVersions = 5): Promise<{
  generated: string[]
  skipped: string[]
}> {
  const release = getReleaseById(releaseId)
  if (!release) throw new Error(`Release ${releaseId} not found`)

  const newArtifacts = getArtifactsForRelease(releaseId)
  const newFullArtifact = newArtifacts.find((a) => a.type === "full")
  if (!newFullArtifact) throw new Error("未找到前端 bundle，请先上传 bundle 文件")

  mkdirSync(getPatchDir(), { recursive: true })

  // 清理旧补丁，避免重复记录
  for (const artifact of newArtifacts.filter((a) => a.type === "patch")) {
    try {
      await unlink(artifact.file_path)
    } catch {
      // ignore missing files
    }
  }
  deleteArtifactsByType(releaseId, "patch")

  const recentVersions =
    release.update_type === "hot" || release.platform === "all"
      ? getRecentActiveHotReleases(releaseId, maxPrevVersions)
      : getRecentActiveVersions(release.platform, maxPrevVersions).filter((r) => r.id !== releaseId)

  const generated: string[] = []
  const skipped: string[] = []

  for (const oldRelease of recentVersions) {
    const oldArtifacts = getArtifactsForRelease(oldRelease.id)
    const oldFullArtifact = oldArtifacts.find((a) => a.type === "full")
    if (!oldFullArtifact) {
      skipped.push(`${oldRelease.version} (no full artifact)`)
      continue
    }

    const patchFilename = `patch_${oldRelease.version}_to_${release.version}.bsdiff`
    const patchPath = join(getPatchDir(), patchFilename)

    try {
      await execBsdiff(oldFullArtifact.file_path, newFullArtifact.file_path, patchPath)

      const patchStat = await stat(patchPath)
      const fullStat = await stat(newFullArtifact.file_path)

      if (patchStat.size > fullStat.size * 0.6) {
        await unlink(patchPath)
        skipped.push(`${oldRelease.version} (patch too large: ${Math.round(patchStat.size / fullStat.size * 100)}%)`)
        continue
      }

      const hash = await computeFileHash(patchPath)
      insertArtifact({
        release_id: releaseId,
        type: "patch",
        filename: patchFilename,
        file_size: patchStat.size,
        hash_sha256: hash,
        from_version: oldRelease.version,
        file_path: patchPath,
      })

      generated.push(`${oldRelease.version} → ${release.version} (${formatBytes(patchStat.size)})`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error(`[patch] failed ${oldRelease.version} → ${release.version}: ${msg}`)
      skipped.push(`${oldRelease.version} (error: ${msg})`)
    }
  }

  return { generated, skipped }
}

async function execBsdiff(oldFile: string, newFile: string, patchFile: string): Promise<void> {
  await execFileAsync("bsdiff", [oldFile, newFile, patchFile])
}

export async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256")
    const stream = createReadStream(filePath)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("end", () => resolve(hash.digest("hex")))
    stream.on("error", reject)
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
