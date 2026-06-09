---
name: web-artifacts-builder
description: >-
  用于创建复杂多组件 claude.ai HTML artifacts 的工具套件，基于现代前端 Web 技术（React、Tailwind
  CSS、shadcn/ui）。适用于需要状态管理、路由或 shadcn/ui 组件的复杂 artifacts，不适用于简单的单文件 HTML/JSX
  artifacts。
license: Complete terms in LICENSE.txt
original_description: >-
  Suite of tools for creating elaborate, multi-component claude.ai HTML
  artifacts using modern frontend web technologies (React, Tailwind CSS,
  shadcn/ui). Use for complex artifacts requiring state management, routing, or
  shadcn/ui components - not for simple single-file HTML/JSX artifacts.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:06:44.268Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# Web Artifacts 构建器

要构建强大的前端 claude.ai artifacts，请遵循以下步骤：
1. 使用 `scripts/init-artifact.sh` 初始化前端仓库
2. 通过编辑生成的代码来开发你的 artifact
3. 使用 `scripts/bundle-artifact.sh` 将所有代码打包成单一 HTML 文件
4. 向用户展示 artifact
5. （可选）测试 artifact

**技术栈**：React 18 + TypeScript + Vite + Parcel（打包）+ Tailwind CSS + shadcn/ui

## 设计与风格指南

非常重要：为了避免常被称为 "AI slop"（AI 套路感）的产出，请避免过度使用居中布局、紫色渐变、统一的圆角，以及 Inter 字体。

## 快速开始

### 第 1 步：初始化项目

运行初始化脚本以创建一个新的 React 项目：
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

这将创建一个配置完备的项目，包含：
- ✅ React + TypeScript（通过 Vite）
- ✅ Tailwind CSS 3.4.1，搭配 shadcn/ui 主题系统
- ✅ 已配置路径别名（`@/`）
- ✅ 预装 40+ 个 shadcn/ui 组件
- ✅ 包含所有 Radix UI 依赖
- ✅ 已通过 .parcelrc 配置 Parcel 用于打包
- ✅ Node 18+ 兼容性（自动检测并锁定 Vite 版本）

### 第 2 步：开发你的 Artifact

要构建 artifact，请编辑生成的文件。相关指引请参见下文的 **Common Development Tasks**。

### 第 3 步：打包为单一 HTML 文件

要将 React 应用打包为单一 HTML artifact：
```bash
bash scripts/bundle-artifact.sh
```

这会生成 `bundle.html`——一个自包含的 artifact，所有 JavaScript、CSS 与依赖均已内联。该文件可直接在 Claude 对话中作为 artifact 分享。

**前置条件**：你的项目根目录下必须存在 `index.html`。

**该脚本的作用**：
- 安装打包所需依赖（parcel、@parcel/config-default、parcel-resolver-tspaths、html-inline）
- 创建带路径别名支持的 `.parcelrc` 配置
- 使用 Parcel 构建（不生成 source map）
- 使用 html-inline 将所有资源内联进单一 HTML

### 第 4 步：将 Artifact 分享给用户

最后，在对话中将打包好的 HTML 文件分享给用户，让其作为 artifact 查看。

### 第 5 步：测试/可视化 Artifact（可选）

注意：这一步完全可选，仅在必要或被要求时执行。

要测试/可视化 artifact，可使用现有工具（包括其他 Skills 或诸如 Playwright、Puppeteer 等内置工具）。一般来说，应避免提前测试 artifact，因为这会在请求和最终 artifact 呈现之间引入延迟。如有需要或出现问题，可在展示 artifact 之后再进行测试。

## 参考资料

- **shadcn/ui 组件**：https://ui.shadcn.com/docs/components
