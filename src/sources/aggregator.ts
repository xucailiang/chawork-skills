import type { AppConfig, StateFile } from "../types.js"
import { syncGitSource, type SyncResult } from "./git.js"
import { nowIso, readState, writeState } from "../state/store.js"
import { log } from "../utils/logger.js"

export async function syncAllSources(config: AppConfig): Promise<SyncResult[]> {
  const state: StateFile = await readState()
  const results: SyncResult[] = []
  for (const src of config.sources) {
    const res = await syncGitSource(src)
    state.sources[src.name] = {
      url: src.url,
      ref: src.ref,
      last_sync_at: nowIso(),
      last_commit: res.commit,
    }
    results.push(res)
    log.info(`[sync] ${src.name} @ ${res.commit.slice(0, 8)}`)
  }
  await writeState(state)
  return results
}
