type Level = "info" | "warn" | "error" | "debug"

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function currentLevel(): number {
  const v = process.env.CHAWORK_SKILLS_LOG?.toLowerCase() as Level | undefined
  return v && LEVELS[v] !== undefined ? LEVELS[v] : LEVELS.info
}

function emit(level: Level, args: unknown[]) {
  if (LEVELS[level] < currentLevel()) return
  const prefix = `[${new Date().toISOString()}] [${level}]`
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  fn(prefix, ...args)
}

export const log = {
  debug: (...a: unknown[]) => emit("debug", a),
  info: (...a: unknown[]) => emit("info", a),
  warn: (...a: unknown[]) => emit("warn", a),
  error: (...a: unknown[]) => emit("error", a),
}
