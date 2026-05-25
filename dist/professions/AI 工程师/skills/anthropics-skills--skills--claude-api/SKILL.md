---
name: claude-api
description: >-
  构建、调试和优化 Claude API / Anthropic SDK 应用。基于此 skill 构建的应用应包含 prompt caching。同时处理在
  Claude 模型版本之间迁移已有 Claude API 代码（4.5 → 4.6、4.6 → 4.7、已下线模型替换）。触发条件：代码 import
  `anthropic`/`@anthropic-ai/sdk`；用户询问 Claude API、Anthropic SDK 或 Managed
  Agents；用户在文件中新增、修改或调优某个 Claude 功能（caching、thinking、compaction、tool
  use、batch、files、citations、memory）或模型（Opus/Sonnet/Haiku）；在 Anthropic SDK 项目中关于
  prompt caching / 缓存命中率的问题。跳过场景：文件 import `openai`/其他厂商 SDK、文件名形如
  `*-openai.py`/`*-generic.py`、与厂商无关的代码、通用编程/ML 问题。
license: Complete terms in LICENSE.txt
original_description: >-
  Build, debug, and optimize Claude API / Anthropic SDK apps. Apps built with
  this skill should include prompt caching. Also handles migrating existing
  Claude API code between Claude model versions (4.5 → 4.6, 4.6 → 4.7,
  retired-model replacements). TRIGGER when: code imports
  `anthropic`/`@anthropic-ai/sdk`; user asks for the Claude API, Anthropic SDK,
  or Managed Agents; user adds/modifies/tunes a Claude feature (caching,
  thinking, compaction, tool use, batch, files, citations, memory) or model
  (Opus/Sonnet/Haiku) in a file; questions about prompt caching / cache hit rate
  in an Anthropic SDK project. SKIP: file imports `openai`/other-provider SDK,
  filename like `*-openai.py`/`*-generic.py`, provider-neutral code, general
  programming/ML.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T11:53:58.603Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# 使用 Claude 构建 LLM 驱动的应用

本 Skill 帮助你使用 Claude 构建 LLM 驱动的应用。根据需求选择合适的接入层、识别项目语言，然后阅读相应的语言专属文档。

## 开始前

扫描目标文件（如果没有目标文件，则扫描提示词和项目），查找是否存在非 Anthropic 厂商的标记 —— `import openai`、`from openai`、`langchain_openai`、`OpenAI(`、`gpt-4`、`gpt-5`、像 `agent-openai.py` 或 `*-generic.py` 这样的文件名，或任何明确要求代码保持厂商中立的指令。如果发现任何一项，请停下来告知用户：本 Skill 生成的是 Claude/Anthropic SDK 代码；询问用户是希望把文件切换到 Claude，还是希望使用非 Claude 的实现。不要在非 Anthropic 文件中插入 Anthropic SDK 调用。

## 输出要求

当用户要求你新增、修改或实现一个 Claude 特性时，你的代码必须通过以下方式之一调用 Claude：

1. **项目所用语言的官方 Anthropic SDK**（`anthropic`、`@anthropic-ai/sdk`、`com.anthropic.*` 等）。只要该项目存在受支持的 SDK，这就是默认选项。
2. **原始 HTTP**（`curl`、`requests`、`fetch`、`httpx` 等）—— 仅当用户明确要求使用 cURL/REST/原始 HTTP、项目本身就是 shell/cURL 项目、或该语言没有官方 SDK 时才使用。

两者绝不混用 —— 不要仅因为感觉更轻量就在 Python 或 TypeScript 项目中改用 `requests`/`fetch`。也不要退化为 OpenAI 兼容垫片。

**绝不要靠猜来使用 SDK。** 函数名、类名、命名空间、方法签名、导入路径都必须来自明确的文档 —— 要么是本 Skill 中 `{lang}/` 目录下的文件，要么是 `shared/live-sources.md` 中列出的官方 SDK 仓库或文档链接。如果你需要的绑定在 Skill 文件中没有明确文档化，请在编写代码前先用 WebFetch 拉取 `shared/live-sources.md` 中相关的 SDK 仓库。不要从 cURL 的形态或其他语言的 SDK 推断 Ruby/Java/Go/PHP/C# 的 API。

## 默认值

除非用户另有要求：

Claude 模型版本请使用 Claude Opus 4.7，对应的模型字符串为 `claude-opus-4-7`。对任何稍微复杂一些的任务都请默认开启自适应思考（`thinking: {type: "adaptive"}`）。最后，对任何可能涉及长输入、长输出或较高 `max_tokens` 的请求都请默认使用流式 —— 这样可以避免请求超时。如果不需要处理单个流事件，使用 SDK 的 `.get_final_message()` / `.finalMessage()` 辅助方法获取完整响应即可。

---

## 子命令

如果本提示词底部的用户请求是一个不含其他描述的纯子命令字符串（没有自然语言），请在本文档的所有 **Subcommands** 表格（包括下文追加章节中的任意表格）中查找，并直接按匹配行 Action 列指引执行。这样用户就可以通过 `/claude-api <subcommand>` 调用特定流程。如果本文档中没有任何表格匹配，则按普通自然语言处理该请求。


---

## 语言识别

阅读代码示例前，先判断用户使用的是哪种语言：

1. **查看项目文件**推断语言：

   - `*.py`、`requirements.txt`、`pyproject.toml`、`setup.py`、`Pipfile` → **Python** —— 阅读 `python/`
   - `*.ts`、`*.tsx`、`package.json`、`tsconfig.json` → **TypeScript** —— 阅读 `typescript/`
   - `*.js`、`*.jsx`（项目中没有 `.ts` 文件） → **TypeScript** —— JS 使用同一套 SDK，阅读 `typescript/`
   - `*.java`、`pom.xml`、`build.gradle` → **Java** —— 阅读 `java/`
   - `*.kt`、`*.kts`、`build.gradle.kts` → **Java** —— Kotlin 使用 Java SDK，阅读 `java/`
   - `*.scala`、`build.sbt` → **Java** —— Scala 使用 Java SDK，阅读 `java/`
   - `*.go`、`go.mod` → **Go** —— 阅读 `go/`
   - `*.rb`、`Gemfile` → **Ruby** —— 阅读 `ruby/`
   - `*.cs`、`*.csproj` → **C#** —— 阅读 `csharp/`
   - `*.php`、`composer.json` → **PHP** —— 阅读 `php/`

2. **若检测到多种语言**（例如同时存在 Python 和 TypeScript 文件）：

   - 看看用户当前的文件或问题与哪种语言相关
   - 如果仍然模糊，请询问："I detected both Python and TypeScript files. Which language are you using for the Claude API integration?"

3. **如果无法推断语言**（空项目、没有源文件，或语言不受支持）：

   - 使用 AskUserQuestion，备选项为：Python、TypeScript、Java、Go、Ruby、cURL/raw HTTP、C#、PHP
   - 如果 AskUserQuestion 不可用，默认使用 Python 示例，并说明："Showing Python examples. Let me know if you need a different language."

4. **若检测到不受支持的语言**（Rust、Swift、C++、Elixir 等）：

   - 建议使用 `curl/` 中的 cURL/原始 HTTP 示例，并提示可能存在社区 SDK
   - 也可以提供 Python 或 TypeScript 示例作为参考实现

5. **若用户需要 cURL/原始 HTTP 示例**，请阅读 `curl/`。

### 各语言的特性支持情况

| Language   | Tool Runner | Managed Agents | Notes                                 |
| ---------- | ----------- | -------------- | ------------------------------------- |
| Python     | Yes (beta)  | Yes (beta)     | Full support — `@beta_tool` decorator |
| TypeScript | Yes (beta)  | Yes (beta)     | Full support — `betaZodTool` + Zod    |
| Java       | Yes (beta)  | Yes (beta)     | Beta tool use with annotated classes  |
| Go         | Yes (beta)  | Yes (beta)     | `BetaToolRunner` in `toolrunner` pkg  |
| Ruby       | Yes (beta)  | Yes (beta)     | `BaseTool` + `tool_runner` in beta    |
| C#         | No          | No             | Official SDK                          |
| PHP        | Yes (beta)  | Yes (beta)     | `BetaRunnableTool` + `toolRunner()`   |
| cURL       | N/A         | Yes (beta)     | Raw HTTP, no SDK features             |

> **Managed Agents 代码示例**：Python、TypeScript、Go、Ruby、PHP、Java 各自有专属的语言级 README（`{lang}/managed-agents/README.md`、`curl/managed-agents.md`）。请阅读你所用语言的 README，加上语言无关的 `shared/managed-agents-*.md` 概念文件。**Agent 是持久的 —— 创建一次后按 ID 引用即可。** 把 `agents.create` 返回的 agent ID 存起来，并在后续每次 `sessions.create` 时传入；不要在请求路径里调用 `agents.create`。Anthropic CLI 是从受版本控制的 YAML 创建 agent 和 environment 的一种便捷方式 —— 其 URL 见 `shared/live-sources.md`。如果你需要的绑定在 README 中没有展示，请从 `shared/live-sources.md` WebFetch 对应条目，而不是去猜。C# 目前不支持 Managed Agents，请使用 cURL 风格的原始 HTTP 请求调用 API。

---

## 我该使用哪种接入层？

> **从简入手。** 默认选择能满足需求的最简单层级。单次 API 调用和工作流可以覆盖绝大多数场景 —— 只有任务确实需要开放式、模型驱动的探索时，才考虑使用 agent。

| Use Case                                        | Tier            | Recommended Surface       | Why                                                          |
| ----------------------------------------------- | --------------- | ------------------------- | ------------------------------------------------------------ |
| Classification, summarization, extraction, Q&A  | Single LLM call | **Claude API**            | One request, one response                                    |
| Batch processing or embeddings                  | Single LLM call | **Claude API**            | Specialized endpoints                                        |
| Multi-step pipelines with code-controlled logic | Workflow        | **Claude API + tool use** | You orchestrate the loop                                     |
| Custom agent with your own tools                | Agent           | **Claude API + tool use** | Maximum flexibility                                          |
| Server-managed stateful agent with workspace    | Agent           | **Managed Agents**        | Anthropic runs the loop and hosts the tool-execution sandbox |
| Persisted, versioned agent configs              | Agent           | **Managed Agents**        | Agents are stored objects; sessions pin to a version         |
| Long-running multi-turn agent with file mounts  | Agent           | **Managed Agents**        | Per-session containers, SSE event stream, Skills + MCP       |

> **说明：** 当你希望让 Anthropic 同时托管 agent loop *以及* 工具执行所在的容器时（文件操作、bash、代码执行全部跑在按会话隔离的工作空间中），Managed Agents 是正确选择。如果你想自己托管算力或运行自定义的工具运行时，那 Claude API + tool use 更合适 —— 使用 tool runner 自动处理循环，或使用手动循环以获得更细的控制（审批门、自定义日志、按条件执行）。

> **第三方厂商（Amazon Bedrock、Google Vertex AI、Microsoft Foundry）：** Managed Agents 在 Bedrock、Vertex、Foundry 上**不可用**。如果你通过任何第三方厂商部署，请在所有场景下都使用 **Claude API + tool use** —— 包括那些原本推荐 Managed Agents 的场景。

### 决策树

```
What does your application need?

0. Are you deploying through Amazon Bedrock, Google Vertex AI, or Microsoft Foundry?
   └── Yes → Claude API (+ tool use for agents) — Managed Agents is 1P only.
   No → continue.

1. Single LLM call (classification, summarization, extraction, Q&A)
   └── Claude API — one request, one response

2. Do you want Anthropic to run the agent loop and host a per-session
   container where Claude executes tools (bash, file ops, code)?
   └── Yes → Managed Agents — server-managed sessions, persisted agent configs,
       SSE event stream, Skills + MCP, file mounts.
       Examples: "stateful coding agent with a workspace per task",
                 "long-running research agent that streams events to a UI",
                 "agent with persisted, versioned config used across many sessions"

3. Workflow (multi-step, code-orchestrated, with your own tools)
   └── Claude API with tool use — you control the loop

4. Open-ended agent (model decides its own trajectory, your own tools, you host the compute)
   └── Claude API agentic loop (maximum flexibility)
```

### 我应该构建 agent 吗？

在选择 agent 层级之前，请逐条核对以下四点：

- **复杂度** —— 任务是否多步、且难以提前完整规约？（例如"把这份设计文档变成一个 PR" vs "从这份 PDF 中抽取标题"）
- **价值** —— 结果是否值得更高的成本与延迟？
- **可行性** —— Claude 是否擅长这类任务？
- **错误成本** —— 错误是否能被发现并恢复？（测试、评审、回滚）

只要任何一项是"否"，就退回到更简单的层级（单次调用或工作流）。

---

## 架构

一切都走 `POST /v1/messages`。工具和输出约束都是这一个端点的特性 —— 不是独立的 API。

**用户自定义工具** —— 你定义工具（通过装饰器、Zod schema 或原始 JSON），SDK 的 tool runner 会负责调用 API、执行你的函数，并循环直到 Claude 完成。如果想获得完全控制，你也可以手动编写循环。

**服务端工具** —— 由 Anthropic 托管、运行在 Anthropic 基础设施上的工具。Code execution 完全在服务端运行（在 `tools` 中声明即可，Claude 会自动执行代码）。Computer use 可以服务端托管，也可以自托管。

**结构化输出** —— 用于约束 Messages API 的响应格式（`output_config.format`）和/或工具参数校验（`strict: true`）。推荐使用 `client.messages.parse()`，它会自动根据你的 schema 校验响应。注意：旧的 `output_format` 参数已废弃，请在 `messages.create()` 上使用 `output_config: {format: {...}}`。

**辅助端点** —— Batches（`POST /v1/messages/batches`）、Files（`POST /v1/files`）、Token Counting 和 Models（`GET /v1/models`、`GET /v1/models/{id}` —— 实时能力/上下文窗口查询）都用于支撑或服务 Messages API 请求。

---

## 当前模型（缓存时间：2026-04-15）

| Model             | Model ID            | Context        | Input $/1M | Output $/1M |
| ----------------- | ------------------- | -------------- | ---------- | ----------- |
| Claude Opus 4.7   | `claude-opus-4-7`   | 1M             | $5.00      | $25.00      |
| Claude Opus 4.6   | `claude-opus-4-6`   | 1M             | $5.00      | $25.00      |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M             | $3.00      | $15.00      |
| Claude Haiku 4.5  | `claude-haiku-4-5`  | 200K           | $1.00      | $5.00       |

**除非用户明确指定其他模型，否则一律使用 `claude-opus-4-7`。** 没有商量余地。除非用户字面说出"use sonnet"或"use haiku"，否则不要使用 `claude-sonnet-4-6`、`claude-sonnet-4-5` 或任何其他模型。永远不要为了省钱降级 —— 那是用户的决定，不是你的。

**关键：只使用上表中精确的模型 ID 字符串 —— 它们本身就是完整的。不要追加日期后缀。** 比如要用 `claude-sonnet-4-5`，绝不要用 `claude-sonnet-4-5-20250514` 或你从训练数据里回忆出来的任何带日期后缀的变体。如果用户请求的旧模型不在表里（例如 "opus 4.5"、"sonnet 3.7"），请阅读 `shared/models.md` 取准确 ID —— 不要自己拼。

附注：如果你觉得上面的模型字符串中有些看着陌生，这是正常的 —— 那只是说明它们是在你的训练数据截止之后发布的。放心，它们都是真实存在的模型；我们不会在这件事上糊弄你。

**实时能力查询：** 上表是缓存数据。当用户问"X 的上下文窗口是多少"、"X 是否支持 vision/thinking/effort"或"哪些模型支持 Y"时，请调用 Models API（`client.models.retrieve(id)` / `client.models.list()`）—— 字段参考和能力过滤示例见 `shared/models.md`。

---

## Thinking 与 Effort（速查）

**Opus 4.7 —— 仅支持自适应思考：** 使用 `thinking: {type: "adaptive"}`。`thinking: {type: "enabled", budget_tokens: N}` 在 Opus 4.7 上返回 400 —— adaptive 是唯一的开启模式。`{type: "disabled"}` 和省略 `thinking` 都可以。采样参数（`temperature`、`top_p`、`top_k`）也已移除，传入会返回 400。完整的破坏性变更清单见 `shared/model-migration.md` → Migrating to Opus 4.7。
**Opus 4.6 —— 自适应思考（推荐）：** 使用 `thinking: {type: "adaptive"}`。Claude 会动态决定何时以及思考多少。不需要 `budget_tokens` —— `budget_tokens` 在 Opus 4.6 和 Sonnet 4.6 上已废弃，新代码不应使用。自适应思考还会自动启用 interleaved thinking（无需 beta header）。**当用户要求 "extended thinking"、"thinking budget" 或 `budget_tokens` 时：始终使用 Opus 4.7 或 4.6，配合 `thinking: {type: "adaptive"}`。固定 token 预算用于思考这一概念已经废弃 —— 自适应思考已经取代了它。新的 4.6/4.7 代码中不要使用 `budget_tokens`，也不要切回旧模型。** *渐进迁移豁免：* `budget_tokens` 在 Opus 4.6 和 Sonnet 4.6 上仍可运行，作为过渡用的逃生口 —— 如果你在迁移已有代码、还来不及调好 `effort` 但又需要一个硬性的 token 上限，参阅 `shared/model-migration.md` → Transitional escape hatch。注意：此豁免**不适用于** Opus 4.7 —— 那里 `budget_tokens` 已被完全移除。
**Effort 参数（GA，无需 beta header）：** 通过 `output_config: {effort: "low"|"medium"|"high"|"max"}`（位于 `output_config` 内部，不是顶层）控制思考深度和整体 token 消耗。默认是 `high`（等同于不传）。`max` 仅 Opus 级别可用（Opus 4.6 及以后 —— 不包括 Sonnet 和 Haiku）。Opus 4.7 新增了 `"xhigh"`（位于 `high` 和 `max` 之间）—— 在 4.7 上对绝大多数编码和 agentic 场景而言这是最佳设置，也是 Claude Code 的默认值；对大多数依赖智力的工作至少使用 `high`。可在 Opus 4.5、Opus 4.6、Opus 4.7 和 Sonnet 4.6 上使用，在 Sonnet 4.5 / Haiku 4.5 上会报错。在 Opus 4.7 上，effort 的影响比此前任何 Opus 都更明显 —— 迁移时务必重新调优。与自适应思考组合，可以获得最优的成本-质量权衡。effort 越低意味着工具调用更少且更集中、前奏更少、确认更简短 —— `high` 通常是质量与 token 效率的最佳折中；正确性比成本更重要时使用 `max`；子 agent 或简单任务使用 `low`。

**Opus 4.7 —— 思考内容默认省略：** `thinking` 块仍然会流式产出，但其文本默认为空，除非通过 `thinking: {type: "adaptive", display: "summarized"}` 显式启用（默认为 `"omitted"`）。这是一次静默变更 —— 不会报错。如果你把推理流式展示给用户，默认行为看起来就是输出前长时间停顿；把它设为 `"summarized"` 可以恢复可见的进度。

**Task Budgets（beta，Opus 4.7）：** `output_config: {task_budget: {type: "tokens", total: N}}` 告诉模型整个 agentic loop 有多少 token 预算 —— 模型会看到一个持续倒计时并自我节制（最小 20,000；beta header `task-budgets-2026-03-13`）。它与 `max_tokens` 不同：后者是每次响应强制执行的上限，且模型并不知情。参见 `shared/model-migration.md` → Task Budgets。

**Sonnet 4.6：** 支持自适应思考（`thinking: {type: "adaptive"}`）。`budget_tokens` 在 Sonnet 4.6 上已废弃 —— 请改用自适应思考。

**旧模型（仅在用户明确要求时使用）：** 如果用户特别要求使用 Sonnet 4.5 或其他旧模型，使用 `thinking: {type: "enabled", budget_tokens: N}`。`budget_tokens` 必须小于 `max_tokens`（最小 1024）。绝不要仅因为用户提到 `budget_tokens` 就选择旧模型 —— 应改用 Opus 4.7 + 自适应思考。

---

## Compaction（速查）

**Beta，支持 Opus 4.7、Opus 4.6 和 Sonnet 4.6。** 对于可能超出 1M 上下文窗口的长会话，启用服务端 compaction。当上下文接近触发阈值（默认：150K tokens）时，API 会自动对早期内容做摘要。需要 beta header `compact-2026-01-12`。

**关键：** 每轮都要把 `response.content`（而不仅仅是 text）追加回 messages。响应中的 compaction 块必须保留 —— API 会在下一次请求中用它们替换已被压缩的历史。只提取 text 字符串再追加会静默丢失 compaction 状态。

代码示例见 `{lang}/claude-api/README.md`（Compaction 一节）。完整文档可通过 `shared/live-sources.md` 中的 WebFetch 链接获取。

---

## Prompt Caching（速查）

**前缀匹配。** 前缀中任何字节的改动都会让其后所有内容失效。渲染顺序是 `tools` → `system` → `messages`。把稳定内容放在最前面（固定的 system prompt、确定顺序的工具列表），把易变内容（时间戳、单次请求 ID、变化的问题）放到最后一个 `cache_control` 断点之后。

**顶层自动缓存**（在 `messages.create()` 上使用 `cache_control: {type: "ephemeral"}`）在你不需要细粒度控制时是最简单的选项。每个请求最多 4 个断点。可缓存前缀的最小长度大约是 1024 tokens —— 更短的前缀会被静默地不缓存。

**用 `usage.cache_read_input_tokens` 验证** —— 如果在重复请求中始终为 0，说明有静默失效因素（system prompt 里的 `datetime.now()`、未排序的 JSON、变化的工具集合）。

放置模式、架构指南、静默失效因素审计清单见：`shared/prompt-caching.md`。语言专属语法见：`{lang}/claude-api/README.md`（Prompt Caching 一节）。

---

## Managed Agents（Beta）

**Managed Agents** 是第三种接入层：服务端托管的有状态 agent，工具执行也由 Anthropic 托管。你先通过 `POST /v1/agents` 创建一个持久化、可版本化的 Agent 配置，然后启动 Session 来引用它。每个 session 会分配一个容器作为 agent 的工作空间 —— bash、文件操作、代码执行都在那里运行；agent loop 本身跑在 Anthropic 的编排层上，通过工具作用于该容器。session 会以流形式推送事件；你把消息和工具结果发回去。

**Managed Agents 仅限第一方。** Amazon Bedrock、Google Vertex AI、Microsoft Foundry 不支持。要在第三方厂商上构建 agent，请使用 Claude API + tool use。

**强制流程：** Agent（一次）→ Session（每次运行）。`model`/`system`/`tools` 属于 agent，绝不放在 session 上。完整阅读指南、beta header 和常见坑见 `shared/managed-agents-overview.md`。

**Beta headers：** `managed-agents-2026-04-01` —— SDK 会为所有 `client.beta.{agents,environments,sessions,vaults,memory_stores}.*` 调用自动设置。Skills API 用 `skills-2025-10-02`，Files API 用 `files-api-2025-04-14`，但对于 `/v1/skills` 和 `/v1/files` 以外的端点你不需要手动传入它们。

**Subcommands** —— 通过 `/claude-api <subcommand>` 直接调用：

| Subcommand | Action |
|---|---|
| `managed-agents-onboard` | Walk the user through setting up a Managed Agent from scratch. **Read `shared/managed-agents-onboarding.md` immediately** and follow its interview script: mental model → know-or-explore branch → template config → session setup → emit code. Do not summarize — run the interview. |

**阅读指南：** 先从 `shared/managed-agents-overview.md` 开始，再读各主题文件 `shared/managed-agents-*.md`（core、environments、tools、events、outcomes、multiagent、webhooks、memory、client-patterns、onboarding、api-reference）。Python、TypeScript、Go、Ruby、PHP、Java 请阅读 `{lang}/managed-agents/README.md` 获取代码示例。cURL 请阅读 `curl/managed-agents.md`。**Agent 是持久的 —— 创建一次后按 ID 引用即可。** 把 `agents.create` 返回的 agent ID 存起来，并在后续每次 `sessions.create` 时传入；不要在请求路径里调用 `agents.create`。Anthropic CLI 是从受版本控制的 YAML 创建 agent 和 environment 的一种便捷方式（URL 见 `shared/live-sources.md`）。如果语言 README 中没有展示你需要的绑定，请从 `shared/live-sources.md` WebFetch 对应条目，而不是去猜。C# 目前不支持 Managed Agents；可参考 `curl/managed-agents.md` 中的原始 HTTP。

**当用户希望从零开始搭一个 Managed Agent 时**（例如"我该怎么入门"、"带我走一遍创建流程"、"帮我配置一个新的 agent"）：阅读 `shared/managed-agents-onboarding.md` 并按其中的访谈流程走 —— 与 `managed-agents-onboard` 子命令使用的流程一致。

**当用户问"X 的客户端代码怎么写"时：** 直接看 `shared/managed-agents-client-patterns.md` —— 涵盖无损流重连、`processed_at` 排队/处理门控、interrupt、`tool_confirmation` 往返、正确的 idle/terminated 退出门控、idle 后的状态竞争、流优先的事件顺序、文件挂载坑、把凭据保留在 host 端的自定义工具等。

---

## 阅读指南

识别完语言后，根据用户需求读取相应文件：

### 快速任务对照

**单条文本分类/摘要/抽取/问答：**
→ 只需阅读 `{lang}/claude-api/README.md`

**聊天 UI 或实时响应展示：**
→ 阅读 `{lang}/claude-api/README.md` + `{lang}/claude-api/streaming.md`

**长会话（可能超出上下文窗口）：**
→ 阅读 `{lang}/claude-api/README.md` —— 见 Compaction 一节
**迁移到新模型（Opus 4.7 / Opus 4.6 / Sonnet 4.6）或替换已退役模型：**
→ 阅读 `shared/model-migration.md`
**Prompt caching / 优化缓存 / "为什么我的缓存命中率这么低"：**
→ 阅读 `shared/prompt-caching.md` + `{lang}/claude-api/README.md`（Prompt Caching 一节）

**函数调用 / tool use / agent：**
→ 阅读 `{lang}/claude-api/README.md` + `shared/tool-use-concepts.md` + `{lang}/claude-api/tool-use.md`

**Agent 设计（工具面、上下文管理、缓存策略）：**
→ 阅读 `shared/agent-design.md`

**批处理（对延迟不敏感）：**
→ 阅读 `{lang}/claude-api/README.md` + `{lang}/claude-api/batches.md`

**跨多个请求复用文件：**
→ 阅读 `{lang}/claude-api/README.md` + `{lang}/claude-api/files-api.md`

**Managed Agents（服务端托管的有状态 agent，带工作空间）：**
→ 阅读 `shared/managed-agents-overview.md` 以及其余 `shared/managed-agents-*.md` 文件。Python、TypeScript、Go、Ruby、PHP、Java 请阅读 `{lang}/managed-agents/README.md` 获取代码示例。cURL 请阅读 `curl/managed-agents.md`。**Agent 是持久的 —— 创建一次后按 ID 引用即可。** 把 `agents.create` 返回的 agent ID 存起来，并在后续每次 `sessions.create` 时传入；不要在请求路径里调用 `agents.create`。Anthropic CLI 是从受版本控制的 YAML 创建 agent 和 environment 的一种便捷方式（URL 见 `shared/live-sources.md`）。如果语言 README 中没有展示你需要的绑定，请从 `shared/live-sources.md` WebFetch 对应条目，而不是去猜。C# 目前不支持 Managed Agents —— 可参考 `curl/managed-agents.md` 中的原始 HTTP。

### Claude API（完整文件参考）

阅读**语言专属的 Claude API 目录**（`{language}/claude-api/`）：

1. **`{language}/claude-api/README.md`** —— **先读这个。** 安装、快速开始、常见模式、错误处理。
2. **`shared/tool-use-concepts.md`** —— 用户需要函数调用、代码执行、memory 或结构化输出时阅读。涵盖概念基础。
3. **`shared/agent-design.md`** —— 设计 agent 时阅读：bash 还是专属工具、程序化工具调用、tool search/skills、context editing vs. compaction vs. memory、缓存原则。
4. **`{language}/claude-api/tool-use.md`** —— 语言专属的 tool use 代码示例（tool runner、手动循环、code execution、memory、结构化输出）。
5. **`{language}/claude-api/streaming.md`** —— 构建聊天 UI 或需要增量展示响应的界面时阅读。
6. **`{language}/claude-api/batches.md`** —— 离线处理大量请求（对延迟不敏感）时阅读。异步运行，费用减半。
7. **`{language}/claude-api/files-api.md`** —— 同一份文件需要在多次请求中复用且不重新上传时阅读。
8. **`shared/prompt-caching.md`** —— 新增或优化 prompt caching 时阅读。涵盖前缀稳定性设计、断点放置，以及那些会静默让缓存失效的反模式。
9. **`shared/error-codes.md`** —— 调试 HTTP 错误或实现错误处理时阅读。
10. **`shared/model-migration.md`** —— 升级到新模型、替换已退役模型，或把 `budget_tokens` / prefill 等模式翻译到当前 API 时阅读。
11. **`shared/live-sources.md`** —— 用于拉取最新官方文档的 WebFetch 链接。

> **说明：** Java、Go、Ruby、C#、PHP 和 cURL 每种语言只有一个文件覆盖全部基础内容。阅读该文件，再按需配合 `shared/tool-use-concepts.md` 和 `shared/error-codes.md`。

> **说明：** Managed Agents 的文件参考见上文 `## Managed Agents (Beta)` 章节 —— 那里列出了所有 `shared/managed-agents-*.md` 文件和各语言 README。

---

## 何时使用 WebFetch

以下场景使用 WebFetch 获取最新文档：

- 用户要求 "latest" 或 "current" 信息
- 缓存数据看起来不正确
- 用户问到本 Skill 未覆盖的特性

最新文档 URL 见 `shared/live-sources.md`。

## 常见坑

- 向 API 传入文件或内容时不要截断。如果内容长到无法塞入上下文窗口，请告知用户并讨论选项（分块、摘要等），而不是静默截断。
- **Opus 4.7 thinking：** 只支持 adaptive。`thinking: {type: "enabled", budget_tokens: N}` 在 Opus 4.7 上返回 400 —— `budget_tokens` 已被完全移除（连同 `temperature`、`top_p`、`top_k`）。请使用 `thinking: {type: "adaptive"}`。
- **Opus 4.6 / Sonnet 4.6 thinking：** 使用 `thinking: {type: "adaptive"}` —— 新的 4.6 代码不要用 `budget_tokens`（在 Opus 4.6 和 Sonnet 4.6 上均已废弃；对存量代码的渐进迁移，见 `shared/model-migration.md` 中的过渡逃生口 —— 注意该豁免不适用于 Opus 4.7）。对旧模型而言，`budget_tokens` 必须小于 `max_tokens`（最小 1024）。配错会报错。
- **4.6/4.7 系列移除了 prefill：** Assistant message prefill（最后一条 assistant turn 的 prefill）在 Opus 4.6、Opus 4.7、Sonnet 4.6 上会返回 400。请改用结构化输出（`output_config.format`）或在 system prompt 中给出指令来控制响应格式。
- **编辑前先确认迁移范围：** 当用户要求把代码迁移到新的 Claude 模型，但没有指定文件、目录或文件清单时，**先问要应用到哪个范围** —— 整个工作目录、某个特定子目录，还是某组特定文件。在用户确认前不要开始编辑。"migrate my codebase"、"move my project to X"、"upgrade to Sonnet 4.6"、单独的 "migrate to Opus 4.7" 这类祈使句**仍然是模糊的** —— 它们告诉你做什么但没说在哪做，所以要问。只有当 prompt 给出了明确的文件、目录或文件清单时（"migrate `app.py`"、"migrate everything under `services/`"、"update `a.py` and `b.py`"）才可不问直接做。见 `shared/model-migration.md` Step 0。
- **`max_tokens` 默认值：** 不要把 `max_tokens` 压得太低 —— 撞顶会让输出在中途被截断，需要重试。非流式请求默认 `~16000`（让响应处于 SDK HTTP 超时之内）。流式请求默认 `~64000`（不用担心超时，给模型留足空间）。只有当你有明确理由时才更低：分类（`~256`）、成本上限，或刻意要求短输出。
- **128K 输出 token：** Opus 4.6 和 Opus 4.7 支持高达 128K 的 `max_tokens`，但当数值这么大时 SDK 要求使用流式以避免 HTTP 超时。请使用 `.stream()` 配合 `.get_final_message()` / `.finalMessage()`。
- **Tool call JSON 解析（4.6/4.7 系列）：** Opus 4.6、Opus 4.7 和 Sonnet 4.6 在 tool call 的 `input` 字段中可能产生不同的 JSON 字符串转义（例如 Unicode 或正斜杠转义）。请始终用 `json.loads()` / `JSON.parse()` 解析 tool input —— 不要在序列化后的 input 上做原始字符串匹配。
- **结构化输出（所有模型）：** 在 `messages.create()` 上使用 `output_config: {format: {...}}`，而不是已废弃的 `output_format` 参数。这是 API 的通用变更，与 4.6 无关。
- **不要重复造 SDK 已有的轮子：** SDK 提供了高阶辅助方法 —— 直接使用它们，不要从头实现。具体地：使用 `stream.finalMessage()` 而不是把 `.on()` 事件包进 `new Promise()`；使用类型化异常类（`Anthropic.RateLimitError` 等）而不是对错误信息字符串匹配；使用 SDK 类型（`Anthropic.MessageParam`、`Anthropic.Tool`、`Anthropic.Message` 等）而不是另定义一套等价的接口。
- **不要为 SDK 数据结构自定义类型：** SDK 已为所有 API 对象导出类型。消息用 `Anthropic.MessageParam`，工具定义用 `Anthropic.Tool`，工具结果用 `Anthropic.ToolUseBlock` / `Anthropic.ToolResultBlockParam`，响应用 `Anthropic.Message`。自己写 `interface ChatMessage { role: string; content: unknown }` 等于在重复 SDK 已经提供的能力，同时丢失类型安全。
- **报告与文档类输出：** 当任务需要产出报告、文档或可视化结果时，代码执行沙盒已预装 `python-docx`、`python-pptx`、`matplotlib`、`pillow` 和 `pypdf`。Claude 可以生成格式化的文件（DOCX、PDF、图表）并通过 Files API 返回 —— 处理"报告"或"文档"类需求时可以考虑这种方式，而不是单纯的 stdout 文本。
