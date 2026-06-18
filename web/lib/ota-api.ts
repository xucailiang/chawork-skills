function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.API_INTERNAL_URL || "http://hub-api:3100";
}

async function fetchOta<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}/api/admin/ota${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `OTA API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ───────────────────────────────────────────────────────

export interface Release {
  id: number;
  version: string;
  update_type: "full" | "hot" | "both";
  channel: string;
  platform: string;
  release_notes: string | null;
  force_update: number;
  min_compatible_version: string | null;
  status: "draft" | "active" | "rollback" | "archived";
  created_at: string;
  published_at: string | null;
}

export interface Artifact {
  id: number;
  release_id: number;
  type: "full" | "patch" | "signature";
  filename: string;
  file_size: number;
  hash_sha256: string;
  from_version: string | null;
  file_path: string;
  created_at: string;
}

export interface GrayRule {
  id: number;
  release_id: number;
  rule_type: "percentage" | "device_list";
  percentage: number | null;
  device_ids: string | null;
  is_active: number;
  created_at: string;
}

export interface Channel {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
}

export interface StatsOverview {
  total_devices: number;
  latest_version: string | null;
  upgrade_rate: number;
  failure_rate: number;
}

export interface StatsResponse {
  overview: StatsOverview;
  distribution: { version: string; count: number }[];
  recent_events: {
    id: number;
    device_id: string;
    from_version: string;
    to_version: string;
    update_type: string;
    status: string;
    error_message: string | null;
    started_at: string;
  }[];
}

export interface ReleaseDetail extends Release {
  artifacts: Artifact[];
  stats: {
    total: number;
    success: number;
    failed: number;
    downloading: number;
    installing: number;
  };
}

// ── API Functions ────────────────────────────────────────────────

export async function getReleases(params?: {
  channel?: string;
  platform?: string;
  status?: string;
  page?: number;
}): Promise<{ items: Release[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.channel) qs.set("channel", params.channel);
  if (params?.platform) qs.set("platform", params.platform);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  return fetchOta(`/releases?${qs}`);
}

export async function getReleaseDetail(id: number): Promise<ReleaseDetail> {
  return fetchOta(`/releases/${id}`);
}

export async function createRelease(data: {
  version: string;
  update_type: string;
  channel: string;
  platform: string;
  release_notes?: string;
  force_update?: boolean;
  min_compatible_version?: string;
}): Promise<Release> {
  return fetchOta("/releases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRelease(
  id: number,
  data: Partial<Release>,
): Promise<Release> {
  return fetchOta(`/releases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function publishRelease(id: number): Promise<Release> {
  return fetchOta(`/releases/${id}/publish`, { method: "POST" });
}

export async function rollbackRelease(id: number): Promise<Release> {
  return fetchOta(`/releases/${id}/rollback`, { method: "POST" });
}

export async function deleteRelease(id: number): Promise<void> {
  return fetchOta(`/releases/${id}`, { method: "DELETE" });
}

export async function uploadArtifact(
  releaseId: number,
  file: File,
  type: "full" | "signature",
): Promise<Artifact> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const url = `${typeof window !== "undefined" ? "" : (process.env.API_INTERNAL_URL || "http://hub-api:3100")}/api/admin/ota/releases/${releaseId}/upload`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function generatePatches(
  releaseId: number,
): Promise<{ generated: string[]; skipped: string[] }> {
  return fetchOta(`/releases/${releaseId}/generate-patches`, { method: "POST" });
}

export async function getGrayRules(releaseId?: number): Promise<GrayRule[]> {
  const qs = releaseId ? `?release_id=${releaseId}` : "";
  return fetchOta(`/gray-rules${qs}`);
}

export async function createGrayRule(data: {
  release_id: number;
  rule_type: "percentage" | "device_list";
  percentage?: number;
  device_ids?: string[];
}): Promise<GrayRule> {
  return fetchOta("/gray-rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteGrayRule(id: number): Promise<void> {
  return fetchOta(`/gray-rules/${id}`, { method: "DELETE" });
}

export async function getChannels(): Promise<Channel[]> {
  return fetchOta("/channels");
}

export async function getStats(days?: number): Promise<StatsResponse> {
  const qs = days ? `?days=${days}` : "";
  return fetchOta(`/stats${qs}`);
}
