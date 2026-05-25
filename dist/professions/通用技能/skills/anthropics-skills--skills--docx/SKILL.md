---
name: docx
description: >-
  当用户需要创建、读取、编辑或操作 Word 文档（.docx 文件）时使用此 skill。触发场景包括：任何提及 'Word doc'、'word
  document'、'.docx' 的请求，或需要生成带有目录、标题、页码、信头等格式的专业文档。同样适用于从 .docx
  文件中提取或重组内容、在文档中插入或替换图片、在 Word 文件中执行查找替换、处理修订追踪或批注，以及将内容转换为精美的 Word 文档。如果用户要求以
  Word 或 .docx 格式交付 'report'、'memo'、'letter'、'template' 或类似产物，请使用此 skill。不要用于
  PDF、电子表格、Google Docs，或与文档生成无关的通用编码任务。
license: Proprietary. LICENSE.txt has complete terms
original_description: >-
  Use this skill whenever the user wants to create, read, edit, or manipulate
  Word documents (.docx files). Triggers include: any mention of 'Word doc',
  'word document', '.docx', or requests to produce professional documents with
  formatting like tables of contents, headings, page numbers, or letterheads.
  Also use when extracting or reorganizing content from .docx files, inserting
  or replacing images in documents, performing find-and-replace in Word files,
  working with tracked changes or comments, or converting content into a
  polished Word document. If the user asks for a 'report', 'memo', 'letter',
  'template', or similar deliverable as a Word or .docx file, use this skill. Do
  NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated
  to document generation.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T11:57:43.960Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# DOCX 创建、编辑与分析

## 概览

`.docx` 文件本质上是一个包含 XML 文件的 ZIP 压缩包。

## 快速参考

| 任务 | 处理方式 |
|------|----------|
| 读取/分析内容 | 使用 `pandoc` 或解包查看原始 XML |
| 创建新文档 | 使用 `docx-js`——见下文「创建新文档」 |
| 编辑已有文档 | 解包 → 编辑 XML → 重新打包——见下文「编辑已有文档」 |

### 将 .doc 转换为 .docx

旧版 `.doc` 文件在编辑前必须先转换：

```bash
python scripts/office/soffice.py --headless --convert-to docx document.doc
```

### 读取内容

```bash
# 提取文本，包含修订记录
pandoc --track-changes=all document.docx -o output.md

# 访问原始 XML
python scripts/office/unpack.py document.docx unpacked/
```

### 转换为图片

```bash
python scripts/office/soffice.py --headless --convert-to pdf document.docx
pdftoppm -jpeg -r 150 document.pdf page
```

### 接受修订

要生成一份接受所有修订后的干净文档（需要 LibreOffice）：

```bash
python scripts/accept_changes.py input.docx output.docx
```

---

## 创建新文档

用 JavaScript 生成 `.docx` 文件，然后进行校验。安装命令：`npm install -g docx`

### 初始化
```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
        Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
        InternalHyperlink, Bookmark, FootnoteReferenceRun, PositionalTab,
        PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader,
        TabStopType, TabStopPosition, Column, SectionType,
        TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
        VerticalAlign, PageNumber, PageBreak } = require('docx');

const doc = new Document({ sections: [{ children: [/* content */] }] });
Packer.toBuffer(doc).then(buffer => fs.writeFileSync("doc.docx", buffer));
```

### 校验
创建文件后请务必校验。如果校验失败，解包修复 XML 后再重新打包。
```bash
python scripts/office/validate.py doc.docx
```

### 页面尺寸

```javascript
// CRITICAL: docx-js defaults to A4, not US Letter
// Always set page size explicitly for consistent results
sections: [{
  properties: {
    page: {
      size: {
        width: 12240,   // 8.5 inches in DXA
        height: 15840   // 11 inches in DXA
      },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
    }
  },
  children: [/* content */]
}]
```

**常见页面尺寸（DXA 单位，1440 DXA = 1 英寸）：**

| 纸张 | 宽度 | 高度 | 正文宽度（1 英寸页边距） |
|-------|-------|--------|---------------------------|
| US Letter | 12,240 | 15,840 | 9,360 |
| A4（默认） | 11,906 | 16,838 | 9,026 |

**横向页面：** docx-js 会在内部自动交换宽高，因此传入时仍按纵向尺寸给出，让它自己处理交换：
```javascript
size: {
  width: 12240,   // Pass SHORT edge as width
  height: 15840,  // Pass LONG edge as height
  orientation: PageOrientation.LANDSCAPE  // docx-js swaps them in the XML
},
// Content width = 15840 - left margin - right margin (uses the long edge)
```

### 样式（覆盖内置标题样式）

将 Arial 作为默认字体（兼容性最好）。标题保持黑色以保证可读性。

```javascript
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } }, // 12pt default
    paragraphStyles: [
      // IMPORTANT: Use exact IDs to override built-in styles
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } }, // outlineLevel required for TOC
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Title")] }),
    ]
  }]
});
```

### 列表（绝不要使用 Unicode 项目符号）

```javascript
// ❌ WRONG - never manually insert bullet characters
new Paragraph({ children: [new TextRun("• Item")] })  // BAD
new Paragraph({ children: [new TextRun("\u2022 Item")] })  // BAD

// ✅ CORRECT - use numbering config with LevelFormat.BULLET
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Bullet item")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("Numbered item")] }),
    ]
  }]
});

// ⚠️ Each reference creates INDEPENDENT numbering
// Same reference = continues (1,2,3 then 4,5,6)
// Different reference = restarts (1,2,3 then 1,2,3)
```

### 表格

**关键：表格需要双重宽度** —— 必须同时在表格上设置 `columnWidths`，并在每个单元格上设置 `width`。少了任意一个，表格在部分平台上会渲染异常。

```javascript
// CRITICAL: Always set table width for consistent rendering
// CRITICAL: Use ShadingType.CLEAR (not SOLID) to prevent black backgrounds
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

new Table({
  width: { size: 9360, type: WidthType.DXA }, // Always use DXA (percentages break in Google Docs)
  columnWidths: [4680, 4680], // Must sum to table width (DXA: 1440 = 1 inch)
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA }, // Also set on each cell
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR }, // CLEAR not SOLID
          margins: { top: 80, bottom: 80, left: 120, right: 120 }, // Cell padding (internal, not added to width)
          children: [new Paragraph({ children: [new TextRun("Cell")] })]
        })
      ]
    })
  ]
})
```

**表格宽度计算：**

请始终使用 `WidthType.DXA`，`WidthType.PERCENTAGE` 在 Google Docs 中会出问题。

```javascript
// Table width = sum of columnWidths = content width
// US Letter with 1" margins: 12240 - 2880 = 9360 DXA
width: { size: 9360, type: WidthType.DXA },
columnWidths: [7000, 2360]  // Must sum to table width
```

**宽度规则：**
- **始终使用 `WidthType.DXA`** —— 切勿使用 `WidthType.PERCENTAGE`（与 Google Docs 不兼容）
- 表格宽度必须等于 `columnWidths` 之和
- 单元格 `width` 必须与对应的 `columnWidth` 一致
- 单元格 `margins` 是内边距 —— 它们占用的是内容区域，不会增加单元格宽度
- 整页宽度的表格：使用正文宽度（页面宽度减去左右页边距）

### 图片

```javascript
// CRITICAL: type parameter is REQUIRED
new Paragraph({
  children: [new ImageRun({
    type: "png", // Required: png, jpg, jpeg, gif, bmp, svg
    data: fs.readFileSync("image.png"),
    transformation: { width: 200, height: 150 },
    altText: { title: "Title", description: "Desc", name: "Name" } // All three required
  })]
})
```

### 分页符

```javascript
// CRITICAL: PageBreak must be inside a Paragraph
new Paragraph({ children: [new PageBreak()] })

// Or use pageBreakBefore
new Paragraph({ pageBreakBefore: true, children: [new TextRun("New page")] })
```

### 超链接

```javascript
// External link
new Paragraph({
  children: [new ExternalHyperlink({
    children: [new TextRun({ text: "Click here", style: "Hyperlink" })],
    link: "https://example.com",
  })]
})

// Internal link (bookmark + reference)
// 1. Create bookmark at destination
new Paragraph({ heading: HeadingLevel.HEADING_1, children: [
  new Bookmark({ id: "chapter1", children: [new TextRun("Chapter 1")] }),
]})
// 2. Link to it
new Paragraph({ children: [new InternalHyperlink({
  children: [new TextRun({ text: "See Chapter 1", style: "Hyperlink" })],
  anchor: "chapter1",
})]})
```

### 脚注

```javascript
const doc = new Document({
  footnotes: {
    1: { children: [new Paragraph("Source: Annual Report 2024")] },
    2: { children: [new Paragraph("See appendix for methodology")] },
  },
  sections: [{
    children: [new Paragraph({
      children: [
        new TextRun("Revenue grew 15%"),
        new FootnoteReferenceRun(1),
        new TextRun(" using adjusted metrics"),
        new FootnoteReferenceRun(2),
      ],
    })]
  }]
});
```

### 制表位

```javascript
// Right-align text on same line (e.g., date opposite a title)
new Paragraph({
  children: [
    new TextRun("Company Name"),
    new TextRun("\tJanuary 2025"),
  ],
  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
})

// Dot leader (e.g., TOC-style)
new Paragraph({
  children: [
    new TextRun("Introduction"),
    new TextRun({ children: [
      new PositionalTab({
        alignment: PositionalTabAlignment.RIGHT,
        relativeTo: PositionalTabRelativeTo.MARGIN,
        leader: PositionalTabLeader.DOT,
      }),
      "3",
    ]}),
  ],
})
```

### 多栏排版

```javascript
// Equal-width columns
sections: [{
  properties: {
    column: {
      count: 2,          // number of columns
      space: 720,        // gap between columns in DXA (720 = 0.5 inch)
      equalWidth: true,
      separate: true,    // vertical line between columns
    },
  },
  children: [/* content flows naturally across columns */]
}]

// Custom-width columns (equalWidth must be false)
sections: [{
  properties: {
    column: {
      equalWidth: false,
      children: [
        new Column({ width: 5400, space: 720 }),
        new Column({ width: 3240 }),
      ],
    },
  },
  children: [/* content */]
}]
```

通过新建一个 `type: SectionType.NEXT_COLUMN` 的小节来强制分栏。

### 目录

```javascript
// CRITICAL: Headings must use HeadingLevel ONLY - no custom styles
new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })
```

### 页眉/页脚

```javascript
sections: [{
  properties: {
    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } // 1440 = 1 inch
  },
  headers: {
    default: new Header({ children: [new Paragraph({ children: [new TextRun("Header")] })] })
  },
  footers: {
    default: new Footer({ children: [new Paragraph({
      children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })]
    })] })
  },
  children: [/* content */]
}]
```

### docx-js 关键规则

- **显式设置页面尺寸** —— docx-js 默认 A4；面向美国的文档请使用 US Letter（12240 x 15840 DXA）
- **横向页面仍传入纵向尺寸** —— docx-js 会在内部交换宽高；将短边作为 `width`、长边作为 `height`，并设置 `orientation: PageOrientation.LANDSCAPE`
- **绝不要使用 `\n`** —— 改用独立的 Paragraph 元素
- **绝不要使用 Unicode 项目符号** —— 改用 `LevelFormat.BULLET` 配合 numbering 配置
- **PageBreak 必须放在 Paragraph 内** —— 单独使用会生成非法 XML
- **ImageRun 必须指定 `type`** —— 务必传入 png/jpg 等
- **表格 `width` 始终使用 DXA** —— 切勿使用 `WidthType.PERCENTAGE`（在 Google Docs 中会失效）
- **表格需要双重宽度** —— `columnWidths` 数组与单元格 `width` 必须同时设置，且数值一致
- **表格宽度 = columnWidths 之和** —— 使用 DXA 时务必保证两者完全相等
- **始终设置单元格内边距** —— 使用 `margins: { top: 80, bottom: 80, left: 120, right: 120 }` 以获得可读的留白
- **使用 `ShadingType.CLEAR`** —— 表格底纹切勿使用 SOLID
- **不要用表格来做分隔线** —— 单元格有最小高度，会渲染为空白矩形（在页眉页脚里也一样）；应改用 Paragraph 的下边框：`border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } }`。对于两栏式页脚，请使用制表位（见「制表位」一节），而非表格
- **目录仅识别 HeadingLevel** —— 标题段落不要使用自定义样式
- **覆盖内置样式** —— 使用确切的 ID："Heading1"、"Heading2" 等
- **必须包含 `outlineLevel`** —— 目录依赖它（H1 用 0，H2 用 1，以此类推）

---

## 编辑已有文档

**严格按顺序执行以下 3 个步骤。**

### 第 1 步：解包
```bash
python scripts/office/unpack.py document.docx unpacked/
```
该命令会提取 XML、美化格式、合并相邻的 run，并将智能引号转换为 XML 实体（`&#x201C;` 等），以便在编辑过程中保留这些字符。使用 `--merge-runs false` 可跳过 run 合并。

### 第 2 步：编辑 XML

编辑 `unpacked/word/` 下的文件。XML 模式见下文「XML 参考」。

**修订记录和评论默认使用 "Claude" 作为作者**，除非用户明确要求使用其他名称。

**请直接使用 Edit 工具进行字符串替换，不要写 Python 脚本。** 脚本会引入不必要的复杂度。Edit 工具会明确展示被替换的内容。

**关键：新增内容请使用智能引号。** 添加包含撇号或引号的文本时，使用 XML 实体以生成排版正确的智能引号：
```xml
<!-- Use these entities for professional typography -->
<w:t>Here&#x2019;s a quote: &#x201C;Hello&#x201D;</w:t>
```
| 实体 | 字符 |
|--------|-----------|
| `&#x2018;` | ‘（左单引号） |
| `&#x2019;` | ’（右单引号 / 撇号） |
| `&#x201C;` | “（左双引号） |
| `&#x201D;` | ”（右双引号） |

**添加评论：** 使用 `comment.py` 处理跨多个 XML 文件的样板内容（文本必须预先转义为 XML）：
```bash
python scripts/comment.py unpacked/ 0 "Comment text with &amp; and &#x2019;"
python scripts/comment.py unpacked/ 1 "Reply text" --parent 0  # reply to comment 0
python scripts/comment.py unpacked/ 0 "Text" --author "Custom Author"  # custom author name
```
然后将相应的标记加到 document.xml 中（详见「XML 参考」中的「评论」部分）。

### 第 3 步：打包
```bash
python scripts/office/pack.py unpacked/ output.docx --original document.docx
```
该命令会进行自动修复校验、压缩 XML，并生成 DOCX。使用 `--validate false` 可跳过校验。

**自动修复可处理：**
- `durableId` >= 0x7FFFFFFF（重新生成合法 ID）
- 含空白字符的 `<w:t>` 缺失 `xml:space="preserve"`

**自动修复无法处理：**
- 格式错误的 XML、非法的元素嵌套、缺失的关系定义、违反 schema 的内容

### 常见陷阱

- **必须替换完整的 `<w:r>` 元素**：添加修订记录时，把整个 `<w:r>...</w:r>` 块替换为并列的 `<w:del>...<w:ins>...`。不要把修订标签塞进 run 内部。
- **保留 `<w:rPr>` 格式**：把原始 run 的 `<w:rPr>` 块复制到新生成的修订 run 中，以保持粗体、字号等格式。

---

## XML 参考

### Schema 合规性

- **`<w:pPr>` 中的元素顺序**：`<w:pStyle>`、`<w:numPr>`、`<w:spacing>`、`<w:ind>`、`<w:jc>`，`<w:rPr>` 放最后
- **空白字符**：含前后空白的 `<w:t>` 必须加上 `xml:space="preserve"`
- **RSID**：必须是 8 位十六进制（例如 `00AB1234`）

### 修订记录

**插入：**
```xml
<w:ins w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:t>inserted text</w:t></w:r>
</w:ins>
```

**删除：**
```xml
<w:del w:id="2" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>deleted text</w:delText></w:r>
</w:del>
```

**在 `<w:del>` 内部**：用 `<w:delText>` 替代 `<w:t>`，用 `<w:delInstrText>` 替代 `<w:instrText>`。

**最小化修订** —— 只标记真正发生变化的部分：
```xml
<!-- Change "30 days" to "60 days" -->
<w:r><w:t>The term is </w:t></w:r>
<w:del w:id="1" w:author="Claude" w:date="...">
  <w:r><w:delText>30</w:delText></w:r>
</w:del>
<w:ins w:id="2" w:author="Claude" w:date="...">
  <w:r><w:t>60</w:t></w:r>
</w:ins>
<w:r><w:t> days.</w:t></w:r>
```

**删除整段或整个列表项** —— 当移除一段中的全部内容时，还需要将段落标记本身标为已删除，使其与下一段合并。在 `<w:pPr><w:rPr>` 中加入 `<w:del/>`：
```xml
<w:p>
  <w:pPr>
    <w:numPr>...</w:numPr>  <!-- list numbering if present -->
    <w:rPr>
      <w:del w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z"/>
    </w:rPr>
  </w:pPr>
  <w:del w:id="2" w:author="Claude" w:date="2025-01-01T00:00:00Z">
    <w:r><w:delText>Entire paragraph content being deleted...</w:delText></w:r>
  </w:del>
</w:p>
```
如果不在 `<w:pPr><w:rPr>` 中加入 `<w:del/>`，接受修订后会留下一个空段落或空列表项。

**拒绝其他作者的插入** —— 在他们的插入元素内嵌套一个删除元素：
```xml
<w:ins w:author="Jane" w:id="5">
  <w:del w:author="Claude" w:id="10">
    <w:r><w:delText>their inserted text</w:delText></w:r>
  </w:del>
</w:ins>
```

**还原其他作者的删除** —— 在他们的删除之后追加一个插入（不要去改动他们的删除元素）：
```xml
<w:del w:author="Jane" w:id="5">
  <w:r><w:delText>deleted text</w:delText></w:r>
</w:del>
<w:ins w:author="Claude" w:id="10">
  <w:r><w:t>deleted text</w:t></w:r>
</w:ins>
```

### 评论

运行完 `comment.py` 后（见第 2 步），向 document.xml 中添加标记。如果是回复，使用 `--parent` 参数，并将子标记嵌套在父标记内部。

**关键：`<w:commentRangeStart>` 和 `<w:commentRangeEnd>` 是 `<w:r>` 的兄弟节点，绝不能放在 `<w:r>` 内部。**

```xml
<!-- Comment markers are direct children of w:p, never inside w:r -->
<w:commentRangeStart w:id="0"/>
<w:del w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>deleted</w:delText></w:r>
</w:del>
<w:r><w:t> more text</w:t></w:r>
<w:commentRangeEnd w:id="0"/>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>

<!-- Comment 0 with reply 1 nested inside -->
<w:commentRangeStart w:id="0"/>
  <w:commentRangeStart w:id="1"/>
  <w:r><w:t>text</w:t></w:r>
  <w:commentRangeEnd w:id="1"/>
<w:commentRangeEnd w:id="0"/>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="1"/></w:r>
```

### 图片

1. 将图片文件放入 `word/media/`
2. 在 `word/_rels/document.xml.rels` 中添加关系：
```xml
<Relationship Id="rId5" Type=".../image" Target="media/image1.png"/>
```
3. 在 `[Content_Types].xml` 中添加内容类型：
```xml
<Default Extension="png" ContentType="image/png"/>
```
4. 在 document.xml 中引用：
```xml
<w:drawing>
  <wp:inline>
    <wp:extent cx="914400" cy="914400"/>  <!-- EMUs: 914400 = 1 inch -->
    <a:graphic>
      <a:graphicData uri=".../picture">
        <pic:pic>
          <pic:blipFill><a:blip r:embed="rId5"/></pic:blipFill>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing>
```

---

## 依赖

- **pandoc**：文本提取
- **docx**：`npm install -g docx`（用于创建新文档）
- **LibreOffice**：PDF 转换（`scripts/office/soffice.py` 已为沙箱环境自动配置）
- **Poppler**：`pdftoppm`，用于生成图片
