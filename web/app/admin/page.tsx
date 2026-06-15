"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSkills,
  getEmployees,
  deleteSkill,
  deleteEmployee,
  type HubSkill,
  type HubEmployee,
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
  const [skillSearch, setSkillSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const skillSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const employeeSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSkills = useCallback(async (page = 1, q?: string) => {
    setLoading(true);
    try {
      const res = await getSkills({ page, limit: 20, q: q ?? undefined });
      setSkills(res.items);
      setSkillTotal(res.total);
      setSkillPage(page);
    } catch {}
    setLoading(false);
  }, []);

  const loadEmployees = useCallback(async (page = 1, q?: string) => {
    setLoading(true);
    try {
      const res = await getEmployees({ page, limit: 20, q: q ?? undefined });
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
    loadSkills(1, skillSearch);
    loadEmployees(1, employeeSearch);
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

      {/* Content — use display:none to keep state alive across tab switches */}
      <div style={{ display: tab === "import" ? "block" : "none" }}>
        <ImportPanel onDone={handleImportDone} />
      </div>
      <div style={{ display: tab === "skills" ? "block" : "none" }}>
        <SkillTable
          skills={skills}
          total={skillTotal}
          page={skillPage}
          loading={loading}
          search={skillSearch}
          onSearchChange={(q) => {
            setSkillSearch(q);
            if (skillSearchTimer.current) clearTimeout(skillSearchTimer.current);
            skillSearchTimer.current = setTimeout(() => loadSkills(1, q), 300);
          }}
          onPageChange={(p) => loadSkills(p, skillSearch)}
          onDelete={handleDeleteSkill}
          onRefresh={() => loadSkills(skillPage, skillSearch)}
        />
      </div>
      <div style={{ display: tab === "employees" ? "block" : "none" }}>
        <EmployeeTable
          employees={employees}
          total={employeeTotal}
          page={employeePage}
          loading={loading}
          search={employeeSearch}
          onSearchChange={(q) => {
            setEmployeeSearch(q);
            if (employeeSearchTimer.current) clearTimeout(employeeSearchTimer.current);
            employeeSearchTimer.current = setTimeout(() => loadEmployees(1, q), 300);
          }}
          onPageChange={(p) => loadEmployees(p, employeeSearch)}
          onDelete={handleDeleteEmployee}
          onRefresh={() => loadEmployees(employeePage, employeeSearch)}
        />
      </div>
    </div>
  );
}
