import matter from "gray-matter"

export interface ParsedSkill {
  data: Record<string, unknown>
  body: string
  raw: string
}

export function parseSkill(raw: string): ParsedSkill {
  const parsed = matter(raw)
  return {
    data: (parsed.data ?? {}) as Record<string, unknown>,
    body: parsed.content ?? "",
    raw,
  }
}

export function stringifySkill(data: Record<string, unknown>, body: string): string {
  const ensuredBody = body.startsWith("\n") ? body : `\n${body}`
  return matter.stringify(ensuredBody, data)
}

const FENCE_RE = /(^|\n)(```[\s\S]*?\n```)(\n|$)/g

export function extractFences(body: string): { stripped: string; fences: string[] } {
  const fences: string[] = []
  const stripped = body.replace(FENCE_RE, (_m, lead, fence, trail) => {
    fences.push(fence)
    return `${lead}__FENCE_${fences.length - 1}__${trail}`
  })
  return { stripped, fences }
}

export function restoreFences(stripped: string, fences: string[]): string {
  return stripped.replace(/__FENCE_(\d+)__/g, (_m, i: string) => fences[Number(i)] ?? "")
}

export function truncateForPrompt(text: string, max = 2000): string {
  if (text.length <= max) return text
  return text.slice(0, max) + "\n…(truncated)"
}
