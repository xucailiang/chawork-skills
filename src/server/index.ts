import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { serve } from "@hono/node-server"
import { skills } from "./routes/skills.js"
import { employees } from "./routes/employees.js"
import { manifest } from "./routes/manifest.js"
import { health } from "./routes/health.js"
import { rebuildIndex } from "./search.js"
import { log } from "../utils/logger.js"
import type { ServerConfig } from "../types.js"

export function createApp(corsOrigins: string[] = ["*"]): Hono {
  const app = new Hono()

  app.use("*", logger())
  app.use(
    "*",
    cors({
      origin: corsOrigins,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  )

  const api = new Hono()
  api.route("/skills", skills)
  api.route("/employees", employees)
  api.route("/", manifest)
  api.route("/health", health)

  app.route("/api/v1", api)

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
      },
    })
  })

  return app
}

export async function startServer(config: ServerConfig): Promise<void> {
  log.info("[server] building search index...")
  await rebuildIndex()

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
    },
  )
}
