import Database from "better-sqlite3"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { log } from "../../utils/logger.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.")
  }
  return db
}

export function initDb(dbPath?: string): Database.Database {
  if (db) return db

  const resolvedPath = dbPath ?? join(process.cwd(), "data/ota/ota.db")
  mkdirSync(dirname(resolvedPath), { recursive: true })

  db = new Database(resolvedPath)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  runMigrations(db)
  log.info(`[ota-db] initialized at ${resolvedPath}`)
  return db
}

function runMigrations(database: Database.Database): void {
  const migrationPath = join(__dirname, "migrations/001_ota_tables.sql")
  const sql = readFileSync(migrationPath, "utf-8")
  database.exec(sql)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
