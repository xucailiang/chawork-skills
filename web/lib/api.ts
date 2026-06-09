const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ───────────────────────────────────────────────────────

export interface HubSkill {
  id: string;
  name: string;
  description_zh: string;
  description_en: string;
  profession: string;
  content_hash: string;
  source: { type: string; repo?: string; path?: string; commit?: string; author?: string };
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SkillDetail extends HubSkill {
  skill_md: string;
  referenced_by_employees: string[];
}

export interface HubEmployee {
  id: string;
  name: string;
  description: string;
  kind: "ordinary" | "dream";
  prompt_preview: string;
  skill_ids: string[];
  skill_count: number;
  tags: string[];
  source: { type: string };
  created_at: string;
  updated_at: string;
}

export interface EmployeeDetail extends HubEmployee {
  prompt_md: string;
  skills: { id: string; name: string; description_zh: string }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

export interface ManifestResponse {
  total_skills: number;
  total_employees: number;
  professions: { name: string; skill_count: number; employee_count: number }[];
}

export interface ProfessionInfo {
  name: string;
  skill_count: number;
  employee_count: number;
}

// ── API Functions ───────────────────────────────────────────────

export async function getManifest(): Promise<ManifestResponse> {
  return fetchApi("/manifest");
}

export async function getProfessions(): Promise<ProfessionInfo[]> {
  return fetchApi("/professions");
}

export async function getSkills(params?: {
  q?: string;
  profession?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<HubSkill>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.profession) searchParams.set("profession", params.profession);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return fetchApi(`/skills${qs ? `?${qs}` : ""}`);
}

export async function getSkillDetail(id: string): Promise<SkillDetail> {
  return fetchApi(`/skills/${encodeURIComponent(id)}`);
}

export async function getEmployees(params?: {
  q?: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<HubEmployee>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.tags) searchParams.set("tags", params.tags);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return fetchApi(`/employees${qs ? `?${qs}` : ""}`);
}

export async function getEmployeeDetail(id: string): Promise<EmployeeDetail> {
  return fetchApi(`/employees/${encodeURIComponent(id)}`);
}

export async function getHealth(): Promise<{ status: string; timestamp: string }> {
  return fetchApi("/health");
}
