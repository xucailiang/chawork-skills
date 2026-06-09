---
name: xlsx
description: >-
  当电子表格文件作为主要输入或输出时使用此 skill。这包括用户希望执行以下操作的任何任务：打开、读取、编辑或修复已有的 .xlsx、.xlsm、.csv
  或 .tsv
  文件（例如添加列、计算公式、格式化、生成图表、清理脏数据）；从零开始或基于其他数据源创建新的电子表格；或在不同表格文件格式之间进行转换。当用户通过名称或路径引用电子表格文件时——哪怕只是随口一提（比如"我下载目录里那个
  xlsx"）——并希望对其进行处理或基于其产出内容时，尤其需要触发。对于将杂乱的表格数据文件（格式错乱的行、错位的表头、垃圾数据）清理或重构为规范电子表格的场景，同样需要触发。最终交付物必须是电子表格文件。当主要交付物是
  Word 文档、HTML 报告、独立 Python 脚本、数据库管道或 Google Sheets API 集成时，不要触发，即使涉及表格数据。
license: Proprietary. LICENSE.txt has complete terms
original_description: >-
  Use this skill any time a spreadsheet file is the primary input or output.
  This means any task where the user wants to: open, read, edit, or fix an
  existing .xlsx, .xlsm, .csv, or .tsv file (e.g., adding columns, computing
  formulas, formatting, charting, cleaning messy data); create a new spreadsheet
  from scratch or from other data sources; or convert between tabular file
  formats. Trigger especially when the user references a spreadsheet file by
  name or path — even casually (like "the xlsx in my downloads") — and wants
  something done to it or produced from it. Also trigger for cleaning or
  restructuring messy tabular data files (malformed rows, misplaced headers,
  junk data) into proper spreadsheets. The deliverable must be a spreadsheet
  file. Do NOT trigger when the primary deliverable is a Word document, HTML
  report, standalone Python script, database pipeline, or Google Sheets API
  integration, even if tabular data is involved.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:08:22.288Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# 输出要求

## 所有 Excel 文件

### 专业字体
- 除非用户另有指示，否则所有交付物均使用统一、专业的字体（如 Arial、Times New Roman）

### 零公式错误
- 每个 Excel 模型在交付时必须做到零公式错误（#REF!、#DIV/0!、#VALUE!、#N/A、#NAME?）

### 保留已有模板（更新模板时）
- 修改文件时，应认真研究并严格遵循已有的格式、样式与约定
- 切勿在已有既定模式的文件上强行套用标准化格式
- 已有模板约定永远优先于本指南

## 财务模型

### 颜色编码规范
除非用户或已有模板另有规定

#### 行业标准颜色约定
- **蓝色文本 (RGB: 0,0,255)**：硬编码输入项，以及用户会在不同情景下修改的数字
- **黑色文本 (RGB: 0,0,0)**：所有公式与计算
- **绿色文本 (RGB: 0,128,0)**：从同一工作簿内其他工作表引用的链接
- **红色文本 (RGB: 255,0,0)**：指向其他文件的外部链接
- **黄色背景 (RGB: 255,255,0)**：需要重点关注的关键假设，或需要更新的单元格

### 数字格式规范

#### 必备格式规则
- **年份**：以文本字符串格式呈现（如 "2024"，而非 "2,024"）
- **货币**：使用 $#,##0 格式；在表头中**始终**注明单位（如 "Revenue ($mm)"）
- **零值**：使用数字格式将所有零显示为 "-"，百分比同样适用（如 "$#,##0;($#,##0);-"）
- **百分比**：默认使用 0.0% 格式（保留一位小数）
- **倍数**：估值倍数（EV/EBITDA、P/E）使用 0.0x 格式
- **负数**：使用括号 (123) 而非负号 -123

### 公式构建规则

#### 假设的位置
- 将**所有**假设（增长率、利润率、倍数等）放在独立的假设单元格中
- 公式中使用单元格引用，而非硬编码数值
- 例：使用 =B5*(1+$B$6) 而非 =B5*1.05

#### 公式错误预防
- 校验所有单元格引用是否正确
- 检查区间是否存在差一错误（off-by-one）
- 确保所有预测期间的公式保持一致
- 用边界情形（零值、负值）进行测试
- 校验是否存在意料之外的循环引用

#### 硬编码的文档化要求
- 在单元格中加批注，或在旁边单元格中说明（若位于表格末尾）。格式："Source: [System/Document], [Date], [Specific Reference], [URL if applicable]"
- 示例：
  - "Source: Company 10-K, FY2024, Page 45, Revenue Note, [SEC EDGAR URL]"
  - "Source: Company 10-Q, Q2 2025, Exhibit 99.1, [SEC EDGAR URL]"
  - "Source: Bloomberg Terminal, 8/15/2025, AAPL US Equity"
  - "Source: FactSet, 8/20/2025, Consensus Estimates Screen"

# XLSX 文件的创建、编辑与分析

## 概述

用户可能要求你创建、编辑或分析 .xlsx 文件的内容。针对不同任务，你可以使用不同的工具和工作流。

## 重要前置条件

**公式重算需要 LibreOffice**：你可以假定系统已安装 LibreOffice，用于通过 `scripts/recalc.py` 脚本重新计算公式值。该脚本在首次运行时会自动完成 LibreOffice 的配置，包括在沙箱环境中 Unix socket 受限的场景下（由 `scripts/office/soffice.py` 处理）。

## 读取与分析数据

### 使用 pandas 进行数据分析
对于数据分析、可视化以及基础操作，请使用 **pandas**，它提供了强大的数据处理能力：

```python
import pandas as pd

# Read Excel
df = pd.read_excel('file.xlsx')  # Default: first sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)  # All sheets as dict

# Analyze
df.head()      # Preview data
df.info()      # Column info
df.describe()  # Statistics

# Write Excel
df.to_excel('output.xlsx', index=False)
```

## Excel 文件工作流

## 关键原则：使用公式，而非硬编码数值

**永远使用 Excel 公式，而不要在 Python 中算好结果再硬编码进去。** 这样可以保证电子表格保持动态、可更新。

### ❌ 错误示例 —— 硬编码计算结果
```python
# Bad: Calculating in Python and hardcoding result
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcodes 5000

# Bad: Computing growth rate in Python
growth = (df.iloc[-1]['Revenue'] - df.iloc[0]['Revenue']) / df.iloc[0]['Revenue']
sheet['C5'] = growth  # Hardcodes 0.15

# Bad: Python calculation for average
avg = sum(values) / len(values)
sheet['D20'] = avg  # Hardcodes 42.5
```

### ✅ 正确示例 —— 使用 Excel 公式
```python
# Good: Let Excel calculate the sum
sheet['B10'] = '=SUM(B2:B9)'

# Good: Growth rate as Excel formula
sheet['C5'] = '=(C4-C2)/C2'

# Good: Average using Excel function
sheet['D20'] = '=AVERAGE(D2:D19)'
```

该原则适用于**所有**计算 —— 合计、百分比、比率、差额等等。当源数据变化时，电子表格应能自动重新计算。

## 通用工作流
1. **选择工具**：数据处理用 pandas，公式/格式用 openpyxl
2. **创建/加载**：新建工作簿或加载已有文件
3. **修改**：添加/编辑数据、公式和格式
4. **保存**：写入文件
5. **重算公式（如使用公式，则为必做）**：使用 scripts/recalc.py 脚本
   ```bash
   python scripts/recalc.py output.xlsx
   ```
6. **校验并修复错误**：
   - 脚本以 JSON 形式返回错误详情
   - 如果 `status` 为 `errors_found`，请查看 `error_summary` 了解具体错误类型与位置
   - 修复识别出的错误后重新运行
   - 常见需修复的错误：
     - `#REF!`：无效的单元格引用
     - `#DIV/0!`：除以零
     - `#VALUE!`：公式中数据类型错误
     - `#NAME?`：无法识别的公式名称

### 创建新的 Excel 文件

```python
# Using openpyxl for formulas and formatting
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active

# Add data
sheet['A1'] = 'Hello'
sheet['B1'] = 'World'
sheet.append(['Row', 'of', 'data'])

# Add formula
sheet['B2'] = '=SUM(A1:A10)'

# Formatting
sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet['A1'].alignment = Alignment(horizontal='center')

# Column width
sheet.column_dimensions['A'].width = 20

wb.save('output.xlsx')
```

### 编辑已有 Excel 文件

```python
# Using openpyxl to preserve formulas and formatting
from openpyxl import load_workbook

# Load existing file
wb = load_workbook('existing.xlsx')
sheet = wb.active  # or wb['SheetName'] for specific sheet

# Working with multiple sheets
for sheet_name in wb.sheetnames:
    sheet = wb[sheet_name]
    print(f"Sheet: {sheet_name}")

# Modify cells
sheet['A1'] = 'New Value'
sheet.insert_rows(2)  # Insert row at position 2
sheet.delete_cols(3)  # Delete column 3

# Add new sheet
new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

## 重算公式

由 openpyxl 创建或修改的 Excel 文件中，公式以字符串形式存在，但没有计算结果。请使用提供的 `scripts/recalc.py` 脚本来重算公式：

```bash
python scripts/recalc.py <excel_file> [timeout_seconds]
```

示例：
```bash
python scripts/recalc.py output.xlsx 30
```

该脚本会：
- 在首次运行时自动配置 LibreOffice 宏
- 重算所有工作表中的全部公式
- 扫描**所有**单元格，检查 Excel 错误（#REF!、#DIV/0! 等）
- 以 JSON 返回详细的错误位置与计数
- 同时支持 Linux 与 macOS

## 公式校验清单

确保公式正确运行的快速检查项：

### 必备校验
- [ ] **抽样测试 2–3 个引用**：构建完整模型前，先确认它们能取到正确数值
- [ ] **列号映射**：确认 Excel 列号匹配（例如第 64 列是 BL，而非 BK）
- [ ] **行号偏移**：注意 Excel 行号从 1 开始（DataFrame 的第 5 行对应 Excel 的第 6 行）

### 常见陷阱
- [ ] **NaN 处理**：使用 `pd.notna()` 检查空值
- [ ] **靠右的列**：财年数据常出现在第 50 列之后
- [ ] **多处匹配**：搜索所有出现位置，不只是首个
- [ ] **除以零**：在公式中使用 `/` 之前先检查分母（#DIV/0!）
- [ ] **错误引用**：校验所有单元格引用是否指向预期位置（#REF!）
- [ ] **跨表引用**：跨表链接使用正确的格式（Sheet1!A1）

### 公式测试策略
- [ ] **先小后大**：先在 2–3 个单元格上测试公式，再大范围应用
- [ ] **校验依赖**：确认公式中引用的所有单元格都存在
- [ ] **覆盖边界场景**：包含零值、负值与非常大的数值

### 解读 scripts/recalc.py 的输出
脚本以 JSON 形式返回错误详情：
```json
{
  "status": "success",           // or "errors_found"
  "total_errors": 0,              // Total error count
  "total_formulas": 42,           // Number of formulas in file
  "error_summary": {              // Only present if errors found
    "#REF!": {
      "count": 2,
      "locations": ["Sheet1!B5", "Sheet1!C10"]
    }
  }
}
```

## 最佳实践

### 库选型
- **pandas**：最适合数据分析、批量操作以及简单的数据导出
- **openpyxl**：最适合复杂的格式、公式以及 Excel 特有功能

### 使用 openpyxl
- 单元格索引从 1 开始（row=1、column=1 指向 A1）
- 使用 `data_only=True` 读取计算后的值：`load_workbook('file.xlsx', data_only=True)`
- **警告**：若以 `data_only=True` 打开后保存，公式会被替换为数值，并永久丢失
- 处理大文件时：读取用 `read_only=True`，写入用 `write_only=True`
- 公式会被保留，但不会被求值 —— 请使用 scripts/recalc.py 更新结果值

### 使用 pandas
- 指定数据类型以避免类型推断问题：`pd.read_excel('file.xlsx', dtype={'id': str})`
- 对于大文件，只读取需要的列：`pd.read_excel('file.xlsx', usecols=['A', 'C', 'E'])`
- 妥善处理日期：`pd.read_excel('file.xlsx', parse_dates=['date_column'])`

## 代码风格指引
**重要**：在为 Excel 操作生成 Python 代码时：
- 写出精炼、简洁的 Python 代码，避免不必要的注释
- 避免冗长的变量名和多余的操作
- 避免不必要的 print 语句

**对于 Excel 文件本身**：
- 在含有复杂公式或重要假设的单元格添加批注
- 为硬编码值标注数据来源
- 在关键计算与模型分区中加上说明性备注
