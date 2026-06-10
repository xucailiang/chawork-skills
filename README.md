# chawork-skills

面向职业工作流的 AI 技能供应链中台。聚合、翻译、分类 GitHub 上的 Claude Code Skill，通过 Web 市场浏览和搜索，最终一键安装到 ChaWork 桌面应用。

## 项目结构

```
chawork-skills/
├── src/                     # CLI 工具 + API 服务 (Hono)
│   ├── cli.ts               # 命令行入口
│   ├── server/              # Hub API (端口 3100)
│   │   └── routes/          # skills, employees, manifest, health
│   ├── sources/             # Git 仓库聚合
│   ├── translate/           # LLM 翻译
│   ├── classify/            # 职业分类
│   └── export/              # dist/ 产物导出
├── web/                     # Web 前端 (Next.js 16 + Tailwind v4)
│   ├── app/
│   │   ├── page.tsx         # 首页
│   │   ├── market/skills/   # 技能市场
│   │   ├── market/employees/# 员工市场
│   │   └── download/        # 桌面端下载
│   └── public/
│       ├── logo.png
│       └── downloads/       # dmg / exe 安装包
├── config/
│   └── sources.yaml         # 上游仓库 + LLM 配置
├── data/                    # 运行时数据 (gitignore)
│   ├── sources/             # 上游仓库 clone
│   ├── translated/          # 翻译产物
│   ├── skills/              # 技能归档
│   ├── employees/           # 员工归档
│   └── overrides/           # 人工修正
├── dist/                    # 导出产物 (commit 回仓)
│   ├── professions.json
│   └── professions/<职业>/skills/<id>/
├── docker-compose.yml       # Docker 部署
└── Dockerfile
```

## 快速开始

### 后端 API

```bash
pnpm install
pnpm dev:api         # 启动 API 服务 (localhost:3100)
```

### 前端 Web

```bash
cd web
pnpm install
API_INTERNAL_URL=http://localhost:3100 pnpm dev   # 前端 (localhost:3000)
```

### 数据管线

```bash
# 配置上游仓库
$EDITOR config/sources.yaml

# 全量跑通：同步 → 扫描 → 翻译 → 分类 → 导出
pnpm dev run --limit 5

# 分步执行
pnpm dev sync           # 克隆上游 git 仓库
pnpm dev scan           # 扫描 SKILL.md，更新 state.json
pnpm dev translate      # LLM 翻译英文技能为中文
pnpm dev classify       # 按职业白名单分类
pnpm dev export         # 导出到 dist/
pnpm dev status         # 查看技能和员工统计
```

### 安装到 ChaWork

```bash
pnpm dev install --list-professions
pnpm dev install --profession="开发工程师,AI 工程师"
```

## Docker 部署

```bash
docker compose up -d
```

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| hub-api | 8010 | API 服务 |
| hub-web | 8011 | Web 前端 |

安装包更新：将文件按以下命名放入 `web/public/downloads/`，然后 `docker compose restart hub-web`：

| 文件 | 平台 |
| --- | --- |
| `ChaWork.dmg` | macOS (Apple Silicon) |
| `ChaWork-Setup.exe` | Windows x64 |

## Web 前端页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：Hero + 实时统计 + 核心功能 |
| `/market/skills` | 技能市场：搜索、职业筛选、技能卡片 |
| `/market/skills/[id]` | 技能详情：元数据 + SKILL.md 渲染 |
| `/market/employees` | 员工市场：搜索、员工卡片 |
| `/market/employees/[id]` | 员工详情：系统提示词 + 绑定技能 |
| `/download` | 桌面端下载：macOS (Apple Silicon) / Windows |

## API 接口

Base: `http://localhost:3100/api/v1`

| 端点 | 说明 |
| --- | --- |
| `GET /manifest` | 技能 + 员工总数及职业分布 |
| `GET /skills?q=&profession=&page=&limit=` | 技能列表 |
| `GET /skills/:id` | 技能详情（含 SKILL.md 全文） |
| `GET /employees?q=&tags=&page=&limit=` | 员工列表 |
| `GET /employees/:id` | 员工详情（含 prompt 全文） |
| `GET /professions` | 职业列表 |
| `GET /health` | 健康检查 |

## LLM 通道

`config/sources.yaml` 中 `llm.provider` 切换：

- `claude-cli`：复用本机 `claude` CLI 登录态（默认）
- `openai`：调用 OpenAI 兼容 API，需设 `OPENAI_API_KEY`

## 人工修正

锁定某个 skill 的职业或冻结译文，创建 `data/overrides/<skill_id>.yaml`：

```yaml
profession: 数据分析师
translation_locked: true
notes: 按业务优先级归到数据分析
```
