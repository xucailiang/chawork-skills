import { readFile, writeFile, readdir, mkdir, rm, stat } from "node:fs/promises"
import { resolve } from "node:path"
import { createGzip } from "node:zlib"
import type { HubSkill, SkillSourceInfo } from "../types.js"
import { DATA_DIR } from "../utils/paths.js"
import { sha256 } from "../utils/hash.js"
import { nowIso } from "../state/store.js"

const SKILLS_DIR = resolve(DATA_DIR, "skills")

function skillDir(id: string): string {
  return resolve(SKILLS_DIR, id)
}

function metaPath(id: string): string {
  return resolve(skillDir(id), "skill.meta.json")
}

function skillMdPath(id: string): string {
  return resolve(skillDir(id), "SKILL.md")
}

function originalMdPath(id: string): string {
  return resolve(skillDir(id), "SKILL.original.md")
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function readMeta(id: string): Promise<HubSkill | null> {
  try {
    const raw = await readFile(metaPath(id), "utf8")
    return JSON.parse(raw) as HubSkill
  } catch {
    return null
  }
}

async function writeMeta(skill: HubSkill): Promise<void> {
  const dir = skillDir(skill.id)
  await mkdir(dir, { recursive: true })
  await writeFile(metaPath(skill.id), JSON.stringify(skill, null, 2) + "\n", "utf8")
}

export async function listSkills(): Promise<HubSkill[]> {
  await mkdir(SKILLS_DIR, { recursive: true })
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true })
  const skills: HubSkill[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const meta = await readMeta(e.name)
    if (meta) skills.push(meta)
  }
  return skills
}

export async function getSkill(id: string): Promise<HubSkill | null> {
  return readMeta(id)
}

export async function getSkillMd(id: string): Promise<string | null> {
  const p = skillMdPath(id)
  if (!(await pathExists(p))) return null
  return readFile(p, "utf8")
}

export async function createSkill(params: {
  id: string
  name: string
  description_zh: string
  description_en: string
  profession: string
  skill_md: string
  tags?: string[]
  source?: SkillSourceInfo
}): Promise<HubSkill> {
  const dir = skillDir(params.id)
  if (await pathExists(dir)) {
    throw new Error(`Skill "${params.id}" already exists`)
  }

  const now = nowIso()
  const skill: HubSkill = {
    id: params.id,
    name: params.name,
    description_zh: params.description_zh,
    description_en: params.description_en,
    profession: params.profession,
    content_hash: sha256(params.skill_md),
    source: params.source ?? { type: "manual" },
    tags: params.tags ?? [],
    created_at: now,
    updated_at: now,
  }

  await mkdir(dir, { recursive: true })
  await writeFile(skillMdPath(params.id), params.skill_md, "utf8")
  await writeMeta(skill)
  return skill
}

export async function updateSkill(
  id: string,
  patch: {
    name?: string
    description_zh?: string
    description_en?: string
    profession?: string
    skill_md?: string
    tags?: string[]
  },
): Promise<HubSkill | null> {
  const existing = await readMeta(id)
  if (!existing) return null

  const updated: HubSkill = {
    ...existing,
    name: patch.name ?? existing.name,
    description_zh: patch.description_zh ?? existing.description_zh,
    description_en: patch.description_en ?? existing.description_en,
    profession: patch.profession ?? existing.profession,
    tags: patch.tags ?? existing.tags,
    updated_at: nowIso(),
  }

  if (patch.skill_md !== undefined) {
    updated.content_hash = sha256(patch.skill_md)
    await writeFile(skillMdPath(id), patch.skill_md, "utf8")
  }

  await writeMeta(updated)
  return updated
}

export async function deleteSkill(id: string): Promise<boolean> {
  const dir = skillDir(id)
  if (!(await pathExists(dir))) return false
  await rm(dir, { recursive: true, force: true })
  return true
}

export async function bundleSkill(id: string): Promise<Buffer | null> {
  const dir = skillDir(id)
  if (!(await pathExists(dir))) return null

  const chunks: Buffer[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const e of entries) {
    if (!e.isFile()) continue
    const filePath = resolve(dir, e.name)
    const content = await readFile(filePath)
    const header = {
      name: `${id}/${e.name}`,
      size: content.length,
    }
    chunks.push(tarEntry(header, content))
  }

  const tarBuffer = Buffer.concat([...chunks, Buffer.alloc(1024)])
  return gzipBuffer(tarBuffer)
}

function tarEntry(header: { name: string; size: number }, content: Buffer): Buffer {
  const nameBytes = Buffer.from(header.name, "utf8")
  const headerBuf = Buffer.alloc(512)
  nameBytes.copy(headerBuf, 0, 0, Math.min(nameBytes.length, 100))

  const sizeStr = header.size.toString(8).padStart(11, "0")
  headerBuf.write(sizeStr, 124, 12, "utf8")
  headerBuf.write("0100644\0", 100, 8, "utf8") // mode
  headerBuf.write("0000000\0", 108, 8, "utf8") // uid
  headerBuf.write("0000000\0", 116, 8, "utf8") // gid
  headerBuf.write("0", 156, 1, "utf8") // type: normal file

  // checksum
  headerBuf.write("        ", 148, 8, "utf8")
  let checksum = 0
  for (let i = 0; i < 512; i++) checksum += headerBuf[i]!
  headerBuf.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf8")

  const padding = 512 - (content.length % 512)
  const paddingBuf = padding < 512 ? Buffer.alloc(padding) : Buffer.alloc(0)

  return Buffer.concat([headerBuf, content, paddingBuf])
}

async function gzipBuffer(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const gz = createGzip()
    gz.on("data", (chunk: Buffer) => chunks.push(chunk))
    gz.on("end", () => resolve(Buffer.concat(chunks)))
    gz.on("error", reject)
    gz.end(input)
  })
}

export { SKILLS_DIR }
