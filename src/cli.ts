import { cac } from "cac"
import { loadConfig } from "./config.js"
import { syncAllSources } from "./sources/aggregator.js"
import { scanAndUpdateState } from "./discover/scanner.js"
import { runTranslate } from "./translate/translator.js"
import { runClassify } from "./classify/classifier.js"
import { runExport } from "./export/archive.js"
import { installToChawork, listProfessionsFromManifest, defaultChaworkRoot } from "./install/chawork.js"
import { readState } from "./state/store.js"
import { startServer } from "./server/index.js"
import { log } from "./utils/logger.js"

const cli = cac("chawork-skills")

function splitList(v: string | undefined): string[] {
  if (!v) return []
  return v.split(",").map((s) => s.trim()).filter(Boolean)
}

cli
  .command("sync", "Sync all configured upstream git sources into data/sources/")
  .action(async () => {
    const cfg = await loadConfig()
    const res = await syncAllSources(cfg)
    log.info(`[sync] done. ${res.length} sources synced.`)
  })

cli
  .command("scan", "Scan SKILL.md files and update data/state.json")
  .action(async () => {
    const cfg = await loadConfig()
    const r = await scanAndUpdateState(cfg)
    log.info(`[scan] +${r.added.length} ~${r.changed.length} =${r.unchanged.length} -${r.deleted.length}`)
  })

cli
  .command("translate", "Translate pending skills with the configured LLM")
  .option("--limit <n>", "Stop after n skills")
  .option("--force", "Re-translate even if already ok")
  .option("--ids <list>", "Comma-separated skill ids to translate")
  .action(async (opts: { limit?: string; force?: boolean; ids?: string }) => {
    const cfg = await loadConfig()
    const r = await runTranslate(cfg, {
      limit: opts.limit ? Number(opts.limit) : undefined,
      force: !!opts.force,
      ids: opts.ids ? splitList(opts.ids) : undefined,
    })
    log.info(`[translate] translated=${r.translated.length} skipped=${r.skipped.length} failed=${r.failed.length}`)
    if (r.failed.length) for (const f of r.failed) log.error(`  - ${f.id}: ${f.error}`)
  })

cli
  .command("classify", "Classify skills into the fixed profession whitelist")
  .option("--limit <n>", "Stop after n skills")
  .option("--force", "Re-classify even if up-to-date")
  .option("--ids <list>", "Comma-separated skill ids to classify")
  .action(async (opts: { limit?: string; force?: boolean; ids?: string }) => {
    const cfg = await loadConfig()
    const r = await runClassify(cfg, {
      limit: opts.limit ? Number(opts.limit) : undefined,
      force: !!opts.force,
      ids: opts.ids ? splitList(opts.ids) : undefined,
    })
    log.info(`[classify] classified=${r.classified.length} skipped=${r.skipped.length} failed=${r.failed.length}`)
  })

cli.command("export", "Generate dist/professions/ and dist/professions.json").action(async () => {
  const cfg = await loadConfig()
  const r = await runExport(cfg)
  log.info(`[export] ${r.skills_exported} skills, professions=${r.professions.join(", ")}`)
})

cli
  .command("run", "Run sync → scan → translate → classify → export end-to-end")
  .option("--limit <n>", "Stop translate/classify after n skills each")
  .option("--skip-sync", "Skip the git sync step")
  .action(async (opts: { limit?: string; skipSync?: boolean }) => {
    const cfg = await loadConfig()
    if (!opts.skipSync) await syncAllSources(cfg)
    await scanAndUpdateState(cfg)
    const limit = opts.limit ? Number(opts.limit) : undefined
    await runTranslate(cfg, { limit })
    await runClassify(cfg, { limit })
    await runExport(cfg)
    log.info("[run] done.")
  })

cli.command("status", "Show counts: total skills, per-profession, failures").action(async () => {
  const state = await readState()
  const skills = Object.values(state.skills)
  const total = skills.length
  const ok = skills.filter((s) => s.status === "ok").length
  const pending = skills.filter((s) => s.status === "pending").length
  const failed = skills.filter((s) => s.status === "failed").length
  const deleted = skills.filter((s) => s.status === "deleted").length
  const byProf = new Map<string, number>()
  for (const s of skills) {
    if (s.status !== "ok") continue
    if (!s.profession) continue
    byProf.set(s.profession, (byProf.get(s.profession) ?? 0) + 1)
  }
  log.info(`[status] total=${total} ok=${ok} pending=${pending} failed=${failed} deleted=${deleted}`)
  for (const [p, c] of [...byProf.entries()].sort((a, b) => b[1] - a[1])) {
    log.info(`  ${p}: ${c}`)
  }
  if (failed) {
    log.info(`[status] failed list:`)
    for (const s of skills.filter((x) => x.status === "failed")) log.info(`  - ${s.id}: ${s.error}`)
  }
})

cli
  .command("install", "Install translated skills into a ChaWork root by profession")
  .option("--profession <list>", "Profession name(s), comma-separated")
  .option("--chawork-root <path>", "Override the ChaWork root path (defaults to platform-specific path)")
  .option("--list-professions", "List available professions in dist/ and exit")
  .option("--force", "Overwrite even if destination has non-chawork-skills content")
  .action(async (opts: {
    profession?: string
    chaworkRoot?: string
    listProfessions?: boolean
    force?: boolean
  }) => {
    if (opts.listProfessions) {
      const list = await listProfessionsFromManifest()
      log.info(`[install] available professions (count=${list.length}):`)
      for (const p of list) log.info(`  ${p.name} (${p.skill_count})`)
      log.info(`[install] default ChaWork root: ${defaultChaworkRoot()}`)
      return
    }
    const professions = splitList(opts.profession)
    if (professions.length === 0) {
      log.error("[install] --profession is required (or use --list-professions)")
      process.exitCode = 2
      return
    }
    const r = await installToChawork({
      professions,
      chaworkRoot: opts.chaworkRoot,
      force: !!opts.force,
    })
    log.info(`[install] root=${r.chawork_root} installed=${r.installed.length} skipped=${r.skipped.length}`)
    if (r.skipped.length) for (const s of r.skipped) log.warn(`  skipped ${s.skill_id}: ${s.reason}`)
  })

cli
  .command("serve", "Start the Skill Hub API server")
  .option("--port <port>", "Override server port")
  .option("--host <host>", "Override server host")
  .action(async (opts: { port?: string; host?: string }) => {
    const cfg = await loadConfig()
    const serverConfig = {
      port: opts.port ? Number(opts.port) : (cfg.server?.port ?? 3100),
      host: opts.host ?? cfg.server?.host ?? "0.0.0.0",
      cors_origins: cfg.server?.cors_origins ?? ["http://localhost:3000", "*"],
    }
    await startServer(serverConfig)
  })

cli.help()
cli.parse()
