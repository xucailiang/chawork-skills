/** OTA 系统共享类型定义 */

export interface Release {
  id: number
  version: string
  update_type: "full" | "hot" | "both"
  channel: string
  platform: string
  release_notes: string | null
  force_update: number
  min_compatible_version: string | null
  status: "draft" | "active" | "rollback" | "archived"
  created_at: string
  published_at: string | null
}

export interface Artifact {
  id: number
  release_id: number
  type: "full" | "patch" | "signature"
  filename: string
  file_size: number
  hash_sha256: string
  from_version: string | null
  file_path: string
  created_at: string
}

export interface GrayRule {
  id: number
  release_id: number
  rule_type: "percentage" | "device_list"
  percentage: number | null
  device_ids: string | null
  is_active: number
  created_at: string
}

export interface Channel {
  id: number
  name: string
  description: string | null
  is_active: number
}

export interface UpdateStat {
  id: number
  release_id: number
  device_id: string
  from_version: string
  to_version: string
  update_type: "full" | "hot"
  status: "downloading" | "installing" | "success" | "failed"
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface CreateReleaseInput {
  version: string
  update_type: "full" | "hot" | "both"
  channel?: string
  platform: string
  release_notes?: string
  force_update?: boolean
  min_compatible_version?: string
}

export interface UpdateCheckParams {
  current_version: string
  target: string
  arch: string
  device_id: string
  channel?: string
}

export interface UpdateCheckResponse {
  update_type: "full" | "hot"
  version: string
  release_notes: string | null
  force_update: boolean
  pub_date: string
  url?: string
  signature?: string
  patch_url?: string
  patch_hash?: string
  patch_size?: number
  full_fallback_url?: string
}

export interface ReportInput {
  device_id: string
  from_version: string
  to_version: string
  update_type: "full" | "hot"
  status: "downloading" | "installing" | "success" | "failed"
  error_message?: string
}

export interface StatsOverview {
  total_devices: number
  latest_version: string | null
  upgrade_rate: number
  failure_rate: number
}
