---
name: theme-factory
description: >-
  用于通过主题为各类产物（artifacts）应用样式的工具包。这些产物可以是幻灯片、文档、报告、HTML 落地页等。内置 10
  套预设主题（包含配色与字体）可应用于任何已创建的 artifact，也支持即时生成新主题。
license: Complete terms in LICENSE.txt
original_description: >-
  Toolkit for styling artifacts with a theme. These artifacts can be slides,
  docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with
  colors/fonts that you can apply to any artifact that has been creating, or can
  generate a new theme on-the-fly.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:06:18.015Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# 主题工厂 Skill

此 Skill 提供一组精心策划的专业字体和颜色主题集合，每个主题都包含精挑细选的配色方案和字体搭配。一旦选定主题，即可应用到任意 artifact 上。

## 用途

如需为演示文稿幻灯片应用一致、专业的样式，请使用此 Skill。每个主题包含：
- 一套和谐统一的配色方案（含十六进制色值）
- 适用于标题和正文的互补字体搭配
- 适合不同场景和受众的独特视觉风格

## 使用说明

为幻灯片或其他 artifact 应用样式时：

1. **展示主题样例**：展示 `theme-showcase.pdf` 文件，让用户可视化浏览所有可用主题。不要对其做任何修改，仅用于查看。
2. **询问用户选择**：询问要将哪个主题应用到幻灯片上
3. **等待用户确认**：获取用户对所选主题的明确确认
4. **应用主题**：主题选定后，将该主题的颜色和字体应用到幻灯片/artifact 上

## 可用主题

共有以下 10 个主题，均在 `theme-showcase.pdf` 中展示：

1. **Ocean Depths** —— 专业且沉静的海洋主题
2. **Sunset Boulevard** —— 温暖且明快的日落色调
3. **Forest Canopy** —— 自然且沉稳的大地色调
4. **Modern Minimalist** —— 简洁且现代的灰阶风格
5. **Golden Hour** —— 浓郁且温暖的秋日配色
6. **Arctic Frost** —— 清冷且明快的冬日主题
7. **Desert Rose** —— 柔和且精致的尘玫色调
8. **Tech Innovation** —— 大胆且现代的科技美学
9. **Botanical Garden** —— 清新且自然的花园色彩
10. **Midnight Galaxy** —— 戏剧化且深邃的宇宙色调

## 主题详情

每个主题都定义在 `themes/` 目录中，包含完整的规范，其中涵盖：
- 含十六进制色值的和谐配色方案
- 适用于标题和正文的互补字体搭配
- 适合不同场景和受众的独特视觉风格

## 应用流程

选定首选主题后：
1. 从 `themes/` 目录读取对应的主题文件
2. 在整个幻灯片中一致地应用指定的颜色和字体
3. 确保足够的对比度和可读性
4. 在所有幻灯片中保持主题的视觉风格

## 创建自定义主题
若现有主题均不适用于某个 artifact，可创建自定义主题。基于提供的输入，生成一个与上述风格相近的新主题。给主题起一个类似风格的名字，用以描述字体/颜色组合所代表的意象。根据用户提供的基本描述，选择合适的颜色和字体。生成主题后，展示出来供审阅与确认。确认后，按上文所述的流程应用该主题。
