import { readFile, writeFile, readdir, mkdir, rm, stat } from "node:fs/promises"
import { resolve } from "node:path"
import { createGzip } from "node:zlib"
import type { HubEmployee, EmployeeSourceInfo } from "../types.js"
import { DATA_DIR } from "../utils/paths.js"
import { nowIso } from "../state/store.js"

const EMPLOYEES_DIR = resolve(DATA_DIR, "employees")

function employeeDir(id: string): string {
  return resolve(EMPLOYEES_DIR, id)
}

function metaPath(id: string): string {
  return resolve(employeeDir(id), "employee.json")
}

function promptPath(id: string): string {
  return resolve(employeeDir(id), "prompt.md")
}

function skillsRefPath(id: string): string {
  return resolve(employeeDir(id), "skills.json")
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function readMeta(id: string): Promise<HubEmployee | null> {
  try {
    const raw = await readFile(metaPath(id), "utf8")
    return JSON.parse(raw) as HubEmployee
  } catch {
    return null
  }
}

async function writeMeta(employee: HubEmployee): Promise<void> {
  const dir = employeeDir(employee.id)
  await mkdir(dir, { recursive: true })
  await writeFile(metaPath(employee.id), JSON.stringify(employee, null, 2) + "\n", "utf8")
}

function makePreview(prompt: string): string {
  return prompt.slice(0, 200)
}

export async function listEmployees(): Promise<HubEmployee[]> {
  await mkdir(EMPLOYEES_DIR, { recursive: true })
  const entries = await readdir(EMPLOYEES_DIR, { withFileTypes: true })
  const employees: HubEmployee[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const meta = await readMeta(e.name)
    if (meta) employees.push(meta)
  }
  return employees
}

export async function getEmployee(id: string): Promise<HubEmployee | null> {
  return readMeta(id)
}

export async function getEmployeePrompt(id: string): Promise<string | null> {
  const p = promptPath(id)
  if (!(await pathExists(p))) return null
  return readFile(p, "utf8")
}

export async function getEmployeeSkillIds(id: string): Promise<string[]> {
  try {
    const raw = await readFile(skillsRefPath(id), "utf8")
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export async function createEmployee(params: {
  id: string
  name: string
  description: string
  kind: "ordinary" | "dream"
  prompt_md: string
  skill_ids: string[]
  tags?: string[]
  source?: EmployeeSourceInfo
}): Promise<HubEmployee> {
  const dir = employeeDir(params.id)
  if (await pathExists(dir)) {
    throw new Error(`Employee "${params.id}" already exists`)
  }

  const now = nowIso()
  const employee: HubEmployee = {
    id: params.id,
    name: params.name,
    description: params.description,
    kind: params.kind,
    prompt_preview: makePreview(params.prompt_md),
    skill_ids: params.skill_ids,
    skill_count: params.skill_ids.length,
    tags: params.tags ?? [],
    source: params.source ?? { type: "official" },
    created_at: now,
    updated_at: now,
  }

  await mkdir(dir, { recursive: true })
  await writeFile(promptPath(params.id), params.prompt_md, "utf8")
  await writeFile(skillsRefPath(params.id), JSON.stringify(params.skill_ids, null, 2) + "\n", "utf8")
  await writeMeta(employee)
  return employee
}

export async function updateEmployee(
  id: string,
  patch: {
    name?: string
    description?: string
    kind?: "ordinary" | "dream"
    prompt_md?: string
    skill_ids?: string[]
    tags?: string[]
  },
): Promise<HubEmployee | null> {
  const existing = await readMeta(id)
  if (!existing) return null

  const updated: HubEmployee = {
    ...existing,
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    kind: patch.kind ?? existing.kind,
    tags: patch.tags ?? existing.tags,
    updated_at: nowIso(),
  }

  if (patch.prompt_md !== undefined) {
    updated.prompt_preview = makePreview(patch.prompt_md)
    await writeFile(promptPath(id), patch.prompt_md, "utf8")
  }

  if (patch.skill_ids !== undefined) {
    updated.skill_ids = patch.skill_ids
    updated.skill_count = patch.skill_ids.length
    await writeFile(skillsRefPath(id), JSON.stringify(patch.skill_ids, null, 2) + "\n", "utf8")
  }

  await writeMeta(updated)
  return updated
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const dir = employeeDir(id)
  if (!(await pathExists(dir))) return false
  await rm(dir, { recursive: true, force: true })
  return true
}

export async function bundleEmployee(id: string): Promise<Buffer | null> {
  const dir = employeeDir(id)
  if (!(await pathExists(dir))) return null

  const chunks: Buffer[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const e of entries) {
    if (!e.isFile()) continue
    const filePath = resolve(dir, e.name)
    const content = await readFile(filePath)
    chunks.push(tarEntry({ name: `${id}/${e.name}`, size: content.length }, content))
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
  headerBuf.write("0100644\0", 100, 8, "utf8")
  headerBuf.write("0000000\0", 108, 8, "utf8")
  headerBuf.write("0000000\0", 116, 8, "utf8")
  headerBuf.write("0", 156, 1, "utf8")

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

export { EMPLOYEES_DIR }
