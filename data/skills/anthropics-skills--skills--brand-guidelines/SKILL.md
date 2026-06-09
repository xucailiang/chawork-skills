---
name: brand-guidelines
description: 为任何可能受益于 Anthropic 品牌风格的制品应用 Anthropic 官方品牌色与字体规范。当涉及品牌色或样式指南、视觉格式化或公司设计标准时使用。
license: Complete terms in LICENSE.txt
original_description: >-
  Applies Anthropic's official brand colors and typography to any sort of
  artifact that may benefit from having Anthropic's look-and-feel. Use it when
  brand colors or style guidelines, visual formatting, or company design
  standards apply.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T11:48:49.786Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# Anthropic 品牌样式

## 概述

如需获取 Anthropic 官方品牌标识与样式资源，请使用本 skill。

**关键词**：branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, Anthropic brand, visual formatting, visual design

## 品牌规范

### 颜色

**主色：**

- Dark: `#141413` — 主要文本与深色背景
- Light: `#faf9f5` — 浅色背景，以及深色背景上的文字
- Mid Gray: `#b0aea5` — 次要元素
- Light Gray: `#e8e6dc` — 低饱和背景

**强调色：**

- Orange: `#d97757` — 主强调色
- Blue: `#6a9bcc` — 次强调色
- Green: `#788c5d` — 第三强调色

### 字体

- **标题**：Poppins（回退字体为 Arial）
- **正文**：Lora（回退字体为 Georgia）
- **说明**：建议预先在你的运行环境中安装这些字体以获得最佳效果

## 功能特性

### 智能字体应用

- 对标题（24pt 及以上）应用 Poppins 字体
- 对正文应用 Lora 字体
- 当自定义字体不可用时，自动回退为 Arial/Georgia
- 在各类系统上保持良好可读性

### 文本样式

- 标题（24pt 及以上）：Poppins 字体
- 正文：Lora 字体
- 根据背景智能选择文字颜色
- 保留文本层级与排版格式

### 图形与强调色

- 非文本图形使用强调色
- 在 orange、blue、green 三种强调色之间循环使用
- 在保持品牌一致性的同时提升视觉表现力

## 技术细节

### 字体管理

- 优先使用系统已安装的 Poppins 与 Lora 字体
- 提供自动回退：标题回退为 Arial，正文回退为 Georgia
- 无需额外安装字体即可工作，可直接复用系统现有字体
- 如追求最佳效果，建议在环境中预装 Poppins 与 Lora 字体

### 颜色应用

- 使用 RGB 色值以精确匹配品牌色
- 通过 python-pptx 的 `RGBColor` 类进行应用
- 在不同系统上保持颜色还原度一致
