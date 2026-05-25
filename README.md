# chawork-skills

面向职业工作流的 Skill 供应链中台。

主链路：**聚合 → 翻译 → 职业分类 → 导出 → 一键安装**。

- **聚合**：从多个 git 仓库同步 Claude Code Skill（首期：[anthropics/skills](https://github.com/anthropics/skills)）。
- **翻译**：把英文 SKILL.md 翻成简体中文，frontmatter / 代码块 / 路径 / 命令保持原样。
- **分类**：按固定职业白名单（34 项）归类，结果稳定可复核。
- **导出**：写 `dist/professions/<职业>/skills/<id>/`（中文 + 英文原版 + meta），生成 `dist/professions.json` 索引。
- **一键安装**：按职业挑选 skill，安装到下游 ChaWork 桌面应用的 root skills 目录。

设计文档：[desnin.md](./desnin.md)。

## 快速开始

```bash
pnpm install

# 配置上游
$EDITOR config/sources.yaml

# 同步 → 扫描 → 翻译 → 分类 → 导出（一键）
pnpm dev run --limit 5     # MVP 先翻译 5 个看效果

# 或者分步跑
pnpm dev sync
pnpm dev scan
pnpm dev translate --limit 2
pnpm dev classify --limit 2
pnpm dev export
pnpm dev status

# 安装到本机 ChaWork（按职业挑选）
pnpm dev install --list-professions
pnpm dev install --profession="开发工程师,AI 工程师"
# 自定义 root（默认 ~/Library/Application Support/com.chawork.app/root）
pnpm dev install --profession="开发工程师" --chawork-root=/tmp/test-chawork
```

## 翻译通道

`config/sources.yaml` 中 `llm.provider` 切换：

- `claude-cli`：复用本机 `claude` CLI 登录态（默认；本地开发推荐）。小型 skill（&lt; 2KB）单条约 15-20 秒；超过 ~20KB 的大 skill 在 `-p` 模式下可能严重变慢甚至挂起，建议大批量时切到 `openai`。
- `openai`：调用任意 OpenAI 兼容 `/v1/chat/completions`，环境变量 `OPENAI_API_KEY`（CI / 服务化推荐）。

可在不改配置文件的情况下临时切换通道：

```bash
# 单次 sed 改下 provider，跑完再 git checkout 还原
sed -i.bak 's/provider: claude-cli/provider: openai/' config/sources.yaml
OPENAI_API_KEY=sk-xxx pnpm dev run
```

## 数据布局

```
config/
  sources.yaml             # 上游来源 + LLM 通道配置
data/                      # 运行时数据，gitignore
  sources/<name>/          # 各上游仓库的本地 clone
  translated/<id>/         # 翻译后的 SKILL.md + SKILL.original.md（导出来源）
  overrides/<id>.yaml      # 人工修正（profession / translation_locked）
  state.json               # 全量状态（每个 skill 的 hash / 职业 / 状态）
dist/                      # 归档产物，commit 回仓
  professions.json         # 总索引（给下游消费）
  professions/<职业>/
    pack.json
    skills/<id>/
      SKILL.md             # 中文翻译
      SKILL.original.md    # 英文原文
      skill.meta.json      # 来源 / hash / 职业等元数据
```

## 人工修正

为某个 skill 锁定职业或冻结译文，建文件 `data/overrides/<skill_id>.yaml`：

```yaml
profession: 数据分析师       # 锁死职业，不会被自动重分类覆盖
translation_locked: true   # 跳过自动翻译
notes: 这个 skill 既用于 AI 工程也用于数据分析，按业务优先级归到数据分析
```

## 与 ChaWork 集成

下游 ChaWork（[../chawork](../chawork)）按目录扫描 root skills，每个 skill 是一个含 `SKILL.md` 的子目录。本工具的 `install` 命令把翻译后的 skill 拷贝到 `<chawork-root>/skills/<id>/`，**不改 ChaWork 代码**。

为了便于卸载与升级，本工具会在 `<chawork-root>/skills/_chawork_skills_manifest.json` 里记录由本工具安装过的 skill 列表（ChaWork 的 scan 因为该文件不是目录会自动忽略）。

## 定时同步

仓库内置 `.github/workflows/sync-and-translate.yml`：每天 UTC 18:00（北京时间 02:00）跑一次 `run`，把更新后的 `dist/` 提交回仓。也可在 Actions 页面 `workflow_dispatch` 手动触发。

CI 中默认使用 `openai` 通道，需要在仓库 secrets 配置：
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`（可选，默认 `https://api.openai.com/v1`）

## 命令参考

| 命令 | 说明 |
| --- | --- |
| `pnpm dev sync` | 同步所有配置的 git 仓库到 `data/sources/` |
| `pnpm dev scan` | 扫描 SKILL.md，更新 state.json（标记 new/changed/deleted） |
| `pnpm dev translate [--limit N] [--force] [--ids a,b]` | 增量翻译 |
| `pnpm dev classify [--limit N] [--force] [--ids a,b]` | 按白名单职业分类 |
| `pnpm dev export` | 写 `dist/professions/` 与 `dist/professions.json` |
| `pnpm dev run [--limit N] [--skip-sync]` | 一键跑完全部主链路 |
| `pnpm dev status` | 查看 skill 总数 / 各职业分布 / 失败列表 |
| `pnpm dev install --profession=<名> [--chawork-root=<路径>] [--force]` | 安装到 ChaWork |
| `pnpm dev install --list-professions` | 列可选职业 |

## 后续演进

见 `desnin.md §6`：多职业标签、人工审核后台、翻译质量评分、Skill 推荐排序等。
