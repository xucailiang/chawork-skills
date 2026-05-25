---
name: mcp-builder
description: >-
  用于创建高质量 MCP (Model Context Protocol) 服务器的指南，让 LLM 通过精心设计的工具与外部服务交互。在使用 Python
  (FastMCP) 或 Node/TypeScript (MCP SDK) 构建 MCP 服务器以集成外部 API 或服务时使用。
license: Complete terms in LICENSE.txt
original_description: >-
  Guide for creating high-quality MCP (Model Context Protocol) servers that
  enable LLMs to interact with external services through well-designed tools.
  Use when building MCP servers to integrate external APIs or services, whether
  in Python (FastMCP) or Node/TypeScript (MCP SDK).
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T11:59:27.301Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# MCP Server 开发指南

## 概述

构建 MCP（Model Context Protocol）服务器，让 LLM 能够通过精心设计的工具与外部服务交互。MCP 服务器的质量取决于它能在多大程度上帮助 LLM 完成真实世界的任务。

---

# 流程

## 🚀 整体工作流

构建高质量 MCP 服务器分为四个主要阶段：

### 第 1 阶段：深入研究与规划

#### 1.1 理解现代 MCP 设计

**API 覆盖 vs. 工作流工具：**
在全面覆盖 API 端点与提供专门的工作流工具之间取得平衡。工作流工具在处理特定任务时更便捷，而全面覆盖则让 agent 在组合操作时更灵活。性能因客户端而异——有些客户端受益于通过代码执行来组合基础工具，而另一些则在高层工作流下表现更好。当不确定时，优先考虑全面的 API 覆盖。

**工具命名与可发现性：**
清晰、描述性强的工具名称能帮助 agent 快速找到合适的工具。使用一致的前缀（例如 `github_create_issue`、`github_list_repos`）和以动作为导向的命名方式。

**上下文管理：**
agent 受益于简洁的工具描述以及对结果进行过滤/分页的能力。设计工具时应返回聚焦、相关的数据。部分客户端支持代码执行，可帮助 agent 高效过滤和处理数据。

**可操作的错误信息：**
错误信息应通过具体的建议和后续步骤引导 agent 找到解决方案。

#### 1.2 学习 MCP 协议文档

**浏览 MCP 规范：**

先从 sitemap 入手查找相关页面：`https://modelcontextprotocol.io/sitemap.xml`

然后通过在 URL 后加 `.md` 后缀获取 markdown 格式的特定页面（例如 `https://modelcontextprotocol.io/specification/draft.md`）。

需重点查阅的页面：
- 规范概述与架构
- 传输机制（streamable HTTP、stdio）
- 工具、资源和 prompt 的定义

#### 1.3 学习框架文档

**推荐技术栈：**
- **语言**：TypeScript（SDK 质量高，在 MCPB 等多种执行环境中兼容性良好。此外 AI 模型擅长生成 TypeScript 代码，得益于其广泛使用、静态类型和优秀的 lint 工具）
- **传输**：远程服务器使用 Streamable HTTP，采用无状态 JSON（相比有状态会话和流式响应，更易扩展和维护）。本地服务器使用 stdio。

**加载框架文档：**

- **MCP 最佳实践**：[📋 查看最佳实践](./reference/mcp_best_practices.md) - 核心指南

**TypeScript（推荐）：**
- **TypeScript SDK**：使用 WebFetch 加载 `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`
- [⚡ TypeScript 指南](./reference/node_mcp_server.md) - TypeScript 模式与示例

**Python：**
- **Python SDK**：使用 WebFetch 加载 `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`
- [🐍 Python 指南](./reference/python_mcp_server.md) - Python 模式与示例

#### 1.4 规划你的实现

**理解 API：**
查阅目标服务的 API 文档，识别关键端点、认证要求和数据模型。按需使用网页搜索和 WebFetch。

**工具选择：**
优先考虑全面的 API 覆盖。列出要实现的端点，从最常用的操作开始。

---

### 第 2 阶段：实现

#### 2.1 搭建项目结构

参见各语言专属指南完成项目初始化：
- [⚡ TypeScript 指南](./reference/node_mcp_server.md) - 项目结构、package.json、tsconfig.json
- [🐍 Python 指南](./reference/python_mcp_server.md) - 模块组织、依赖管理

#### 2.2 实现核心基础设施

构建共享工具：
- 带认证的 API 客户端
- 错误处理辅助函数
- 响应格式化（JSON/Markdown）
- 分页支持

#### 2.3 实现工具

对每个工具：

**输入 Schema：**
- 使用 Zod（TypeScript）或 Pydantic（Python）
- 加入约束条件和清晰的描述
- 在字段描述中添加示例

**输出 Schema：**
- 尽可能为结构化数据定义 `outputSchema`
- 在工具响应中使用 `structuredContent`（TypeScript SDK 特性）
- 帮助客户端理解和处理工具输出

**工具描述：**
- 对功能进行简要概述
- 参数说明
- 返回类型 schema

**实现细节：**
- 对 I/O 操作使用 async/await
- 妥善处理错误，并提供可操作的提示信息
- 在合适场景下支持分页
- 使用现代 SDK 时，同时返回文本内容和结构化数据

**注解（Annotations）：**
- `readOnlyHint`: true/false
- `destructiveHint`: true/false
- `idempotentHint`: true/false
- `openWorldHint`: true/false

---

### 第 3 阶段：审查与测试

#### 3.1 代码质量

审查要点：
- 无重复代码（DRY 原则）
- 错误处理一致
- 完整的类型覆盖
- 工具描述清晰

#### 3.2 构建与测试

**TypeScript：**
- 运行 `npm run build` 验证编译
- 使用 MCP Inspector 测试：`npx @modelcontextprotocol/inspector`

**Python：**
- 验证语法：`python -m py_compile your_server.py`
- 使用 MCP Inspector 测试

详细的测试方法和质量检查清单参见各语言专属指南。

---

### 第 4 阶段：创建评估（Evaluations）

实现完 MCP 服务器后，构建全面的评估以测试其有效性。

**加载 [✅ 评估指南](./reference/evaluation.md) 获取完整的评估准则。**

#### 4.1 理解评估目的

通过评估来检验 LLM 是否能够借助你的 MCP 服务器有效回答真实、复杂的问题。

#### 4.2 构建 10 道评估题

要构建有效的评估，请遵循评估指南中的流程：

1. **工具检查**：列出可用的工具并理解其能力
2. **内容探索**：使用只读操作探索可用数据
3. **题目生成**：构造 10 道复杂、贴近真实场景的问题
4. **答案验证**：自己解答每道题以核实答案

#### 4.3 评估要求

确保每道题都满足：
- **独立性**：不依赖其他题目
- **只读**：仅需非破坏性操作
- **复杂度**：需要多次工具调用和深入探索
- **真实性**：基于人们真正关心的实际用例
- **可验证**：拥有单一、明确的答案，且可通过字符串比对验证
- **稳定性**：答案不会随时间变化

#### 4.4 输出格式

创建一个 XML 文件，结构如下：

```xml
<evaluation>
  <qa_pair>
    <question>Find discussions about AI model launches with animal codenames. One model needed a specific safety designation that uses the format ASL-X. What number X was being determined for the model named after a spotted wild cat?</question>
    <answer>3</answer>
  </qa_pair>
<!-- More qa_pairs... -->
</evaluation>
```

---

# 参考文件

## 📚 文档库

按需在开发过程中加载以下资源：

### MCP 核心文档（优先加载）
- **MCP 协议**：先从 `https://modelcontextprotocol.io/sitemap.xml` 的 sitemap 入手，然后通过 `.md` 后缀获取特定页面
- [📋 MCP 最佳实践](./reference/mcp_best_practices.md) - 通用 MCP 指南，包括：
  - 服务器与工具命名规范
  - 响应格式准则（JSON vs Markdown）
  - 分页最佳实践
  - 传输方式选择（streamable HTTP vs stdio）
  - 安全和错误处理标准

### SDK 文档（在第 1/2 阶段加载）
- **Python SDK**：从 `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md` 获取
- **TypeScript SDK**：从 `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md` 获取

### 各语言专属实现指南（在第 2 阶段加载）
- [🐍 Python 实现指南](./reference/python_mcp_server.md) - 完整的 Python/FastMCP 指南，涵盖：
  - 服务器初始化模式
  - Pydantic 模型示例
  - 使用 `@mcp.tool` 注册工具
  - 完整可运行示例
  - 质量检查清单

- [⚡ TypeScript 实现指南](./reference/node_mcp_server.md) - 完整的 TypeScript 指南，涵盖：
  - 项目结构
  - Zod schema 模式
  - 使用 `server.registerTool` 注册工具
  - 完整可运行示例
  - 质量检查清单

### 评估指南（在第 4 阶段加载）
- [✅ 评估指南](./reference/evaluation.md) - 完整的评估构建指南，涵盖：
  - 题目设计准则
  - 答案验证策略
  - XML 格式规范
  - 题目与答案示例
  - 使用配套脚本运行评估
