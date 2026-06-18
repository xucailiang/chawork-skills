-- OTA 自动升级系统表结构
CREATE TABLE IF NOT EXISTS releases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  version       TEXT NOT NULL,
  update_type   TEXT NOT NULL CHECK(update_type IN ('full', 'hot')),
  channel       TEXT NOT NULL DEFAULT 'stable',
  platform      TEXT NOT NULL,
  release_notes TEXT,
  force_update  INTEGER DEFAULT 0,
  min_compatible_version TEXT,
  status        TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'rollback', 'archived')),
  created_at    TEXT DEFAULT (datetime('now')),
  published_at  TEXT,
  UNIQUE(version, platform, channel)
);

CREATE TABLE IF NOT EXISTS artifacts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id    INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK(type IN ('full', 'patch', 'signature')),
  filename      TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  hash_sha256   TEXT NOT NULL,
  from_version  TEXT,
  file_path     TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gray_rules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id    INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  rule_type     TEXT NOT NULL CHECK(rule_type IN ('percentage', 'device_list')),
  percentage    INTEGER,
  device_ids    TEXT,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channels (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_active     INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS update_stats (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id    INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  from_version  TEXT NOT NULL,
  to_version    TEXT NOT NULL,
  update_type   TEXT NOT NULL CHECK(update_type IN ('full', 'hot')),
  status        TEXT NOT NULL CHECK(status IN ('downloading', 'installing', 'success', 'failed')),
  error_message TEXT,
  started_at    TEXT DEFAULT (datetime('now')),
  completed_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_releases_channel_platform ON releases(channel, platform);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_release_id ON artifacts(release_id);
CREATE INDEX IF NOT EXISTS idx_gray_rules_release_id ON gray_rules(release_id);
CREATE INDEX IF NOT EXISTS idx_update_stats_release_id ON update_stats(release_id);
CREATE INDEX IF NOT EXISTS idx_update_stats_device_id ON update_stats(device_id);

-- 默认渠道
INSERT OR IGNORE INTO channels (name, description) VALUES ('stable', '稳定版');
INSERT OR IGNORE INTO channels (name, description) VALUES ('beta', '测试版');
INSERT OR IGNORE INTO channels (name, description) VALUES ('canary', '金丝雀版');
