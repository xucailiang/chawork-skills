---
name: internal-comms
description: >-
  一组帮助我撰写各类公司内部沟通文档的资源，使用本公司常用的格式。每当被要求撰写各类内部沟通材料（状态报告、领导层汇报、3P
  更新、公司通讯、FAQ、事件报告、项目进展等）时，Claude 都应使用此 skill。
license: Complete terms in LICENSE.txt
original_description: >-
  A set of resources to help me write all kinds of internal communications,
  using the formats that my company likes to use. Claude should use this skill
  whenever asked to write some sort of internal communications (status reports,
  leadership updates, 3P updates, company newsletters, FAQs, incident reports,
  project updates, etc.).
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T10:51:14.524Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

## 何时使用此 skill
撰写内部沟通内容时，请使用此 skill，适用场景包括：
- 3P 更新（Progress 进展、Plans 计划、Problems 问题）
- 公司内部通讯
- FAQ 回复
- 状态报告
- 领导层汇报
- 项目更新
- 事故报告

## 如何使用此 skill

撰写任何内部沟通内容时：

1. **从请求中识别沟通类型**
2. **从 `examples/` 目录加载对应的指引文件**：
    - `examples/3p-updates.md` - 用于 Progress/Plans/Problems 团队更新
    - `examples/company-newsletter.md` - 用于全公司范围的内部通讯
    - `examples/faq-answers.md` - 用于回答常见问题
    - `examples/general-comms.md` - 用于不属于以上任何明确类型的其他内容
3. **遵循该文件中的具体指引**，包括格式、语气和内容收集方式

如果沟通类型与现有任何指引都不匹配，请要求澄清或提供更多关于所需格式的上下文。

## 关键词
3P updates, company newsletter, company comms, weekly update, faqs, common questions, updates, internal comms
