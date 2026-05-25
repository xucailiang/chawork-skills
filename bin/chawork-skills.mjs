#!/usr/bin/env node
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const here = dirname(fileURLToPath(import.meta.url))
const cliEntry = resolve(here, "..", "dist-build", "cli.js")

const res = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  stdio: "inherit",
})
process.exit(res.status ?? 1)
