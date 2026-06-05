# Skill Hub 服务端设计

## 1. 概述

将 chawork-skills 从 CLI 批处理工具升级为 **Skill Hub Web 服务**，对外提供技能和员工的管理、查询、下载能力，并支持从 GitHub 仓库批量导入技能。

### 职责边界

- **本项目负责**：技能/员工的存储、CRUD、GitHub 导入 pipeline、搜索索引、REST API、bundle 打包下载
- **不负责**：桌面端 UI、本地安装逻辑、工作区绑定 — 这些由 ChaWork 桌面端处理

### 与 ChaWork 桌面端的关系

```
ChaWork Desktop ──HTTP──▶ Skill Hub (本项目)
                              │
                              │ git clone/pull (按需)
                              ▼
                    GitHub 开源仓库
```

桌面端全程不直接访问 GitHub。终端用户可能存在网络限制，Hub 部署在服务器端负责拉取，桌面端只需能连到 Hub。

## 2. 数据模型

### 2.1 Skill（技能）

```ts
interface HubSkill {
  id: string                    // 唯一标识，如 "pdf"、"anthropics-skills--skills--pdf"
  name: string                  // 显示名称
  description_zh: string        // 中文描述
  description_en: string        // 英文描述
  profession: string            // 职业分类（35 个之一）
  content_hash: string          // SKILL.md 内容的 SHA256
  source: SkillSource           // 来源信息
  tags: string[]                // 标签
  created_at: string
  updated_at: string
}

type SkillSource =
  | { type: "github"; repo: string; path: string; commit?: string }
  | { type: "manual"; author?: string }
```

### 2.2 Employee（员工）

员工 = 技能组合 + 系统提示词，是一个可安装的"AI 角色模板"。

```ts
interface HubEmployee {
  id: string                    // 唯一标识，如 "frontend-dev"
  name: string                  // 显示名称
  description: string           // 简介
  kind: "ordinary" | "dream"    // 与 ChaWork 本地模型对齐
  prompt_preview: string        // 系统提示词前 200 字摘要（列表展示用）
  skill_ids: string[]           // 引用的技能 ID 列表
  skill_count: number
  tags: string[]
  source: EmployeeSource
  created_at: string
  updated_at: string
}

type EmployeeSource =
  | { type: "official" }                        // 官方预设
  | { type: "community"; author_id?: string }   // 社区用户创建（预留）
```

### 2.3 User（用户）— Phase 4 预留

```ts
interface HubUser {
  id: string
  name: string
  email: string
  avatar_url?: string
  credits: number
  created_at: string
}
```

### 2.4 实体关系

```
User (预留)
  │ 1:N
  ▼
Employee ──── N:M ───── Skill
  │                       │
  │ has prompt.md         │ has SKILL.md
  │ has skill_ids[]       │ has profession
  │                       │ source: github | manual
  │ source: official |
  │         community
```

## 3. 存储结构

```
data/
├── skills/
│   ├── {skill-id}/
│   │   ├── SKILL.md              # 翻译后（或手动创建的）技能内容
│   │   ├── SKILL.original.md     # 原始版本（GitHub 导入时保留）
│   │   └── skill.meta.json       # 元数据（HubSkill）
│   └── ...
├── employees/
│   ├── {employee-id}/
│   │   ├── employee.json         # 元数据（HubEmployee）
│   │   ├── prompt.md             # 完整系统提示词
│   │   └── skills.json           # 引用的技能 [{ id, enabled }]
│   └── ...
├── sources/                       # (existing) GitHub clone 目录
├── state.json                     # (existing) pipeline 状态追踪
└── ...

dist/                              # (existing) 兼容导出产物
```

Phase 1-3 使用文件系统存储（JSON/MD/YAML），与现有 pipeline 产物兼容。Phase 4 引入用户体系后迁移到 SQLite/PostgreSQL。

## 4. REST API 设计

**Base URL**: `http://{hub-host}:{port}/api/v1`

### 4.1 技能 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/skills` | 技能列表（?profession=&q=&page=&limit=） |
| `GET` | `/skills/:id` | 技能详情（含 SKILL.md 全文） |
| `POST` | `/skills` | 创建技能 |
| `PUT` | `/skills/:id` | 更新技能 |
| `DELETE` | `/skills/:id` | 删除技能 |
| `GET` | `/skills/:id/bundle` | 下载技能包（tar.gz） |
| `POST` | `/skills/import/github` | 从 GitHub 仓库批量导入 |

#### 创建技能 `POST /skills`

```json
{
  "id": "my-custom-skill",
  "name": "自定义技能",
  "description_zh": "...",
  "description_en": "...",
  "profession": "开发工程师",
  "skill_md": "---\nname: my-custom-skill\n---\n# 技能内容...",
  "tags": ["custom"]
}
```

响应：`201 Created`，返回完整的 `HubSkill` 对象。

#### 更新技能 `PUT /skills/:id`

```json
{
  "name": "新名称",
  "description_zh": "更新后的描述",
  "skill_md": "---\nname: ...\n---\n# 更新后的内容...",
  "tags": ["updated"]
}
```

仅传需要更新的字段，未传字段保持不变。更新后自动重新计算 `content_hash`。

#### 从 GitHub 导入 `POST /skills/import/github`

```json
{
  "url": "https://github.com/anthropics/skills",
  "ref": "main"
}
```

Hub 服务端执行完整 pipeline：git clone → scan → translate → classify → 入库。

响应（同步返回，pipeline 耗时 1-5 分钟）：

```json
{
  "source": "anthropics-skills",
  "imported": 16,
  "skills": [
    { "id": "anthropics-skills--skills--pdf", "name": "pdf", "profession": "通用技能" },
    ...
  ]
}
```

#### 技能列表 `GET /skills`

支持查询参数：
- `q` — 关键词搜索（name、description_zh、description_en 子串匹配）
- `profession` — 按职业分类过滤
- `page`、`limit` — 分页

响应：

```json
{
  "total": 16,
  "page": 1,
  "limit": 20,
  "items": [ { ...HubSkill }, ... ]
}
```

#### 技能详情 `GET /skills/:id`

```json
{
  "id": "anthropics-skills--skills--pdf",
  "name": "pdf",
  "profession": "通用技能",
  "description_zh": "...",
  "description_en": "...",
  "source": { "type": "github", "repo": "anthropics-skills", "path": "...", "commit": "..." },
  "content_hash": "...",
  "tags": [],
  "created_at": "...",
  "updated_at": "...",
  "skill_md": "---\nname: pdf\n---\n# 完整 SKILL.md 内容..."
}
```

#### 下载技能包 `GET /skills/:id/bundle`

响应：`Content-Type: application/gzip`

tar.gz 包含：
- `SKILL.md`
- `SKILL.original.md`（如有）
- `skill.meta.json`
- 其他辅助文件

### 4.2 员工 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/employees` | 员工列表（?q=&tags=&page=&limit=） |
| `GET` | `/employees/:id` | 员工详情（含完整 prompt + 技能列表） |
| `POST` | `/employees` | 创建员工 |
| `PUT` | `/employees/:id` | 更新员工 |
| `DELETE` | `/employees/:id` | 删除员工 |
| `GET` | `/employees/:id/bundle` | 下载员工包（tar.gz） |

#### 创建员工 `POST /employees`

```json
{
  "id": "frontend-dev",
  "name": "前端开发工程师",
  "description": "精通 React/Vue/TypeScript 的前端开发角色",
  "kind": "ordinary",
  "prompt_md": "你是一名资深前端开发工程师...",
  "skill_ids": ["web-artifacts-builder", "webapp-testing", "frontend-design"],
  "tags": ["开发", "前端"]
}
```

`skill_ids` 中引用的技能必须在 Hub 中已存在，否则返回 400 错误。

创建时自动生成 `prompt_preview`（截取 prompt_md 前 200 字）。

#### 更新员工 `PUT /employees/:id`

```json
{
  "name": "新名称",
  "prompt_md": "更新后的提示词...",
  "skill_ids": ["skill-a", "skill-b"]
}
```

#### 员工详情 `GET /employees/:id`

```json
{
  "id": "frontend-dev",
  "name": "前端开发工程师",
  "description": "精通 React/Vue/TypeScript 的前端开发角色",
  "kind": "ordinary",
  "prompt_md": "你是一名资深前端开发工程师...",
  "skills": [
    { "id": "web-artifacts-builder", "name": "web-artifacts-builder", "description_zh": "..." },
    { "id": "webapp-testing", "name": "webapp-testing", "description_zh": "..." }
  ],
  "tags": ["开发", "前端"],
  "source": { "type": "official" },
  "created_at": "...",
  "updated_at": "..."
}
```

#### 下载员工包 `GET /employees/:id/bundle`

响应：`Content-Type: application/gzip`

tar.gz 包含：
```
employee.json          # 元数据
prompt.md              # 系统提示词
skills.json            # 技能引用列表
skills/                # 内联的技能文件（完整安装用）
  web-artifacts-builder/
    SKILL.md
  webapp-testing/
    SKILL.md
```

员工 bundle 内联技能文件，安装时不需要额外下载。

### 4.3 总览 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/manifest` | 市场总览 |
| `GET` | `/professions` | 职业列表 + 各职业下的技能/员工数 |
| `GET` | `/health` | 健康检查 |

#### Manifest `GET /manifest`

```json
{
  "generated_at": "...",
  "skills_count": 16,
  "employees_count": 5,
  "professions": [
    { "name": "开发工程师", "skill_count": 2, "employee_count": 1 },
    ...
  ],
  "sources": [
    { "name": "anthropics-skills", "url": "https://github.com/anthropics/skills", "skill_count": 16 }
  ]
}
```

#### Health `GET /health`

```json
{
  "status": "ok",
  "skills_count": 16,
  "employees_count": 5,
  "sources_count": 1
}
```

### 4.4 用户 API（Phase 4 预留）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/users/register` | 用户注册 |
| `POST` | `/users/login` | 登录（返回 token） |
| `GET` | `/users/me` | 当前用户信息 |
| `GET` | `/users/me/credits` | 积分余额 |
| `POST` | `/marketplace/publish` | 发布员工到市场 |
| `POST` | `/marketplace/purchase` | 购买/获取员工 |
| `GET` | `/marketplace/listings` | 市场上架列表 |

Phase 1-3 的 API 不带鉴权。Phase 4 通过中间件给需要的端点加 JWT 校验，Employee 增加 `source.author_id` 关联创建者。

## 5. 模块结构

### 5.1 新增模块

```
chawork-skills/
├── src/
│   ├── server/
│   │   ├── index.ts              # Hono app 入口，注册路由
│   │   ├── routes/
│   │   │   ├── skills.ts         # 技能 CRUD + 搜索 + 下载 + GitHub 导入
│   │   │   ├── employees.ts      # 员工 CRUD + 搜索 + 下载
│   │   │   ├── manifest.ts       # 总览 + 职业列表
│   │   │   └── health.ts         # 健康检查
│   │   └── search.ts             # 内存搜索索引（技能 + 员工）
│   ├── store/
│   │   ├── skills.ts             # 技能存储层（读写 data/skills/）
│   │   └── employees.ts          # 员工存储层（读写 data/employees/）
│   ├── pipeline/
│   │   └── runner.ts             # GitHub 导入 pipeline 封装
│   ├── cli.ts                    # 增加 serve 命令
│   └── ... (existing: sources/, discover/, translate/, classify/, export/)
```

### 5.2 各模块职责

**store/skills.ts** — 技能存储层
- `listSkills(filter?)` — 读取 data/skills/ 下所有技能
- `getSkill(id)` — 读取单个技能（meta + SKILL.md）
- `createSkill(input)` — 写入 data/skills/{id}/
- `updateSkill(id, input)` — 更新文件
- `deleteSkill(id)` — 删除目录
- `bundleSkill(id)` — 打包 tar.gz stream

**store/employees.ts** — 员工存储层
- `listEmployees(filter?)` — 读取 data/employees/ 下所有员工
- `getEmployee(id)` — 读取元数据 + prompt.md + 展开 skills 详情
- `createEmployee(input)` — 校验 skill_ids 存在 → 写入 data/employees/{id}/
- `updateEmployee(id, input)` — 更新文件
- `deleteEmployee(id)` — 删除目录
- `bundleEmployee(id)` — 打包 tar.gz（含内联技能文件）

**pipeline/runner.ts** — GitHub 导入封装
- `runImportPipeline(url, ref?)` — 封装现有 CLI 的 sync → scan → translate → classify → export 为单次调用
- 返回结构化 `PipelineResult`

**server/search.ts** — 内存搜索索引
- 启动时加载所有技能和员工到内存
- 在 name、description_zh、description_en、tags 上做子串匹配
- 每次 CRUD 操作或 pipeline 完成后自动重建

### 5.3 技术选型

| 模块 | 选型 | 理由 |
|------|------|------|
| HTTP 框架 | Hono | 轻量、TypeScript 原生、Node.js 兼容 |
| 存储 | 文件系统 | 与现有 pipeline 产物兼容，简单可调试 |
| 搜索 | 内存索引 | 数据规模小（百级），子串匹配足够 |
| 打包 | tar + gzip (Node.js stream) | bundle 下载 |

## 6. CLI 扩展

```bash
# 启动 Hub Web 服务
chawork-skills serve [--port 3100] [--host 0.0.0.0]

# 原有 pipeline 命令保持不变
chawork-skills run / sync / scan / translate / classify / export / status / install
```

`serve` 启动后：
1. 加载配置（`config/sources.yaml`）
2. 读取现有 `data/skills/` 和 `data/employees/`
3. 构建内存搜索索引
4. 启动 HTTP 服务器

### 配置扩展

在 `config/sources.yaml` 中新增 server 段：

```yaml
sources:
  - name: anthropics-skills
    type: git
    url: https://github.com/anthropics/skills
    ref: main
    skills_glob: "**/SKILL.md"

llm:
  provider: claude-cli

server:
  port: 3100
  host: "0.0.0.0"
  cors_origins: ["*"]
```

## 7. 实现计划

### Phase 1：核心 API

| 工作项 | 说明 |
|--------|------|
| `store/skills.ts` | 技能存储层 CRUD |
| `store/employees.ts` | 员工存储层 CRUD |
| `pipeline/runner.ts` | 将 CLI pipeline 封装为可编程调用 |
| `server/routes/skills.ts` | 技能 API（CRUD + GitHub 导入 + bundle 下载） |
| `server/routes/employees.ts` | 员工 API（CRUD + bundle 下载） |
| `server/routes/manifest.ts` | 总览 + 职业列表 |
| `server/routes/health.ts` | 健康检查 |
| `server/search.ts` | 内存搜索索引 |
| `server/index.ts` | Hono app 入口 |
| CLI `serve` 命令 | 启动 Web 服务 |
| 配置扩展 | sources.yaml 新增 server 段 |

### Phase 2（预留）：用户与积分

| 工作项 | 说明 |
|--------|------|
| 用户注册/登录 | JWT 鉴权中间件 |
| 积分系统 | 注册赠送 + 分享获取 + 交易消耗 |
| 员工发布/交易 | marketplace 端点 |
| 存储迁移 | 文件系统 → SQLite/PostgreSQL |

## 8. 设计决策

### Q1: `POST /skills/import/github` 同步还是异步？

**同步返回。** 典型仓库（~16 个 Skill）pipeline 耗时 1-5 分钟，HTTP 长连接可 hold。规模增大后可改为异步（返回 job ID + 轮询状态端点）。

### Q2: 员工 bundle 是否内联技能文件？

**是。** 牺牲一点包体积换取安装的原子性 — 客户端下载一个 bundle 即可完成员工安装，不需要额外请求。

### Q3: 存储选型？

**Phase 1 用文件系统。** 数据规模小（百级），文件系统简单可调试，与现有 pipeline 产物兼容。Phase 2 引入多用户后迁移到数据库。

### Q4: 搜索能力？

**内存子串匹配。** 数据规模小，启动时全量加载到内存，CRUD 操作后增量更新。不需要引入 Elasticsearch 等外部依赖。

### Q5: 职业分类 whitelist

沿用现有 35 个职业分类（`src/classify/professions.ts`），GitHub 导入的技能通过 LLM 自动分类，手动创建的技能由调用方指定。
