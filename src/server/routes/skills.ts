import { Hono } from "hono"
import {
  getSkill,
  getSkillMd,
  createSkill,
  updateSkill,
  deleteSkill,
  bundleSkill,
} from "../../store/skills.js"
import { searchSkills, findEmployeesReferencingSkill, rebuildIndex } from "../search.js"
import { isProfession } from "../../classify/professions.js"
import { runImportFromUrl, getJob, listJobs } from "../../pipeline/runner.js"

const skills = new Hono()

skills.get("/", (c) => {
  const q = c.req.query("q")
  const profession = c.req.query("profession")
  const page = Number(c.req.query("page") || "1")
  const limit = Number(c.req.query("limit") || "20")

  const result = searchSkills({ q, profession, page, limit })
  return c.json(result)
})

skills.get("/:id", async (c) => {
  const id = c.req.param("id")
  const skill = await getSkill(id)
  if (!skill) return c.json({ error: "Skill not found" }, 404)

  const skillMd = await getSkillMd(id)
  const referencedBy = findEmployeesReferencingSkill(id)

  return c.json({
    ...skill,
    skill_md: skillMd ?? "",
    referenced_by_employees: referencedBy,
  })
})

skills.post("/", async (c) => {
  const body = await c.req.json()
  const { id, name, description_zh, description_en, profession, skill_md, tags } = body

  if (!id || !name || !skill_md) {
    return c.json({ error: "id, name, and skill_md are required" }, 400)
  }
  if (profession && !isProfession(profession)) {
    return c.json({ error: `Invalid profession: ${profession}` }, 400)
  }

  try {
    const skill = await createSkill({
      id,
      name,
      description_zh: description_zh ?? "",
      description_en: description_en ?? "",
      profession: profession ?? "通用技能",
      skill_md,
      tags,
    })
    await rebuildIndex()
    return c.json(skill, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return c.json({ error: msg }, 409)
  }
})

skills.put("/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()

  if (body.profession && !isProfession(body.profession)) {
    return c.json({ error: `Invalid profession: ${body.profession}` }, 400)
  }

  const updated = await updateSkill(id, body)
  if (!updated) return c.json({ error: "Skill not found" }, 404)

  await rebuildIndex()
  return c.json(updated)
})

skills.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const deleted = await deleteSkill(id)
  if (!deleted) return c.json({ error: "Skill not found" }, 404)

  await rebuildIndex()
  return c.json({ ok: true })
})

skills.get("/:id/bundle", async (c) => {
  const id = c.req.param("id")
  const buf = await bundleSkill(id)
  if (!buf) return c.json({ error: "Skill not found" }, 404)

  return new Response(buf, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${id}.tar.gz"`,
    },
  })
})

skills.post("/import/github", async (c) => {
  const body = await c.req.json()
  const { url, ref } = body

  if (!url) {
    return c.json({ error: "url is required" }, 400)
  }

  try {
    const result = await runImportFromUrl(url, ref ?? "main")
    return c.json(result, 202)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed"
    return c.json({ error: msg }, 500)
  }
})

skills.get("/import/jobs", (c) => {
  return c.json(listJobs())
})

skills.get("/import/jobs/:id", (c) => {
  const job = getJob(c.req.param("id"))
  if (!job) return c.json({ error: "Job not found" }, 404)
  return c.json(job)
})

export { skills }
