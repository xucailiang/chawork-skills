import { getManifest, type ManifestResponse } from "@/lib/api";
import { StatsDisplay } from "./StatsDisplay";

export async function Stats() {
  let stats: ManifestResponse = { total_skills: 0, total_employees: 0, professions: [] };
  try {
    stats = await getManifest();
  } catch {
    // API not available
  }

  const items = [
    { label: "AI 技能", value: stats.total_skills, color: "var(--amber)" },
    { label: "数字员工", value: stats.total_employees, color: "var(--cyan)" },
    { label: "职业分类", value: stats.professions.filter((p) => p.skill_count > 0).length, color: "var(--green)" },
  ];

  return <StatsDisplay items={items} />;
}
