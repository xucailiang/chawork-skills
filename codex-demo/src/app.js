/* ============================================================
   CHAWORK — Full Demo: Workspace + Skill + Employee + Dream
   ============================================================ */

// ---------- UTILS ----------
const uid = () => crypto.randomUUID();

const s = {
  get(k, fb = []) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch { return fb; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---------- DEFAULT DATA ----------
const DEFAULT_SKILLS = [
  { id: uid(), name: '选题策划', desc: '从素材中提炼内容角度、标题和发布节奏，生成选题矩阵', tags: ['内容', '策划'], emoji: '📝' },
  { id: uid(), name: '竞品分析', desc: '系统化分析竞品定位、功能、定价和内容策略，输出对比报告', tags: ['研究', '分析'], emoji: '🔍' },
  { id: uid(), name: '客户研究', desc: '整理客户背景、痛点、机会和跟进建议，生成客户画像', tags: ['研究', '客户'], emoji: '👤' },
  { id: uid(), name: '数据可视化', desc: '将原始数据转化为交互式图表和仪表板', tags: ['数据', '可视化'], emoji: '📊' },
  { id: uid(), name: '交付写作', desc: '将项目资料转成结构化报告、方案、复盘和行动清单', tags: ['写作', '交付'], emoji: '✍️' },
  { id: uid(), name: '财务建模', desc: '构建财务预测模型、敏感性分析和估值报告', tags: ['财务', '建模'], emoji: '💰' },
  { id: uid(), name: '内容优化', desc: 'SEO 优化、标题测试、内容节奏规划和分发策略', tags: ['内容', '优化'], emoji: '🎯' },
  { id: uid(), name: '用户访谈', desc: '设计访谈提纲、整理访谈纪要、提取关键洞察和行动建议', tags: ['研究', '用户'], emoji: '🎙️' },
];

const DEFAULT_EMPLOYEES = [
  {
    id: uid(), name: '选题策划师', role: '内容策略与选题规划',
    prompt: '你是一位资深内容策划师。\n\n## 工作方法\n1. 分析原始素材中的核心矛盾和受众兴趣点\n2. 基于热点趋势和长期价值两个维度评估选题\n3. 为每个选题提供：角度建议、标题变体（3-5个）、预期受众、发布时机\n\n## 输出格式\n- 选题矩阵表格（选题名称 | 角度 | 优先级 | 预期效果）\n- 每个选题 200 字以内的理由\n\n## 判断标准\n- 优先选择有争议性或反差感的角度\n- 避免纯信息堆砌，必须有观点',
    skillIds: [], emoji: '🧑‍💻',
  },
  {
    id: uid(), name: '客户研究助理', role: '客户背景研究与跟进建议',
    prompt: '你是一位客户研究专家。\n\n## 工作方法\n1. 从提供的资料中提取客户组织架构、关键决策者和业务痛点\n2. 分析客户所在行业的趋势和竞争格局\n3. 基于客户历史互动记录识别跟进机会\n\n## 输出格式\n- 客户一页纸画像\n- 痛点雷达图（文字描述）\n- 下次跟进建议（含话术要点）\n\n## 判断标准\n- 优先关注客户最近的业务变动\n- 每次输出必须有可执行的下一步建议',
    skillIds: [], emoji: '🕵️',
  },
  {
    id: uid(), name: '交付写手', role: '方案与报告撰写',
    prompt: '你是一位专业交付写手。\n\n## 工作方法\n1. 梳理项目背景、目标和已有资料\n2. 构建逻辑骨架：背景→分析→发现→建议→行动计划\n3. 用数据支撑每个结论\n\n## 输出格式\n- 执行摘要（300 字以内）\n- 正文用结构化 Markdown，二级标题组织\n- 附录包含数据来源和方法说明\n\n## 风格要求\n- 简洁有力，避免行业黑话\n- 每个部分必须有明确的"所以呢"（so what）',
    skillIds: [], emoji: '📋',
  },
];

const DEFAULT_WORKSPACES = [];

// ---------- STATE ----------
let skills = s.get('chawork_skills');
let employees = s.get('chawork_employees');
let workspaces = s.get('chawork_workspaces');
let pendingDelete = null;

// Init defaults
if (!skills.length) { skills = DEFAULT_SKILLS; s.set('chawork_skills', skills); }
if (!employees.length) { employees = DEFAULT_EMPLOYEES; s.set('chawork_employees', employees); }
if (workspaces.length < 6) {
  // Create default workspaces bound to employees
  const empMap = {};
  employees.forEach((e) => { empMap[e.name] = e.id; });
  workspaces = [
    { id: uid(), name: 'Q3 产品内容矩阵', desc: '围绕新产品线规划 Q3 内容策略与选题日历', employeeId: empMap['选题策划师'] || '', createdAt: '2026-06-01' },
    { id: uid(), name: '客户 A 尽职调查', desc: '深度研究客户A的组织架构、技术栈与采购决策流程', employeeId: empMap['客户研究助理'] || '', createdAt: '2026-06-03' },
    { id: uid(), name: 'B轮融资商业计划书', desc: '撰写BP、财务模型与投资人沟通材料', employeeId: empMap['交付写手'] || '', createdAt: '2026-06-05' },
    { id: uid(), name: '竞品月度追踪', desc: '持续追踪3家核心竞品的功能更新、定价变化与市场动态', employeeId: empMap['客户研究助理'] || '', createdAt: '2026-06-07' },
    { id: uid(), name: '个人知识库整理', desc: '将散落的文章、笔记和截图整理为可检索的结构化知识库', employeeId: empMap['交付写手'] || '', createdAt: '2026-06-08' },
    { id: uid(), name: '短视频 IP 孵化方案', desc: '为潜力创作者设计定位、内容方向和商业化路径', employeeId: empMap['选题策划师'] || '', createdAt: '2026-06-08' },
  ];
  s.set('chawork_workspaces', workspaces);
}

// Link employees to skills
function ensureSkillLinks() {
  let changed = false;
  const updated = employees.map((emp) => {
    if (!emp.skillIds || emp.skillIds.length === 0) {
      changed = true;
      const n = 1 + Math.floor(Math.random() * 3);
      const shuf = [...skills].sort(() => Math.random() - 0.5);
      return { ...emp, skillIds: shuf.slice(0, n).map((s) => s.id) };
    }
    return emp;
  });
  if (changed) { employees = updated; s.set('chawork_employees', employees); }
}
ensureSkillLinks();

// Ensure dreamResults and sessions on employees
employees = employees.map((e) => ({
  ...e,
  dreamResults: e.dreamResults || [],
  sessions: e.sessions || generateSessions(e),
}));
s.set('chawork_employees', employees);

// ---------- MOCK SESSION GENERATION ----------
function generateSessions(emp) {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const day = (offset) => { const d = new Date(now); d.setDate(d.getDate() - offset); return fmt(d); };

  const templates = {
    '选题策划师': [
      { summary: '分析"AI 对内容行业的影响"选题，产出5个角度方案。用户纠正：避免宏大叙事，聚焦具体可操作的切入点。', corrections: ['聚焦具体切入点', '避免宏大叙事'], day: day(2) },
      { summary: '审核本周选题日历，用户要求降低娱乐化内容比例，强化深度分析占比至60%。', corrections: ['深度分析 > 娱乐化', '调整内容配比'], day: day(5) },
      { summary: '从竞品监测数据中提炼3个差异化选题方向，用户偏好数据驱动型论证。', corrections: ['数据驱动论证'], day: day(8) },
    ],
    '客户研究助理': [
      { summary: '研究某消费品客户，输出一页纸画像。用户纠正：组织架构图中漏掉了新成立的数字化部门。', corrections: ['注意最新组织变动', '补充数字化部门'], day: day(1) },
      { summary: '分析金融客户行业趋势，用户要求增加监管政策变化对业务影响的分析维度。', corrections: ['增加监管政策维度'], day: day(4) },
      { summary: '准备客户A的跟进策略，用户强调优先关注对方刚完成的B轮融资带来的需求变化。', corrections: ['关注融资后需求变化'], day: day(7) },
    ],
    '交付写手': [
      { summary: '撰写项目复盘报告，用户反馈：执行摘要太啰嗦，要求控制在300字以内且必须有可量化的结论。', corrections: ['摘要 ≤ 300字', '量化结论必须出现'], day: day(3) },
      { summary: '输出方案建议书，用户纠正：每个建议后补充风险评估和应对预案。', corrections: ['补充风险评估', '增加应对预案'], day: day(6) },
      { summary: '准备投资人演示文稿，用户要求将技术细节移到附录，正文聚焦商业价值和市场数据。', corrections: ['技术细节 → 附录', '正文聚焦商业价值'], day: day(9) },
    ],
  };

  return (templates[emp.name] || [
    { summary: '执行日常工作任务，用户给出了输出格式偏好的反馈。', corrections: ['格式偏好调整'], day: day(1) },
    { summary: '处理项目相关分析，用户纠正了对行业术语的使用方式。', corrections: ['术语使用规范'], day: day(5) },
  ]);
}

// Ensure sessions exist
(function ensureSessions() {
  let changed = false;
  const updated = employees.map((e) => {
    if (!e.sessions || e.sessions.length === 0) {
      changed = true;
      return { ...e, sessions: generateSessions(e) };
    }
    return e;
  });
  if (changed) { employees = updated; s.set('chawork_employees', employees); }
})();

// ---------- MODAL HELPERS ----------
function openModal(id) { document.getElementById(id).classList.add('modal--open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('modal--open'); document.body.style.overflow = ''; }
function resetForm(id) {
  const form = document.getElementById(id);
  form.reset();
  form.querySelectorAll('input[type="hidden"]').forEach((e) => (e.value = ''));
}

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => closeModal(el.dataset.close));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal--open').forEach((m) => closeModal(m.id));
    closeEmpDetail();
  }
});

// ---------- RENDER: SKILLS ----------
function renderSkillCards(filter = '') {
  const grid = document.getElementById('skillGrid');
  const empty = document.getElementById('skillEmpty');
  const q = filter.toLowerCase();
  const filtered = skills.filter((s) => {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || (s.tags || []).some((t) => t.toLowerCase().includes(q));
  });
  if (!filtered.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = filtered.map((s) => `
    <div class="skill-card" data-id="${s.id}">
      <div class="skill-card__header">
        <span class="skill-card__emoji">${s.emoji || '📦'}</span>
        <div class="skill-card__actions">
          <button title="编辑" data-edit-skill="${s.id}">&#9998;</button>
          <button title="删除" class="skill-card__del" data-del-skill="${s.id}">&#10005;</button>
        </div>
      </div>
      <div class="skill-card__name">${esc(s.name)}</div>
      <div class="skill-card__desc">${esc(s.desc)}</div>
      <div class="skill-card__tags">${(s.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    </div>`).join('');
  addCardGlow(grid);
}

// ---------- RENDER: EMPLOYEES ----------
function renderEmployeeCards(filter = '') {
  const grid = document.getElementById('employeeGrid');
  const empty = document.getElementById('employeeEmpty');
  const q = filter.toLowerCase();
  const filtered = employees.filter((e) => {
    if (!q) return true;
    return e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.prompt.toLowerCase().includes(q)
      || e.skillIds.some((sid) => { const sk = skills.find((s) => s.id === sid); return sk && (sk.name.toLowerCase().includes(q) || sk.desc.toLowerCase().includes(q)); });
  });
  if (!filtered.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = filtered.map((e) => {
    const empSkills = (e.skillIds || []).map((sid) => skills.find((s) => s.id === sid)).filter(Boolean);
    return `
    <div class="employee-card" data-id="${e.id}">
      <div class="employee-card__header">
        <div class="employee-card__info">
          <span class="employee-card__emoji">${e.emoji || '👤'}</span>
          <div>
            <div class="employee-card__name">${esc(e.name)}</div>
            <div class="employee-card__role">${esc(e.role)}</div>
          </div>
        </div>
        <div class="employee-card__actions">
          <button title="查看详情" data-view-employee="${e.id}">&#128269;</button>
          <button title="编辑" data-edit-employee="${e.id}">&#9998;</button>
          <button title="删除" class="employee-card__del" data-del-employee="${e.id}">&#10005;</button>
        </div>
      </div>
      <div class="employee-card__prompt">${esc(e.prompt || '')}</div>
      <div class="employee-card__skills">
        ${empSkills.length ? empSkills.map((s) => `<span>${esc(s.emoji || '')} ${esc(s.name)}</span>`).join('') : '<span class="employee-card__skill-empty">未绑定技能</span>'}
      </div>
    </div>`;
  }).join('');
  addCardGlow(grid);
}

// ---------- RENDER: WORKSPACES ----------
function renderWorkspaceCards(filter = '') {
  const grid = document.getElementById('workspaceGrid');
  const empty = document.getElementById('workspaceEmpty');
  const select = document.getElementById('workspaceEmployee');
  const q = filter.toLowerCase();
  const filtered = workspaces.filter((w) => {
    if (!q) return true;
    const emp = employees.find((e) => e.id === w.employeeId);
    return w.name.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q) || (emp && emp.name.toLowerCase().includes(q));
  });
  if (!filtered.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  // Update employee select options
  if (select) {
    select.innerHTML = '<option value="">-- 暂不绑定 --</option>' + employees.map((e) => `<option value="${e.id}">${esc(e.emoji || '')} ${esc(e.name)}</option>`).join('');
  }

  grid.innerHTML = filtered.map((w) => {
    const emp = employees.find((e) => e.id === w.employeeId);
    return `
    <div class="ws-card" data-id="${w.id}">
      <div class="ws-card__header">
        <span class="ws-card__icon">📁</span>
        <div class="ws-card__actions">
          <button title="编辑" data-edit-ws="${w.id}">&#9998;</button>
          <button title="删除" class="ws-card__del" data-del-ws="${w.id}">&#10005;</button>
        </div>
      </div>
      <div class="ws-card__name">${esc(w.name)}</div>
      <div class="ws-card__desc">${esc(w.desc || '')}</div>
      <div class="ws-card__meta">
        ${emp ? `<span class="ws-card__employee">${esc(emp.emoji || '')} ${esc(emp.name)}</span>` : '<span class="ws-card__unbound">未绑定员工</span>'}
        <div class="ws-card__files">
          <span>📄 资料</span><span>📝 笔记</span><span>💬 对话</span>
        </div>
      </div>
    </div>`;
  }).join('');
  addCardGlow(grid);
}

function addCardGlow(grid) {
  grid.querySelectorAll('.skill-card, .employee-card, .ws-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

// ---------- SKILL CRUD ----------
function openSkillModal(skill = null) {
  resetForm('skillForm');
  document.getElementById('skillModalTitle').textContent = skill ? '编辑技能' : '创建技能';
  document.getElementById('skillSubmit').textContent = skill ? '保存' : '创建';
  if (skill) {
    document.getElementById('skillId').value = skill.id;
    document.getElementById('skillName').value = skill.name;
    document.getElementById('skillDesc').value = skill.desc;
    document.getElementById('skillTags').value = (skill.tags || []).join(', ');
    document.getElementById('skillEmoji').value = skill.emoji || '';
  }
  openModal('skillModal');
}

document.getElementById('skillForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('skillId').value;
  const name = document.getElementById('skillName').value.trim();
  const desc = document.getElementById('skillDesc').value.trim();
  const tags = document.getElementById('skillTags').value.split(',').map((t) => t.trim()).filter(Boolean);
  const emoji = document.getElementById('skillEmoji').value.trim() || '📦';
  if (!name || !desc) return;
  if (id) { skills = skills.map((s) => (s.id === id ? { ...s, name, desc, tags, emoji } : s)); }
  else { skills.push({ id: uid(), name, desc, tags, emoji }); }
  s.set('chawork_skills', skills);
  closeModal('skillModal');
  renderAll();
});

// ---------- EMPLOYEE CRUD ----------
function openEmployeeModal(employee = null) {
  resetForm('employeeForm');
  document.getElementById('employeeModalTitle').textContent = employee ? '编辑员工' : '创建员工';
  document.getElementById('employeeSubmit').textContent = employee ? '保存' : '创建';
  renderSkillPicker(employee ? employee.skillIds || [] : []);
  if (employee) {
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeeRole').value = employee.role;
    document.getElementById('employeePrompt').value = employee.prompt || '';
    document.getElementById('employeeEmoji').value = employee.emoji || '';
  }
  openModal('employeeModal');
}

let selectedSkillIds = [];
function renderSkillPicker(preSelected = []) {
  selectedSkillIds = [...preSelected];
  const container = document.getElementById('skillPicker');
  if (!skills.length) { container.innerHTML = '<span class="field__skill-picker--empty">还没有技能，请先去技能市场创建。</span>'; return; }
  container.innerHTML = skills.map((s) => {
    const sel = selectedSkillIds.includes(s.id);
    return `<button type="button" class="skill-picker__chip${sel ? ' skill-picker__chip--selected' : ''}" data-sid="${s.id}">${s.emoji || '📦'} ${esc(s.name)}</button>`;
  }).join('');
  container.querySelectorAll('.skill-picker__chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sid = chip.dataset.sid;
      selectedSkillIds = selectedSkillIds.includes(sid) ? selectedSkillIds.filter((id) => id !== sid) : [...selectedSkillIds, sid];
      renderSkillPicker(selectedSkillIds);
    });
  });
}

document.getElementById('employeeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('employeeId').value;
  const name = document.getElementById('employeeName').value.trim();
  const role = document.getElementById('employeeRole').value.trim();
  const prompt = document.getElementById('employeePrompt').value.trim();
  const emoji = document.getElementById('employeeEmoji').value.trim() || '👤';
  if (!name || !role || !prompt) return;
  if (id) {
    employees = employees.map((emp) =>
      emp.id === id ? { ...emp, name, role, prompt, skillIds: [...selectedSkillIds], emoji } : emp
    );
  } else {
    employees.push({ id: uid(), name, role, prompt, skillIds: [...selectedSkillIds], emoji, dreamResults: [], sessions: generateSessions({ name }) });
  }
  s.set('chawork_employees', employees);
  closeModal('employeeModal');
  renderAll();
  if (currentEmpId) openEmpDetail(employees.find((e) => e.id === currentEmpId));
});

// ---------- WORKSPACE CRUD ----------
function openWorkspaceModal(ws = null) {
  resetForm('workspaceForm');
  document.getElementById('workspaceModalTitle').textContent = ws ? '编辑工作区' : '创建工作区';
  document.getElementById('workspaceSubmit').textContent = ws ? '保存' : '创建';
  // Populate employee select
  const select = document.getElementById('workspaceEmployee');
  select.innerHTML = '<option value="">-- 暂不绑定 --</option>' + employees.map((e) => `<option value="${e.id}">${esc(e.emoji || '')} ${esc(e.name)}</option>`).join('');
  if (ws) {
    document.getElementById('workspaceId').value = ws.id;
    document.getElementById('workspaceName').value = ws.name;
    document.getElementById('workspaceDesc').value = ws.desc || '';
    select.value = ws.employeeId || '';
  }
  openModal('workspaceModal');
}

document.getElementById('workspaceForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('workspaceId').value;
  const name = document.getElementById('workspaceName').value.trim();
  const desc = document.getElementById('workspaceDesc').value.trim();
  const employeeId = document.getElementById('workspaceEmployee').value;
  if (!name) return;
  if (id) {
    workspaces = workspaces.map((w) => (w.id === id ? { ...w, name, desc, employeeId } : w));
  } else {
    workspaces.push({ id: uid(), name, desc, employeeId, createdAt: new Date().toISOString().slice(0, 10) });
  }
  s.set('chawork_workspaces', workspaces);
  closeModal('workspaceModal');
  renderAll();
  if (currentEmpId) openEmpDetail(employees.find((e) => e.id === currentEmpId));
});

// ---------- DELETE ----------
function confirmDelete(type, id) {
  pendingDelete = { type, id };
  const msgs = {
    skill: '确定要删除这个技能吗？已绑定此技能的员工将失去该技能。',
    employee: '确定要删除这个员工吗？其长期 prompt、Dream 记录和绑定关系将永久丢失。',
    workspace: '确定要删除这个工作区吗？项目资料索引将被移除。',
  };
  document.getElementById('deleteMessage').textContent = msgs[type] || '';
  openModal('deleteModal');
}

document.getElementById('deleteConfirm').addEventListener('click', () => {
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  if (type === 'skill') {
    skills = skills.filter((s) => s.id !== id);
    employees = employees.map((e) => ({ ...e, skillIds: (e.skillIds || []).filter((sid) => sid !== id) }));
    s.set('chawork_skills', skills);
    s.set('chawork_employees', employees);
  } else if (type === 'employee') {
    employees = employees.filter((e) => e.id !== id);
    workspaces = workspaces.map((w) => (w.employeeId === id ? { ...w, employeeId: '' } : w));
    s.set('chawork_employees', employees);
    s.set('chawork_workspaces', workspaces);
  } else if (type === 'workspace') {
    workspaces = workspaces.filter((w) => w.id !== id);
    s.set('chawork_workspaces', workspaces);
  }
  pendingDelete = null;
  closeModal('deleteModal');
  closeEmpDetail();
  renderAll();
});

// ---------- EVENT DELEGATION ----------
document.addEventListener('click', (e) => {
  // Skill
  if (e.target.closest('#addSkillBtn')) { openSkillModal(); return; }
  const es = e.target.closest('[data-edit-skill]');
  if (es) { const s = skills.find((x) => x.id === es.dataset.editSkill); if (s) openSkillModal(s); return; }
  const ds = e.target.closest('[data-del-skill]');
  if (ds) { confirmDelete('skill', ds.dataset.delSkill); return; }

  // Employee
  if (e.target.closest('#addEmployeeBtn')) { openEmployeeModal(); return; }
  const ee = e.target.closest('[data-edit-employee]');
  if (ee) { const emp = employees.find((x) => x.id === ee.dataset.editEmployee); if (emp) openEmployeeModal(emp); return; }
  const de = e.target.closest('[data-del-employee]');
  if (de) { confirmDelete('employee', de.dataset.delEmployee); return; }
  const ve = e.target.closest('[data-view-employee]');
  if (ve) { const emp = employees.find((x) => x.id === ve.dataset.viewEmployee); if (emp) openEmpDetail(emp); return; }

  // Workspace
  if (e.target.closest('#addWorkspaceBtn')) { openWorkspaceModal(); return; }
  const ew = e.target.closest('[data-edit-ws]');
  if (ew) { const w = workspaces.find((x) => x.id === ew.dataset.editWs); if (w) openWorkspaceModal(w); return; }
  const dw = e.target.closest('[data-del-ws]');
  if (dw) { confirmDelete('workspace', dw.dataset.delWs); return; }
});

// ---------- SEARCH ----------
['skillSearch', 'employeeSearch', 'workspaceSearch'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', (e) => renderAll(e.target.value));
});

// ---------- RENDER ALL ----------
function renderAll(filter = '') {
  renderSkillCards(document.getElementById('skillSearch')?.value || '');
  renderEmployeeCards(document.getElementById('employeeSearch')?.value || '');
  renderWorkspaceCards(document.getElementById('workspaceSearch')?.value || '');
}

// ================================================================
// EMPLOYEE DETAIL PANEL
// ================================================================
let currentEmpId = null;

function openEmpDetail(emp) {
  if (!emp) return;
  currentEmpId = emp.id;
  const panel = document.getElementById('empDetail');
  document.getElementById('empDetailEmoji').textContent = emp.emoji || '👤';
  document.getElementById('empDetailName').textContent = emp.name;
  document.getElementById('empDetailRole').textContent = emp.role;
  document.getElementById('empDetailPrompt').textContent = emp.prompt || '';
  document.getElementById('empDetailPrompt').classList.remove('emp-detail__prompt--updated');

  // Skills
  const empSkills = (emp.skillIds || []).map((sid) => skills.find((s) => s.id === sid)).filter(Boolean);
  document.getElementById('empDetailSkills').innerHTML = empSkills.length
    ? empSkills.map((s) => `<span>${esc(s.emoji || '')} ${esc(s.name)}</span>`).join('')
    : '<span style="color:var(--text-dim);font-size:0.85rem;font-style:italic;">未绑定技能</span>';

  // Workspaces
  const empWs = workspaces.filter((w) => w.employeeId === emp.id);
  const wsContainer = document.getElementById('empDetailWorkspaces');
  if (empWs.length) {
    wsContainer.innerHTML = `<div class="emp-detail__ws-list">${empWs.map((w) => `
      <div class="emp-detail__ws-item">
        <div>
          <div class="emp-detail__ws-item-name">📁 ${esc(w.name)}</div>
          <div class="emp-detail__ws-item-desc">${esc(w.desc || '')}</div>
        </div>
        <span style="font-family:var(--mono);font-size:0.65rem;color:var(--text-dim);">${w.createdAt || ''}</span>
      </div>`).join('')}</div>`;
  } else {
    wsContainer.innerHTML = '<div class="emp-detail__ws-empty">暂无绑定工作区。去工作区页面创建并绑定此员工。</div>';
  }

  // Sessions
  const sessions = emp.sessions || [];
  document.getElementById('empDetailSessions').innerHTML = `<div class="session-list">${sessions.map((s) => `
    <div class="session-item">
      <div class="session-item__head">
        <span class="session-item__date">${s.day}</span>
        <span class="session-item__count">${(s.corrections || []).length} 条纠正</span>
      </div>
      <div class="session-item__summary">${esc(s.summary)}</div>
      <div class="session-item__corrections">${(s.corrections || []).map((c) => `<span>${esc(c)}</span>`).join('')}</div>
    </div>`).join('')}</div>`;

  // Dream
  renderDreamPanel(emp);

  // Reset to first tab
  document.querySelectorAll('.emp-detail__tab').forEach((t) => t.classList.remove('emp-detail__tab--active'));
  document.querySelector('.emp-detail__tab[data-tab="prompt"]')?.classList.add('emp-detail__tab--active');
  document.querySelectorAll('.emp-detail__tab-content').forEach((c) => c.classList.remove('emp-detail__tab-content--active'));
  document.getElementById('tab-prompt')?.classList.add('emp-detail__tab-content--active');

  panel.classList.add('emp-detail--open');
  document.body.style.overflow = 'hidden';
}

function closeEmpDetail() {
  currentEmpId = null;
  document.getElementById('empDetail').classList.remove('emp-detail--open');
  document.body.style.overflow = '';
}

document.getElementById('empDetailBackdrop').addEventListener('click', closeEmpDetail);
document.getElementById('empDetailClose').addEventListener('click', closeEmpDetail);

// Tab switching
document.querySelectorAll('.emp-detail__tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.emp-detail__tab').forEach((t) => t.classList.remove('emp-detail__tab--active'));
    document.querySelectorAll('.emp-detail__tab-content').forEach((c) => c.classList.remove('emp-detail__tab-content--active'));
    tab.classList.add('emp-detail__tab--active');
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('emp-detail__tab-content--active');
  });
});

// ================================================================
// DREAM SIMULATION
// ================================================================
function renderDreamPanel(emp) {
  const panel = document.getElementById('dreamPanel');
  const results = emp.dreamResults || [];
  const sessions = emp.sessions || [];

  // Status area
  const hasRecentSessions = sessions.length > 0;
  const lastResult = results[results.length - 1];

  let html = '';

  // Current status
  if (hasRecentSessions) {
    html += `<div class="dream-panel__status dream-panel__status--idle">
      <span class="dream-panel__status-icon">🌙</span>
      <span class="dream-panel__status-text">${sessions.length} 条会话痕迹可供分析。Dream 将读取这些痕迹，判断是否出现了值得固化的新规则。</span>
    </div>`;
    html += `<div class="dream-panel__actions">
      <button class="btn btn--primary btn--sm" id="runDreamBtn">运行 Dream 分析</button>
    </div>`;
  } else {
    html += `<div class="dream-panel__status dream-panel__status--idle">
      <span class="dream-panel__status-icon">😴</span>
      <span class="dream-panel__status-text">暂无足够的会话痕迹。完成几次工作后，Dream 可以开始学习。</span>
    </div>`;
  }

  // History
  if (results.length > 0) {
    html += `<div class="dream-panel__history">
      <div class="dream-panel__history-title">Dream 历史记录</div>
      ${results.slice().reverse().map((r) => `
        <div class="dream-panel__history-item">
          <span class="dream-panel__history-icon">${r.type === 'no_update' ? '⏭️' : '✅'}</span>
          <span>${r.summary}</span>
          <span class="dream-panel__history-date">${r.date}</span>
        </div>`).join('')}
    </div>`;
  }

  panel.innerHTML = html;

  // Bind Dream run button
  const runBtn = document.getElementById('runDreamBtn');
  if (runBtn) {
    runBtn.addEventListener('click', () => runDream(emp));
  }
}

function runDream(emp) {
  const panel = document.getElementById('dreamPanel');
  const sessions = emp.sessions || [];

  // Show running state
  panel.innerHTML = `
    <div class="dream-panel__status dream-panel__status--running">
      <span class="dream-panel__status-icon">🔄</span>
      <span class="dream-panel__status-text">Dream 正在分析最近的 ${sessions.length} 条工作痕迹...</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:12px 20px;color:var(--text-dim);font-family:var(--mono);font-size:0.72rem;">
      <span>.</span><span style="animation-delay:0.2s">.</span><span style="animation-delay:0.4s">.</span>
      <span>读取 sessions → 识别重复模式 → 判断是否固化</span>
    </div>`;

  // Simulate analysis delay
  setTimeout(() => {
    // Check if sessions contain patterns worth updating
    const corrections = sessions.flatMap((s) => s.corrections || []);
    const hasPattern = corrections.length >= 3;

    if (!hasPattern) {
      // no_update
      const result = { type: 'no_update', summary: '未发现稳定信号，无需更新长期 prompt。', date: new Date().toISOString().slice(0, 10) };
      emp.dreamResults = [...(emp.dreamResults || []), result];
      employees = employees.map((e) => (e.id === emp.id ? emp : e));
      s.set('chawork_employees', employees);
      renderDreamPanel(emp);
      return;
    }

    // update_required — generate proposed changes
    const topCorrections = [...new Set(corrections)].slice(0, 3);
    const proposedAddition = `\n\n## Dream 建议新增（${new Date().toISOString().slice(0, 10)}）\n基于最近 ${sessions.length} 次工作痕迹分析，建议在 prompt 中补充以下规则：\n${topCorrections.map((c, i) => `${i + 1}. **${c}** — 来自用户多次纠正模式`).join('\n')}`;

    panel.innerHTML = `
      <div class="dream-panel__status dream-panel__status--update">
        <span class="dream-panel__status-icon">💡</span>
        <span class="dream-panel__status-text">
          <strong>发现可固化的规律</strong><br />
          从 ${sessions.length} 条会话中识别到 <strong>${topCorrections.length}</strong> 个重复出现的纠正模式，建议更新长期 prompt。
        </span>
      </div>
      <div class="dream-panel__diff">
        <div class="dream-panel__diff-title">建议追加到 Prompt 末尾：</div>
        <div class="dream-panel__diff-block">
<span class="dream-panel__diff-keep"># 现有 prompt 保持不变...</span>

<span class="dream-panel__diff-add">${proposedAddition}</span>
        </div>
      </div>
      <div class="dream-panel__actions">
        <button class="btn btn--primary btn--sm" id="approveDreamBtn" data-addition="${escAttr(proposedAddition)}">✅ 批准更新</button>
        <button class="btn btn--ghost btn--sm" id="rejectDreamBtn">⏭️ 跳过（本次不更新）</button>
      </div>`;

    // Bind approve/reject
    document.getElementById('approveDreamBtn')?.addEventListener('click', () => approveDream(emp, proposedAddition));
    document.getElementById('rejectDreamBtn')?.addEventListener('click', () => rejectDream(emp));
  }, 2200);
}

function escAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function approveDream(emp, addition) {
  // Update prompt
  emp.prompt = (emp.prompt || '') + addition;
  emp.dreamResults = [...(emp.dreamResults || []), {
    type: 'update_required',
    summary: `批准更新：追加 ${addition.split('\n').filter((l) => l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.')).length} 条规则`,
    date: new Date().toISOString().slice(0, 10),
  }];
  employees = employees.map((e) => (e.id === emp.id ? emp : e));
  s.set('chawork_employees', employees);

  // Update the detail panel
  document.getElementById('empDetailPrompt').textContent = emp.prompt;
  document.getElementById('empDetailPrompt').classList.remove('emp-detail__prompt--updated');
  void document.getElementById('empDetailPrompt').offsetWidth;
  document.getElementById('empDetailPrompt').classList.add('emp-detail__prompt--updated');

  renderDreamPanel(emp);
  renderEmployeeCards(document.getElementById('employeeSearch')?.value || '');
}

function rejectDream(emp) {
  emp.dreamResults = [...(emp.dreamResults || []), {
    type: 'no_update',
    summary: '用户选择跳过本次更新，方法保持不变。',
    date: new Date().toISOString().slice(0, 10),
  }];
  employees = employees.map((e) => (e.id === emp.id ? emp : e));
  s.set('chawork_employees', employees);
  renderDreamPanel(emp);
}

// ---------- NAV SCROLL ----------
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('nav--scrolled', window.scrollY > 40), { passive: true });
nav.classList.toggle('nav--scrolled', window.scrollY > 40);

// ---------- MOBILE MENU ----------
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;
menuToggle.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle('mobile-menu--open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});
mobileMenu.querySelectorAll('.mobile-menu__link').forEach((link) => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.classList.remove('mobile-menu--open');
    document.body.style.overflow = '';
  });
});

// ---------- SCROLL REVEAL ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

// ---------- PARTICLE BACKGROUND ----------
const canvas = document.getElementById('particleCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [], animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize);
  resize();
  const createParticles = () => {
    const count = Math.floor((canvas.width * canvas.height) / 16000);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.2 + 0.3, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, alpha: Math.random() * 0.5 + 0.1 });
    }
  };
  createParticles();
  window.addEventListener('resize', createParticles);
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,158,11,${p.alpha})`; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245,158,11,${0.04 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(draw);
  };
  draw();
}

// ---------- SMOOTH SCROLL ----------
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ---------- INITIAL RENDER ----------
renderAll();
