import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { serve } from "@hono/node-server"
import { skills } from "./routes/skills.js"
import { employees } from "./routes/employees.js"
import { manifest } from "./routes/manifest.js"
import { health } from "./routes/health.js"
import { ota } from "./routes/ota.js"
import { adminOta } from "./routes/admin-ota.js"
import { rebuildIndex } from "./search.js"
import { setOnTranslateDone } from "../pipeline/runner.js"
import { initDb } from "./db/sqlite.js"
import { log } from "../utils/logger.js"
import type { ServerConfig } from "../types.js"

/** 将配置中的 cors_origins 转为 hono/cors 可识别的 origin 规则 */
function resolveCorsOrigin(origins: string[]): string | string[] | ((origin: string) => string | undefined) {
  if (origins.includes("*")) {
    return (origin) => origin
  }
  return origins
}

export function createApp(corsOrigins: string[] = ["*"]): Hono {
  const app = new Hono()

  app.use("*", logger())
  app.use(
    "*",
    cors({
      origin: resolveCorsOrigin(corsOrigins),
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  )

  const api = new Hono()
  api.route("/skills", skills)
  api.route("/employees", employees)
  api.route("/", manifest)
  api.route("/health", health)

  app.route("/api/v1", api)
  app.route("/api/ota", ota)
  app.route("/api/admin/ota", adminOta)

  app.get("/", (c) => {
    return c.json({
      name: "ChaWork Skill Hub",
      version: "0.1.0",
      api: "/api/v1",
      docs: {
        skills: "/api/v1/skills",
        employees: "/api/v1/employees",
        manifest: "/api/v1/manifest",
        professions: "/api/v1/professions",
        health: "/api/v1/health",
        ota_check: "/api/ota/check",
        ota_admin: "/api/admin/ota/releases",
      },
    })
  })

  return app
}

export async function startServer(config: ServerConfig): Promise<void> {
  log.info("[server] initializing OTA database...")
  initDb()

  log.info("[server] building search index...")
  await rebuildIndex()

  setOnTranslateDone(async () => {
    log.info("[server] translate done, rebuilding search index...")
    await rebuildIndex()
  })

  const app = createApp(config.cors_origins)

  serve(
    {
      fetch: app.fetch,
      port: config.port,
      hostname: config.host,
    },
    (info) => {
      log.info(`[server] ChaWork Skill Hub running at http://${config.host}:${config.port}`)
      log.info(`[server] API base: http://${config.host}:${config.port}/api/v1`)
      log.info(`[server] OTA API: http://${config.host}:${config.port}/api/ota`)
      log.info(`[server] OTA Admin: http://${config.host}:${config.port}/api/admin/ota`)
    },
  )
}
