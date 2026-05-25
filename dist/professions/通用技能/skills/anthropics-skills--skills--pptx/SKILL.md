---
name: pptx
description: >-
  任何涉及 .pptx 文件的场景都应使用此 skill —— 无论作为输入、输出或两者皆是。包括：创建幻灯片、pitch deck
  或演示文稿；读取、解析或从任何 .pptx
  文件中提取文本（即使提取的内容将用于其他地方，如邮件或摘要）；编辑、修改或更新现有演示文稿；合并或拆分幻灯片文件；处理模板、版式、演讲者备注或评论。每当用户提到
  "deck"、"slides"、"presentation" 或引用 .pptx 文件名时即触发，无论用户后续打算如何处理这些内容。只要需要打开、创建或操作
  .pptx 文件，就使用此 skill。
license: Proprietary. LICENSE.txt has complete terms
original_description: >-
  Use this skill any time a .pptx file is involved in any way — as input,
  output, or both. This includes: creating slide decks, pitch decks, or
  presentations; reading, parsing, or extracting text from any .pptx file (even
  if the extracted content will be used elsewhere, like in an email or summary);
  editing, modifying, or updating existing presentations; combining or splitting
  slide files; working with templates, layouts, speaker notes, or comments.
  Trigger whenever the user mentions "deck," "slides," "presentation," or
  references a .pptx filename, regardless of what they plan to do with the
  content afterward. If a .pptx file needs to be opened, created, or touched,
  use this skill.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:01:23.018Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# PPTX Skill

## 快速参考

| 任务 | 指南 |
|------|-------|
| 读取/分析内容 | `python -m markitdown presentation.pptx` |
| 基于模板编辑或创建 | 阅读 [editing.md](editing.md) |
| 从零创建 | 阅读 [pptxgenjs.md](pptxgenjs.md) |

---

## 读取内容

```bash
# Text extraction
python -m markitdown presentation.pptx

# Visual overview
python scripts/thumbnail.py presentation.pptx

# Raw XML
python scripts/office/unpack.py presentation.pptx unpacked/
```

---

## 编辑工作流

**完整细节请阅读 [editing.md](editing.md)。**

1. 使用 `thumbnail.py` 分析模板
2. Unpack → 操作幻灯片 → 编辑内容 → 清理 → Pack

---

## 从零创建

**完整细节请阅读 [pptxgenjs.md](pptxgenjs.md)。**

当没有模板或参考演示文稿时使用。

---

## 设计建议

**不要做枯燥的幻灯片。** 白底加纯项目符号谁也打动不了。每张幻灯片都可以从下面这份清单中寻找灵感。

### 开始之前

- **选择一套大胆且贴合内容的配色**：配色应当看起来是为 **本主题** 而设计的。如果把你的配色直接搬到一份毫不相关的演示文稿里仍然"说得通"，那说明你的选择还不够具体。
- **主次分明而非均衡**：应当有一种颜色占据主导（60-70% 的视觉比重），搭配 1-2 个辅助色和一个鲜明的强调色。绝不要让所有颜色平分秋色。
- **明暗对比**：标题页和结尾页使用深色背景，正文使用浅色（"三明治"结构）。或者通篇深色，营造高端质感。
- **坚持使用一个视觉母题**：挑选一个有辨识度的元素并反复使用——圆角图片框、彩色圆形里的图标、单侧粗边框。让它贯穿每一张幻灯片。

### 配色方案

选择与主题契合的颜色——别一上来就用通用蓝。可以从下面的配色中寻找灵感：

| 主题 | 主色 | 辅色 | 强调色 |
|-------|---------|-----------|--------|
| **Midnight Executive** | `1E2761` (navy) | `CADCFC` (ice blue) | `FFFFFF` (white) |
| **Forest & Moss** | `2C5F2D` (forest) | `97BC62` (moss) | `F5F5F5` (cream) |
| **Coral Energy** | `F96167` (coral) | `F9E795` (gold) | `2F3C7E` (navy) |
| **Warm Terracotta** | `B85042` (terracotta) | `E7E8D1` (sand) | `A7BEAE` (sage) |
| **Ocean Gradient** | `065A82` (deep blue) | `1C7293` (teal) | `21295C` (midnight) |
| **Charcoal Minimal** | `36454F` (charcoal) | `F2F2F2` (off-white) | `212121` (black) |
| **Teal Trust** | `028090` (teal) | `00A896` (seafoam) | `02C39A` (mint) |
| **Berry & Cream** | `6D2E46` (berry) | `A26769` (dusty rose) | `ECE2D0` (cream) |
| **Sage Calm** | `84B59F` (sage) | `69A297` (eucalyptus) | `50808E` (slate) |
| **Cherry Bold** | `990011` (cherry) | `FCF6F5` (off-white) | `2F3C7E` (navy) |

### 每张幻灯片

**每张幻灯片都需要一个视觉元素**——图片、图表、图标或形状。纯文字幻灯片让人过目即忘。

**布局选择：**
- 两栏式（左侧文字、右侧插图）
- 图标 + 文字行（彩色圆里的图标、粗体标题、下方描述）
- 2x2 或 2x3 网格（一侧放图片，另一侧排内容块）
- 半出血图片（占满左半或右半）配合内容叠加

**数据展示：**
- 醒目数据卡片（60-72pt 的大数字，下面配小号标签）
- 对比栏（前后对比、优缺点、并排选项）
- 时间线或流程图（带编号的步骤、箭头）

**视觉细节：**
- 章节标题旁配上小号彩色圆形里的图标
- 关键数据或标语使用斜体作为点缀

### 字体排版

**挑一组有意思的字体搭配**——别图省事用 Arial。标题字体要有个性，正文字体要简洁。

| 标题字体 | 正文字体 |
|-------------|-----------|
| Georgia | Calibri |
| Arial Black | Arial |
| Calibri | Calibri Light |
| Cambria | Calibri |
| Trebuchet MS | Calibri |
| Impact | Arial |
| Palatino | Garamond |
| Consolas | Calibri |

| 元素 | 字号 |
|---------|------|
| 幻灯片标题 | 36-44pt 粗体 |
| 章节标题 | 20-24pt 粗体 |
| 正文 | 14-16pt |
| 注释 | 10-12pt 灰度处理 |

### 间距

- 最小边距 0.5"
- 内容块之间留 0.3-0.5"
- 留出呼吸空间——不要把每一寸都填满

### 应避免的常见错误

- **不要重复同一种布局**——在不同幻灯片之间变换栏、卡片和数据卡片
- **不要居中正文**——段落和列表左对齐；只有标题才居中
- **不要吝啬字号对比**——标题至少 36pt，才能从 14-16pt 的正文中突出出来
- **不要默认用蓝色**——选择能反映具体主题的颜色
- **不要随意混用间距**——选定 0.3" 或 0.5" 间距，并保持一致
- **不要只装饰一张幻灯片而让其余保持朴素**——要么贯彻到底，要么从头到尾保持简洁
- **不要做纯文字幻灯片**——加入图片、图标、图表或视觉元素；避免"标题 + 项目符号"的简单堆砌
- **不要忘记文本框的内边距**——当让线条或形状与文本边缘对齐时，把文本框的 `margin: 0` 设上，或者偏移形状以抵消内边距
- **不要使用低对比度元素**——图标和文字都需要与背景形成强烈对比；避免浅色背景上的浅色文字，或深色背景上的深色文字
- **不要让文本框太窄**——否则会出现过多换行
- **绝对不要在标题下加装饰线**——这是 AI 生成幻灯片的典型标志；用留白或背景色代替

---

## 质量检查（必做）

**先假定一定有问题。你的任务是把它们找出来。**

第一次渲染几乎不可能完美。把 QA 当作捉虫，而不是确认。如果你第一眼就觉得"零问题"，那说明你没认真看。

### 内容 QA

```bash
python -m markitdown output.pptx
```

检查是否有内容缺失、错别字、顺序错误。

**使用模板时，检查残留的占位文本：**

```bash
python -m markitdown output.pptx | grep -iE "xxxx|lorem|ipsum|this.*(page|slide).*layout"
```

如果 grep 有结果，必须先修复再宣布完成。

### 视觉 QA

**⚠️ 使用 subagent**——哪怕只有 2-3 张幻灯片也要用。你已经盯着代码看太久，会"看到"你期望看到的而不是实际呈现的。subagent 视角更新鲜。

把幻灯片转成图片（参见 [转换为图片](#converting-to-images)），然后使用以下 prompt：

```
Visually inspect these slides. Assume there are issues — find them.

Look for:
- Overlapping elements (text through shapes, lines through words, stacked elements)
- Text overflow or cut off at edges/box boundaries
- Decorative lines positioned for single-line text but title wrapped to two lines
- Source citations or footers colliding with content above
- Elements too close (< 0.3" gaps) or cards/sections nearly touching
- Uneven gaps (large empty area in one place, cramped in another)
- Insufficient margin from slide edges (< 0.5")
- Columns or similar elements not aligned consistently
- Low-contrast text (e.g., light gray text on cream-colored background)
- Low-contrast icons (e.g., dark icons on dark backgrounds without a contrasting circle)
- Text boxes too narrow causing excessive wrapping
- Leftover placeholder content

For each slide, list issues or areas of concern, even if minor.

Read and analyze these images:
1. /path/to/slide-01.jpg (Expected: [brief description])
2. /path/to/slide-02.jpg (Expected: [brief description])

Report ALL issues found, including minor ones.
```

### 校验循环

1. 生成幻灯片 → 转图片 → 检查
2. **列出发现的问题**（如果没发现，再用更挑剔的眼光看一遍）
3. 修复问题
4. **重新校验受影响的幻灯片**——一次修复常常会引出新的问题
5. 反复迭代，直到一次完整检查不再产生新问题

**至少完成一次"修复 → 校验"循环之前，不能宣布完成。**

---

## 转换为图片

把演示文稿转成单张幻灯片图片以便视觉检查：

```bash
python scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
```

这会生成 `slide-01.jpg`、`slide-02.jpg` 等文件。

修复后需要重新渲染特定幻灯片时：

```bash
pdftoppm -jpeg -r 150 -f N -l N output.pdf slide-fixed
```

---

## 依赖

- `pip install "markitdown[pptx]"` - 文本提取
- `pip install Pillow` - 缩略图网格
- `npm install -g pptxgenjs` - 从零创建
- LibreOffice (`soffice`) - PDF 转换（通过 `scripts/office/soffice.py` 自动适配沙箱环境）
- Poppler (`pdftoppm`) - PDF 转图片
