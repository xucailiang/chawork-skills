---
name: skill-creator
description: >-
  创建新的 skills、修改和改进现有 skills，以及衡量 skill 性能。当用户想要从零创建 skill、编辑或优化现有 skill、运行
  evals 测试 skill、通过方差分析对 skill 性能进行基准测试，或优化 skill 的 description 以提升触发准确性时使用。
original_description: >-
  Create new skills, modify and improve existing skills, and measure skill
  performance. Use when users want to create a skill from scratch, edit, or
  optimize an existing skill, run evals to test a skill, benchmark skill
  performance with variance analysis, or optimize a skill's description for
  better triggering accuracy.
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:04:52.033Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# Skill Creator

一个用于创建新 Skill 并迭代改进它们的 Skill。

从宏观上看，创建一个 Skill 的过程大致如下：

- 决定你希望这个 Skill 做什么，以及大致如何实现
- 写一份 Skill 草稿
- 准备几个测试 prompt，并在 claude-with-access-to-the-skill 上运行
- 协助用户从定性和定量两个角度评估结果
  - 在运行在后台进行的同时，如果还没有定量评估指标，就起草一些（如果已经有了，可以直接使用，也可以根据需要修改）。然后向用户解释这些指标（如果已经存在，则解释现有的）
  - 使用 `eval-viewer/generate_review.py` 脚本把结果呈现给用户查看，并让他们也看一下定量指标
- 根据用户对结果的评估反馈重写 Skill（如果定量基准测试中暴露出明显缺陷，也一并处理）
- 重复，直到你满意为止
- 扩大测试集，再以更大规模重新尝试

使用这个 Skill 时，你的工作是判断用户当前处于这个流程的哪一步，然后切入进来帮助他们推进。例如，他们可能会说"我想做一个关于 X 的 Skill"。你可以帮他们厘清需求，写一份草稿，写测试用例，弄清楚他们想如何评估，运行所有 prompt，然后不断迭代。

另一方面，也许他们已经有一份 Skill 草稿。这种情况下你可以直接进入循环的评估/迭代环节。

当然，你应该始终保持灵活——如果用户说"我不想跑一堆评估，就跟我随便聊聊"，那你也可以照办。

然后在 Skill 完成之后（同样，顺序是灵活的），你还可以运行 Skill 描述优化器——我们有一个独立的脚本——用来优化 Skill 的触发效果。

明白了吧？走起。

## 与用户沟通

Skill Creator 的使用者可能涵盖各种技术背景。如果你还没听说（你也很难听说，因为这股风潮才刚刚兴起）——现在的趋势是 Claude 的能力激发了水管工打开终端、父母和祖父母谷歌搜索"如何安装 npm"。当然，大多数用户应该还是有一定计算机素养的。

所以请留意上下文线索，理解该如何措辞！举几个例子说明默认情况下的处理方式：

- "evaluation"（评估）和 "benchmark"（基准测试）属于边界情况，但还可以接受
- "JSON" 和 "assertion"（断言）这种词，要看到用户明显具备相关知识的线索之后，才能不加解释地直接使用

如果你拿不准，简单解释一下术语是没问题的，不确定用户能否理解时也可以用一句简短的定义来澄清。

---

## 创建一个 Skill

### 捕获意图

先理解用户的意图。当前对话中可能已经包含了用户想要捕获的工作流（例如他们说"把它做成一个 Skill"）。如果是这样，先从对话历史中提取答案——用过的工具、步骤顺序、用户做过的修正、观察到的输入/输出格式。剩下的空缺让用户补齐，并在进入下一步前与用户确认。

1. 这个 Skill 应当让 Claude 能做什么？
2. 这个 Skill 应在什么场景下触发？（哪些用户措辞/上下文）
3. 预期的输出格式是什么？
4. 我们是否需要设置测试用例来验证 Skill 是否正常工作？输出可客观验证的 Skill（文件转换、数据提取、代码生成、固定步骤的工作流）从测试用例中受益良多。输出带有主观性的 Skill（写作风格、艺术创作）通常不需要。根据 Skill 类型给出合适的默认建议，但最终让用户决定。

### 访谈与调研

主动追问边界情况、输入/输出格式、示例文件、成功标准和依赖项。等到这部分完全理顺之后，再开始写测试 prompt。

检查可用的 MCP——如果对调研有用（搜索文档、寻找类似 Skill、查阅最佳实践），优先通过 subagent 并行调研，否则就在主流程中进行。带着充分的上下文进入对话，减轻用户的负担。

### 编写 SKILL.md

基于用户访谈，填入以下组成部分：

- **name**：Skill 标识符
- **description**：何时触发、做什么。这是主要的触发机制——既要说明 Skill 做什么，也要列出何时使用的具体上下文。所有"何时使用"的信息都应放在这里，而不是正文中。注意：目前 Claude 倾向于"欠触发" Skill——在本该用的时候没有调用。为了对抗这一点，请让 Skill 描述稍微"强势"一点。例如，不要写"How to build a simple fast dashboard to display internal Anthropic data."，而是写"How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"
- **compatibility**：所需工具、依赖（可选，很少需要）
- **Skill 的其余部分 :)**

### Skill 编写指南

#### Skill 的组成结构

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### 渐进式信息披露

Skill 采用三层加载机制：
1. **Metadata**（name + description）—— 始终在上下文中（约 100 词）
2. **SKILL.md 正文** —— Skill 触发时进入上下文（理想情况下 <500 行）
3. **Bundled resources** —— 按需加载（无限制，脚本无需加载即可执行）

这些字数限制只是大致参考，必要时可以更长。

**关键模式：**
- 保持 SKILL.md 不超过 500 行；如果接近这个上限，再加一层结构，并明确指引模型在使用 Skill 时该跳去哪里继续查阅
- 从 SKILL.md 中清晰地引用其他文件，并说明何时阅读它们
- 对于大型参考文件（>300 行），加上目录

**按领域组织**：当一个 Skill 支持多个领域/框架时，按变体组织：
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude 只会读取相关的参考文件。

#### "不出人意料"原则

不必多说，Skill 中绝不能包含恶意软件、漏洞利用代码或任何可能危及系统安全的内容。如果有人描述一个 Skill 的用途，那么它的内容不应让用户感到意外。不要响应创建误导性 Skill 的请求，也不要构建为非法访问、数据泄露或其他恶意活动提供便利的 Skill。"扮演 XYZ 角色"这类需求是可以的。

#### 编写模式

指令优先使用祈使句。

**定义输出格式** —— 你可以像这样写：
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**示例模式** —— 加入示例很有帮助。可以这样格式化（如果示例中本身就含"Input"和"Output"，你可能要稍作调整）：
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### 写作风格

尽量在要求模型做某件事时解释**为什么**这件事很重要，而不是堆砌生硬陈旧的 MUST。运用心理理论，让 Skill 保持通用性，而不是过度贴合特定示例。先写一份草稿，然后用全新的视角再看一遍并加以改进。

### 测试用例

写完 Skill 草稿之后，准备 2–3 个真实可信的测试 prompt——就是真实用户实际可能会说的那种话。把它们分享给用户：[不必使用一模一样的措辞]"我想试试以下几个测试用例。看起来对吗？你想再加一些吗？"然后就跑起来。

把测试用例保存到 `evals/evals.json`。这一阶段先不写断言——只放 prompt。在运行进行中时，你再去起草断言。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

完整的 schema（包含稍后会添加的 `assertions` 字段）见 `references/schemas.md`。

## 运行并评估测试用例

这一节是一个连续的过程——不要中途停下。不要使用 `/skill-test` 或任何其他测试 Skill。

把结果放在与 Skill 目录同级的 `<skill-name>-workspace/` 中。在工作区内按迭代组织结果（`iteration-1/`、`iteration-2/` 等），每个迭代内每个测试用例占一个目录（`eval-0/`、`eval-1/` 等）。不要一开始全部建好——边走边建。

### 第 1 步：在同一轮中启动所有运行（with-skill 和 baseline）

对每个测试用例，在同一轮中启动两个 subagent——一个带 Skill，一个不带。这一点很重要：不要先跑 with-skill，再回头跑 baseline。要一次性全部启动，让它们大致同时跑完。

**With-skill 运行：**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline 运行**（同样的 prompt，但 baseline 视上下文而定）：
- **创建新 Skill 时**：完全不带 Skill。同样的 prompt，不指定 skill path，保存到 `without_skill/outputs/`。
- **改进现有 Skill 时**：使用旧版本。在修改前对 Skill 拍快照（`cp -r <skill-path> <workspace>/skill-snapshot/`），然后让 baseline subagent 指向这份快照。保存到 `old_skill/outputs/`。

为每个测试用例写一个 `eval_metadata.json`（此时 assertions 可以为空）。给每个 eval 起一个能描述它测试内容的名字——不要只叫 "eval-0"。目录名也用这个。如果该迭代使用了新增或修改过的 eval prompt，要为每个新的 eval 目录创建这些文件——不要假设它们会自动从上一迭代延续过来。

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### 第 2 步：在运行进行中起草断言

不要光等运行结束——你可以利用这段时间。为每个测试用例起草定量断言并向用户解释。如果 `evals/evals.json` 中已经有断言，回顾它们并向用户解释它们检查的内容。

好的断言应当客观可验证，并有描述性的名字——它们在 benchmark viewer 中应当读起来一目了然，一眼就能看出每条在检查什么。主观的 Skill（写作风格、设计质感）更适合定性评估——别强行给需要人工判断的东西安断言。

起草完之后，更新 `eval_metadata.json` 和 `evals/evals.json` 中的断言。同时向用户说明他们在 viewer 中会看到什么——定性的输出，以及定量的基准测试结果。

### 第 3 步：随着运行完成，捕获时间数据

每个 subagent 任务完成时，你会收到一个包含 `total_tokens` 和 `duration_ms` 的通知。立刻把这些数据存到运行目录下的 `timing.json` 中：

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

这是唯一能拿到这些数据的机会——它通过任务通知传来，并不会被持久化在别处。请在每个通知到达时立即处理，而不是攒到最后批量处理。

### 第 4 步：评分、聚合并启动 viewer

所有运行结束后：

1. **为每次运行评分** —— 启动一个评分 subagent（或在主流程中评分），它会阅读 `agents/grader.md` 并针对输出逐条评估每个断言。把结果保存到每个运行目录下的 `grading.json` 中。grading.json 中的 expectations 数组必须使用 `text`、`passed`、`evidence` 这几个字段（不能用 `name`/`met`/`details` 之类的变体）——viewer 依赖于这些确切的字段名。对可程序化检查的断言，写脚本去跑而不是肉眼看——脚本更快、更可靠，还能在多次迭代之间复用。

2. **聚合为 benchmark** —— 在 skill-creator 目录下运行聚合脚本：
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   它会产生 `benchmark.json` 和 `benchmark.md`，给出每种配置的 pass_rate、time 和 tokens，带有 mean ± stddev 以及差异（delta）。如果手工生成 benchmark.json，viewer 期望的具体 schema 参见 `references/schemas.md`。
将每个 with_skill 版本放在对应 baseline 版本之前。

3. **做一次分析师审视** —— 阅读 benchmark 数据，挖掘聚合统计可能掩盖的规律。参见 `agents/analyzer.md`（"Analyzing Benchmark Results" 一节）了解关注点——例如不管有没有 Skill 都始终通过的断言（缺乏区分度）、波动很大的 eval（可能不稳定），以及时间/token 的取舍。

4. **启动 viewer**，同时展示定性输出与定量数据：
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   对第 2 轮及之后的迭代，还要传入 `--previous-workspace <workspace>/iteration-<N-1>`。

   **Cowork / 无头环境：** 如果 `webbrowser.open()` 不可用、或者环境没有显示设备，使用 `--static <output_path>` 写出一个独立的 HTML 文件，而不是启动服务器。当用户点击 "Submit All Reviews" 时，反馈会以 `feedback.json` 的形式下载下来。下载之后，把 `feedback.json` 拷进 workspace 目录，下一次迭代会读取它。

注意：请使用 generate_review.py 来生成 viewer；不需要写自定义 HTML。

5. **告诉用户**类似这样的话："我已经在你的浏览器中打开了结果。有两个 tab——'Outputs' 让你逐个查看每个测试用例并留下反馈，'Benchmark' 显示定量对比。看完之后，回到这里告诉我即可。"

### 用户在 viewer 中看到什么

"Outputs" tab 一次显示一个测试用例：
- **Prompt**：给出的任务
- **Output**：Skill 产生的文件，尽量内联渲染
- **Previous Output**（第 2 轮及之后）：折叠区域，展示上一轮的输出
- **Formal Grades**（如有运行评分）：折叠区域，展示每个断言的通过/失败
- **Feedback**：输入框，输入时自动保存
- **Previous Feedback**（第 2 轮及之后）：他们上次的评论，显示在输入框下方

"Benchmark" tab 显示统计汇总：每种配置的通过率、耗时、token 用量，以及分 eval 的细分情况和分析师观察。

通过上一个/下一个按钮或方向键导航。完成后他们点击 "Submit All Reviews"，所有反馈会被保存到 `feedback.json`。

### 第 5 步：阅读反馈

当用户告诉你他们看完了之后，读取 `feedback.json`：

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

空白的 feedback 意味着用户觉得没问题。把改进精力放在用户明确提出意见的测试用例上。

用完 viewer 之后，关掉它的服务：

```bash
kill $VIEWER_PID 2>/dev/null
```

---

## 改进 Skill

这是整个循环的核心。你跑完了测试用例，用户也评审了结果，现在你需要基于他们的反馈把 Skill 做得更好。

### 如何思考改进

1. **从反馈中提炼通用性。** 这里的大局是：我们想做出能被使用百万次（说不定真的，甚至更多，谁知道呢）、横跨各种 prompt 的 Skill。你和用户之所以反复在几个示例上迭代，是因为这样推进得快。用户对这些示例了如指掌，能很快评估新输出。但如果你和用户共同开发出来的 Skill 只对这些示例有效，那就毫无价值。与其塞进过拟合的小修小补、或令人窒息的死板 MUST，不如在遇到顽固问题时跳出来换个思路、用不同的比喻或推荐不同的工作模式。试一试成本不高，说不定就摸到了某种很棒的方法。

2. **保持 prompt 精简。** 把那些不起作用的部分删掉。务必去读 transcript，而不是只看最终输出——如果 Skill 让模型把时间浪费在没有产出的事情上，可以试着把导致这种行为的部分去掉，看看会怎么样。

3. **解释为什么。** 努力解释**为什么**你要求模型做这件事。今天的 LLM 是**聪明**的。它们有不错的心理理论，给它一个好的脚手架，就能超越机械执行指令、真正把事情做成。即使用户的反馈是简短或带情绪的，也要努力理解任务、理解用户为何会写出他们写的内容、内容本身在说什么，然后把这种理解传递到指令里。如果你发现自己在全部大写地写 ALWAYS 或 NEVER，或者在用极其僵化的结构，那是一个黄色警示——如果可以，请换一种说法、解释清楚原因，让模型理解你为什么要它这样做。这是一种更有人情味、更有力、更有效的方式。

4. **留意各测试用例间的重复劳动。** 阅读测试运行的 transcript，看看 subagent 是不是各自独立写了相似的辅助脚本、或对同一类事情走了同样的多步流程。如果 3 个测试用例都让 subagent 写了 `create_docx.py` 或 `build_chart.py`，那是个强烈信号——这个脚本应该作为 Skill 的内置资源。写一次，放到 `scripts/` 里，并在 Skill 中要求使用它。这样每次后续调用都不用重复造轮子。

这件事相当重要（我们要在这里创造每年数十亿美元的经济价值！）你思考的时间并不是瓶颈；慢慢来，认真琢磨。我建议先写一份草稿，然后再用全新的眼光看一遍并改进。请尽可能换位思考，弄清楚用户想要什么、需要什么。

### 迭代循环

改进完 Skill 之后：

1. 把改进应用到 Skill 上
2. 把所有测试用例重新跑到一个新的 `iteration-<N+1>/` 目录中，包括 baseline 运行。如果你在创建新 Skill，baseline 永远是 `without_skill`（不带 Skill）——它在所有迭代中保持不变。如果你在改进现有 Skill，自行判断什么作为 baseline 更合适：用户最初带来的原始版本，还是上一次迭代。
3. 启动 reviewer，并通过 `--previous-workspace` 指向上一次迭代
4. 等用户评审完并告诉你他们看完了
5. 读取新反馈、再次改进、不断重复

一直跑到：
- 用户说他满意了
- 所有反馈都是空的（一切看起来都好）
- 你不再有实质性进展

---

## 进阶：盲测对比

当你想对一个 Skill 的两个版本做更严谨的对比时（例如用户问"新版本真的比旧的好吗？"），有一个盲测对比系统。详情参阅 `agents/comparator.md` 和 `agents/analyzer.md`。核心思路是：把两个输出交给一个独立的 agent，不告诉它哪个是哪个，让它判断质量。然后再分析为什么胜者会赢。

这是可选的，依赖 subagent，多数用户用不到。人工评审循环通常就足够了。

---

## 描述优化

SKILL.md frontmatter 中的 description 字段是决定 Claude 是否调用某个 Skill 的主要机制。在创建或改进一个 Skill 之后，主动询问是否要优化描述以提升触发的准确性。

### 第 1 步：生成触发 eval 查询

构造 20 条 eval 查询——should-trigger 和 should-not-trigger 各占一部分。保存为 JSON：

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

这些查询必须真实可信，是 Claude Code 或 Claude.ai 用户实际可能会输入的内容。不是抽象请求，而是具体而细节充分的请求。比如：文件路径、用户工作或处境的个人背景信息、列名和取值、公司名、URL，加一点点背景故事。有些可以用小写、含缩写或拼写错误、口语化。长度风格混合，重点放在边界情况上，而不是黑白分明的情况（用户最后会有一次确认的机会）。

不好：`"Format this data"`、`"Extract text from PDF"`、`"Create a chart"`

好：`"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

对于 **should-trigger** 的查询（8–10 条），要考虑覆盖度。你需要同一意图的不同表达方式——有些正式、有些随意。包括用户没有显式提到 Skill 或文件类型、但显然需要它的情况。加入一些少见的用法，以及该 Skill 与其他 Skill 竞争但应该胜出的情况。

对于 **should-not-trigger** 的查询（8–10 条），最有价值的是那些"差一点就要触发"的查询——它们和这个 Skill 共享关键字或概念，但其实需要的是别的东西。考虑相邻领域、模糊措辞（朴素的关键字匹配会触发但其实不该触发）、以及查询确实涉及该 Skill 能做的事，但语境下另一种工具更合适的情况。

要避免的关键问题是：不要把 should-not-trigger 的查询写得明显无关。"写一个斐波那契函数" 作为 PDF Skill 的反例就太简单了——它什么都没检验。反面用例需要真正有迷惑性。

### 第 2 步：与用户评审

用 HTML 模板把 eval 集呈现给用户评审：

1. 从 `assets/eval_review.html` 读取模板
2. 替换占位符：
   - `__EVAL_DATA_PLACEHOLDER__` → eval 项的 JSON 数组（不要加引号——它是 JS 变量赋值）
   - `__SKILL_NAME_PLACEHOLDER__` → Skill 的名字
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → Skill 的当前描述
3. 写到一个临时文件（例如 `/tmp/eval_review_<skill-name>.html`）并打开：`open /tmp/eval_review_<skill-name>.html`
4. 用户可以编辑查询、切换 should-trigger、增删条目，然后点击 "Export Eval Set"
5. 文件会下载为 `~/Downloads/eval_set.json` —— 留意 Downloads 目录中最新的版本，可能存在多个（例如 `eval_set (1).json`）

这一步很关键——糟糕的 eval 查询会带来糟糕的描述。

### 第 3 步：跑优化循环

告诉用户："这会花一些时间——我会在后台跑优化循环，定期来看一下进度。"

把 eval 集保存到 workspace，然后在后台运行：

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

使用你系统 prompt 中的 model ID（驱动当前会话的那个），这样触发测试与用户实际体验保持一致。

运行期间，定期 tail 输出，告诉用户跑到第几轮、分数大概什么样。

它会自动处理整个优化循环。它把 eval 集拆成 60% 训练和 40% 留出测试，评估当前描述（每个查询跑 3 次以得到可靠的触发率），然后调用 Claude 根据失败的样本提出改进建议。它会在训练集和测试集上重新评估每个新描述，最多迭代 5 轮。结束后会在浏览器中打开一份 HTML 报告，逐轮展示结果，并返回一份 JSON，其中包含 `best_description`——选取的是测试集分数最高的，而非训练集，以避免过拟合。

### Skill 触发是如何工作的

理解触发机制能帮助你设计更好的 eval 查询。Skill 会出现在 Claude 的 `available_skills` 列表中，附带 name + description，Claude 基于该描述决定是否查阅这个 Skill。重要的一点是：Claude 只会在自己难以轻松完成的任务上查阅 Skill——像"读这个 PDF"这种简单的一步查询，即便描述匹配得完美，可能也不会触发 Skill，因为 Claude 用基础工具就能直接搞定。而复杂、多步、专业化的查询，只要描述匹配得当，就会可靠地触发 Skill。

也就是说，你的 eval 查询应当足够有分量，让 Claude 真的会从查阅 Skill 中获益。像"读取文件 X"这样的简单查询是糟糕的测试用例——不管描述如何，都不会触发 Skill。

### 第 4 步：应用结果

从 JSON 输出中取出 `best_description`，更新 Skill SKILL.md 的 frontmatter。把改前/改后呈现给用户，并汇报分数。

---

### 打包并交付（仅当 `present_files` 工具可用时）

检查你是否能访问 `present_files` 工具。如果没有，跳过这一步。如果有，打包 Skill 并把 .skill 文件呈现给用户：

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

打包之后，把生成的 `.skill` 文件路径指给用户，方便他们安装。

---

## Claude.ai 专用说明

在 Claude.ai 中，核心工作流是一样的（草稿 → 测试 → 评审 → 改进 → 重复），但由于 Claude.ai 没有 subagent，部分机制会有所不同。以下是需要调整的地方：

**运行测试用例**：没有 subagent 就没有并行。对每个测试用例，先读取 Skill 的 SKILL.md，然后按它的指令自己完成测试 prompt。一个一个来。这不如独立 subagent 那么严谨（你写了 Skill 又自己跑它，上下文不干净），但这是一种有用的合理性检查——而人工评审环节会做补偿。可以跳过 baseline——直接用 Skill 完成请求的任务。

**评审结果**：如果你不能打开浏览器（例如 Claude.ai 的 VM 没有显示设备，或者你在远端服务器上），就完全跳过浏览器 reviewer。改为直接在对话中呈现结果。对每个测试用例，展示 prompt 和输出。如果输出是用户需要查看的文件（如 .docx 或 .xlsx），把它存到文件系统并告诉用户路径，方便他们下载查看。在对话中索取反馈："看起来怎么样？有什么想改的吗？"

**Benchmarking**：跳过定量基准测试——它依赖于 baseline 对比，而没有 subagent 就没有意义。专注于用户的定性反馈。

**迭代循环**：和之前一样——改进 Skill、重跑测试用例、索取反馈——只是中间不再走浏览器 reviewer。如果有文件系统，仍可在其中按 iteration 目录组织结果。

**描述优化**：这一节需要 `claude` CLI 工具（具体是 `claude -p`），它仅在 Claude Code 中可用。如果你在 Claude.ai 上，跳过这一步。

**盲测对比**：需要 subagent。跳过。

**打包**：`package_skill.py` 脚本只要有 Python 和文件系统就能跑。在 Claude.ai 上可以运行它，用户可以下载生成的 `.skill` 文件。

**更新现有 Skill**：用户可能是请你更新一个现有的 Skill，而不是创建新的。这种情况下：
- **保留原有名字。** 记下 Skill 的目录名和 `name` frontmatter 字段——原样使用。例如，如果已安装的 Skill 是 `research-helper`，输出 `research-helper.skill`（而不是 `research-helper-v2`）。
- **编辑前先拷到可写位置。** 已安装的 Skill 路径可能是只读的。先复制到 `/tmp/skill-name/`，在那里编辑，并从副本打包。
- **如果手工打包，先在 `/tmp/` 中暂存**，再复制到输出目录——直接写入输出目录可能因权限失败。

---

## Cowork 专用说明

如果你在 Cowork 中，主要需要知道的是：

- 你有 subagent，所以主要工作流（并行启动测试用例、跑 baseline、评分等）都能用。（不过，如果你遇到严重的超时问题，把测试 prompt 改为串行而非并行也是可以的。）
- 你没有浏览器或显示设备，所以生成 eval viewer 时使用 `--static <output_path>` 输出独立 HTML 文件，而不是启动服务器。然后给用户一个可点击的链接，让他们在浏览器中打开 HTML。
- 不知为什么，Cowork 环境下 Claude 在跑完测试后不太愿意去生成 eval viewer，所以再强调一下：无论你在 Cowork 还是 Claude Code，跑完测试后都应当先生成 eval viewer 让人评审示例，然后再自己回去改 Skill、试着做修正——用 `generate_review.py`（而不是写你自己的定制 HTML）。这里我抱歉地大写一下：在你自己评估输出**之前**，先 GENERATE THE EVAL VIEWER。你要尽快把结果摆到人面前！
- 反馈机制不同：因为没有运行中的服务器，viewer 的 "Submit All Reviews" 按钮会把 `feedback.json` 作为文件下载下来。然后你可以从那里读取（可能需要先申请访问权限）。
- 打包能用——`package_skill.py` 只要 Python 和文件系统就行。
- 描述优化（`run_loop.py` / `run_eval.py`）在 Cowork 中应该可以正常工作，因为它通过 subprocess 调用 `claude -p`，并不依赖浏览器；不过请等你完全做完 Skill、并且用户同意它已经处于一个不错的状态之后再做这一步。
- **更新现有 Skill**：用户可能是请你更新一个现有的 Skill，而不是创建新的。请参考上面 claude.ai 一节中的更新指引。

---

## 参考文件

agents/ 目录包含针对各类专门 subagent 的指令。当你需要启动相关 subagent 时再去阅读它们。

- `agents/grader.md` —— 如何对照输出评估断言
- `agents/comparator.md` —— 如何在两个输出之间做盲测 A/B 对比
- `agents/analyzer.md` —— 如何分析一个版本为何胜出

references/ 目录有更多文档：
- `references/schemas.md` —— evals.json、grading.json 等的 JSON 结构

---

最后再重复一次核心循环，强调一下：

- 想清楚这个 Skill 是关于什么的
- 起草或编辑 Skill
- 用 claude-with-access-to-the-skill 跑测试 prompt
- 与用户一起评估输出：
  - 创建 benchmark.json 并运行 `eval-viewer/generate_review.py` 协助用户评审
  - 运行定量评估
- 一直迭代到你和用户都满意
- 打包最终的 Skill 并交付给用户。

如果你有 TodoList 之类的东西，请把这些步骤加进去，确保你不会忘记。如果你在 Cowork 中，请特别把 "Create evals JSON and run `eval-viewer/generate_review.py` so human can review test cases" 放进 TodoList，以确保这件事真的发生。

祝好运！
