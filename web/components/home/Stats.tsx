import { getManifest, type ManifestResponse } from "@/lib/api";

export async function Stats() {
  let stats: ManifestResponse = { total_skills: 0, total_employees: 0, professions: [] };
  try {
    stats = await getManifest();
  } catch {
    // API not available, show zeros
  }

  const activeProfessions = stats.professions.filter((p) => p.skill_count > 0).length;

  const items = [
    { label: "AI 技能", value: stats.total_skills },
    { label: "数字员工", value: stats.total_employees },
    { label: "职业领域", value: activeProfessions || 35 },
  ];

  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-4xl font-bold text-primary">{item.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
