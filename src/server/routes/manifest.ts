import { Hono } from "hono"
import { getManifestStats } from "../search.js"
import { PROFESSIONS } from "../../classify/professions.js"

const manifest = new Hono()

manifest.get("/manifest", (c) => {
  return c.json(getManifestStats())
})

manifest.get("/professions", (c) => {
  const stats = getManifestStats()
  const statsMap = new Map(stats.professions.map((p) => [p.name, p]))

  const professions = PROFESSIONS.map((name) => {
    const s = statsMap.get(name)
    return {
      name,
      skill_count: s?.skill_count ?? 0,
      employee_count: s?.employee_count ?? 0,
    }
  })

  return c.json(professions)
})

export { manifest }
