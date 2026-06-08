import { Hono } from "hono"
import {
  getEmployee,
  getEmployeePrompt,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bundleEmployee,
} from "../../store/employees.js"
import { getSkill } from "../../store/skills.js"
import { searchEmployees, rebuildIndex } from "../search.js"

const employees = new Hono()

employees.get("/", (c) => {
  const q = c.req.query("q")
  const tagsParam = c.req.query("tags")
  const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : undefined
  const page = Number(c.req.query("page") || "1")
  const limit = Number(c.req.query("limit") || "20")

  const result = searchEmployees({ q, tags, page, limit })
  return c.json(result)
})

employees.get("/:id", async (c) => {
  const id = c.req.param("id")
  const employee = await getEmployee(id)
  if (!employee) return c.json({ error: "Employee not found" }, 404)

  const promptMd = await getEmployeePrompt(id)

  const skills: { id: string; name: string; description_zh: string }[] = []
  for (const sid of employee.skill_ids) {
    const skill = await getSkill(sid)
    if (skill) {
      skills.push({ id: skill.id, name: skill.name, description_zh: skill.description_zh })
    }
  }

  return c.json({
    ...employee,
    prompt_md: promptMd ?? "",
    skills,
  })
})

employees.post("/", async (c) => {
  const body = await c.req.json()
  const { id, name, description, kind, prompt_md, skill_ids, tags } = body

  if (!id || !name || !prompt_md) {
    return c.json({ error: "id, name, and prompt_md are required" }, 400)
  }
  if (kind && kind !== "ordinary" && kind !== "dream") {
    return c.json({ error: "kind must be 'ordinary' or 'dream'" }, 400)
  }

  if (skill_ids && Array.isArray(skill_ids)) {
    for (const sid of skill_ids) {
      const skill = await getSkill(sid)
      if (!skill) {
        return c.json({ error: `Referenced skill not found: ${sid}` }, 400)
      }
    }
  }

  try {
    const employee = await createEmployee({
      id,
      name,
      description: description ?? "",
      kind: kind ?? "ordinary",
      prompt_md,
      skill_ids: skill_ids ?? [],
      tags,
    })
    await rebuildIndex()
    return c.json(employee, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return c.json({ error: msg }, 409)
  }
})

employees.put("/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()

  if (body.skill_ids && Array.isArray(body.skill_ids)) {
    for (const sid of body.skill_ids) {
      const skill = await getSkill(sid)
      if (!skill) {
        return c.json({ error: `Referenced skill not found: ${sid}` }, 400)
      }
    }
  }

  const updated = await updateEmployee(id, body)
  if (!updated) return c.json({ error: "Employee not found" }, 404)

  await rebuildIndex()
  return c.json(updated)
})

employees.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const deleted = await deleteEmployee(id)
  if (!deleted) return c.json({ error: "Employee not found" }, 404)

  await rebuildIndex()
  return c.json({ ok: true })
})

employees.get("/:id/bundle", async (c) => {
  const id = c.req.param("id")
  const buf = await bundleEmployee(id)
  if (!buf) return c.json({ error: "Employee not found" }, 404)

  return new Response(buf, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${id}.tar.gz"`,
    },
  })
})

export { employees }
