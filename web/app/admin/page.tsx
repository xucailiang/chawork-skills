"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSkills,
  getEmployees,
  deleteSkill,
  deleteEmployee,
  importFromUrl,
  type HubSkill,
  type HubEmployee,
  type ImportGithubResponse,
} from "@/lib/api";
import { ImportPanel } from "@/components/admin/ImportPanel";
import { SkillTable } from "@/components/admin/SkillTable";
import { EmployeeTable } from "@/components/admin/EmployeeTable";

type Tab = "import" | "skills" | "employees";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [skills, setSkills] = useState<HubSkill[]>([]);
  const [employees, setEmployees] = useState<HubEmployee[]>([]);
  const [skillPage, setSkillPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [skillTotal, setSkillTotal] = useState(0);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadSkills = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getSkills({ page, limit: 20 });
      setSkills(res.items);
      setSkillTotal(res.total);
      setSkillPage(page);
    } catch {}
    setLoading(false);
  }, []);

  const loadEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getEmployees({ page, limit: 20 });
      setEmployees(res.items);
      setEmployeeTotal(res.total);
      setEmployeePage(page);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSkills();
    loadEmployees();
  }, [loadSkills, loadEmployees]);

  const handleDeleteSkill = async (id: string) => {
    if (!confirm(`确定删除技能 "${id}"？`)) return;
    try {
      await deleteSkill(id);
      await loadSkills(skillPage);
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm(`确定删除员工 "${id}"？`)) return;
    try {
      await deleteEmployee(id);
      await loadEmployees(employeePage);
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  };

  const handleImportDone = () => {
    loadSkills();
    loadEmployees();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "import", label: "导入" },
    { key: "skills", label: `技能 (${skillTotal})` },
    { key: "employees", label: `员工 (${employeeTotal})` },
  ];

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1200px, 92%)",
        margin: "0 auto",
        padding: "140px 0 80px",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "var(--text-hi)",
          marginBottom: 8,
        }}
      >
        管理后台
      </h1>
      <p style={{ fontSize: "0.9rem", color: "var(--text-dim)", marginBottom: 32 }}>
        导入技能源、管理技能和员工
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--text-hi)" : "var(--text-dim)",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--amber)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "import" && <ImportPanel onDone={handleImportDone} />}
      {tab === "skills" && (
        <SkillTable
          skills={skills}
          total={skillTotal}
          page={skillPage}
          loading={loading}
          onPageChange={loadSkills}
          onDelete={handleDeleteSkill}
          onRefresh={() => loadSkills(skillPage)}
        />
      )}
      {tab === "employees" && (
        <EmployeeTable
          employees={employees}
          total={employeeTotal}
          page={employeePage}
          loading={loading}
          onPageChange={loadEmployees}
          onDelete={handleDeleteEmployee}
          onRefresh={() => loadEmployees(employeePage)}
        />
      )}
    </div>
  );
}
