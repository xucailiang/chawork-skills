import type { HubSkill, HubEmployee } from "../types.js"
import { listSkills } from "../store/skills.js"
import { listEmployees } from "../store/employees.js"

interface SearchIndex {
  skills: HubSkill[]
  employees: HubEmployee[]
  skillMap: Map<string, HubSkill>
  employeeMap: Map<string, HubEmployee>
}

let index: SearchIndex = {
  skills: [],
  employees: [],
  skillMap: new Map(),
  employeeMap: new Map(),
}

export async function rebuildIndex(): Promise<void> {
  const [skills, employees] = await Promise.all([listSkills(), listEmployees()])
  const skillMap = new Map<string, HubSkill>()
  for (const s of skills) skillMap.set(s.id, s)
  const employeeMap = new Map<string, HubEmployee>()
  for (const e of employees) employeeMap.set(e.id, e)
  index = { skills, employees, skillMap, employeeMap }
}

function matchesText(text: string, query: string): boolean {
  const q = query.toLowerCase()
  return text.toLowerCase().includes(q)
}

function skillMatchesQuery(skill: HubSkill, q: string): boolean {
  return (
    matchesText(skill.id, q) ||
    matchesText(skill.name, q) ||
    matchesText(skill.description_zh, q) ||
    matchesText(skill.description_en, q) ||
    skill.tags.some((t) => matchesText(t, q))
  )
}

function employeeMatchesQuery(employee: HubEmployee, q: string): boolean {
  return (
    matchesText(employee.id, q) ||
    matchesText(employee.name, q) ||
    matchesText(employee.description, q) ||
    employee.tags.some((t) => matchesText(t, q))
  )
}

export function searchSkills(opts: {
  q?: string
  profession?: string
  page?: number
  limit?: number
}): { total: number; page: number; limit: number; items: HubSkill[] } {
  let results = index.skills

  if (opts.profession) {
    results = results.filter((s) => s.profession === opts.profession)
  }
  if (opts.q) {
    const q = opts.q
    results = results.filter((s) => skillMatchesQuery(s, q))
  }

  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20))
  const total = results.length
  const start = (page - 1) * limit
  const items = results.slice(start, start + limit)

  return { total, page, limit, items }
}

export function searchEmployees(opts: {
  q?: string
  tags?: string[]
  page?: number
  limit?: number
}): { total: number; page: number; limit: number; items: HubEmployee[] } {
  let results = index.employees

  if (opts.tags && opts.tags.length > 0) {
    const tagSet = new Set(opts.tags)
    results = results.filter((e) => e.tags.some((t) => tagSet.has(t)))
  }
  if (opts.q) {
    const q = opts.q
    results = results.filter((e) => employeeMatchesQuery(e, q))
  }

  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20))
  const total = results.length
  const start = (page - 1) * limit
  const items = results.slice(start, start + limit)

  return { total, page, limit, items }
}

export function getSkillFromIndex(id: string): HubSkill | undefined {
  return index.skillMap.get(id)
}

export function getEmployeeFromIndex(id: string): HubEmployee | undefined {
  return index.employeeMap.get(id)
}

export function findEmployeesReferencingSkill(skillId: string): string[] {
  return index.employees
    .filter((e) => e.skill_ids.includes(skillId))
    .map((e) => e.id)
}

export function getManifestStats(): {
  total_skills: number
  total_employees: number
  professions: { name: string; skill_count: number; employee_count: number }[]
} {
  const profMap = new Map<string, { skills: number; employees: number }>()

  for (const s of index.skills) {
    const entry = profMap.get(s.profession) ?? { skills: 0, employees: 0 }
    entry.skills++
    profMap.set(s.profession, entry)
  }

  for (const e of index.employees) {
    const skillProfs = new Set<string>()
    for (const sid of e.skill_ids) {
      const skill = index.skillMap.get(sid)
      if (skill) skillProfs.add(skill.profession)
    }
    for (const prof of skillProfs) {
      const entry = profMap.get(prof) ?? { skills: 0, employees: 0 }
      entry.employees++
      profMap.set(prof, entry)
    }
  }

  const professions = [...profMap.entries()]
    .map(([name, counts]) => ({
      name,
      skill_count: counts.skills,
      employee_count: counts.employees,
    }))
    .sort((a, b) => b.skill_count - a.skill_count)

  return {
    total_skills: index.skills.length,
    total_employees: index.employees.length,
    professions,
  }
}
