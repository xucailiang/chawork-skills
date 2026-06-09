---
name: slack-gif-creator
description: >-
  用于创建针对 Slack 优化的动画 GIF 的知识与工具。提供约束条件、校验工具和动画概念。当用户请求为 Slack 制作动画 GIF（例如 "make
  me a GIF of X doing Y for Slack"）时使用。
license: Complete terms in LICENSE.txt
original_description: >-
  Knowledge and utilities for creating animated GIFs optimized for Slack.
  Provides constraints, validation tools, and animation concepts. Use when users
  request animated GIFs for Slack like "make me a GIF of X doing Y for Slack."
source_lang: en
translated_by: claude-cli
translated_at: '2026-05-25T12:05:46.319Z'
source_commit: 690f15cac7f7b4c055c5ab109c79ed9259934081
---

# Slack GIF 创建工具

一套用于创建针对 Slack 优化的动画 GIF 的工具集，提供实用工具与相关知识。

## Slack 要求

**尺寸：**
- Emoji GIF：128x128（推荐）
- 消息 GIF：480x480

**参数：**
- FPS：10-30（越低，文件越小）
- 颜色数：48-128（越少，文件越小）
- 时长：Emoji GIF 建议控制在 3 秒以内

## 核心工作流

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

# 1. Create builder
builder = GIFBuilder(width=128, height=128, fps=10)

# 2. Generate frames
for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)

    # Draw your animation using PIL primitives
    # (circles, polygons, lines, etc.)

    builder.add_frame(frame)

# 3. Save with optimization
builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

## 绘制图形

### 处理用户上传的图片
当用户上传图片时，思考一下他们希望如何使用：
- **直接使用**（例如："给这张图加动画"、"把这张图拆成多帧"）
- **作为灵感参考**（例如："做一个类似这样的"）

使用 PIL 加载和处理图片：
```python
from PIL import Image

uploaded = Image.open('file.png')
# Use directly, or just as reference for colors/style
```

### 从零开始绘制
从零开始绘制图形时，使用 PIL 的 ImageDraw 基本图元：

```python
from PIL import ImageDraw

draw = ImageDraw.Draw(frame)

# Circles/ovals
draw.ellipse([x1, y1, x2, y2], fill=(r, g, b), outline=(r, g, b), width=3)

# Stars, triangles, any polygon
points = [(x1, y1), (x2, y2), (x3, y3), ...]
draw.polygon(points, fill=(r, g, b), outline=(r, g, b), width=3)

# Lines
draw.line([(x1, y1), (x2, y2)], fill=(r, g, b), width=5)

# Rectangles
draw.rectangle([x1, y1, x2, y2], fill=(r, g, b), outline=(r, g, b), width=3)
```

**不要使用：** Emoji 字体（在各平台上表现不稳定），也不要假设此 skill 内置了打包好的图形资源。

### 让图形更出彩

图形应当看起来精致且富有创意，而不是粗糙简陋。具体做法如下：

**使用更粗的线条** —— 描边和线条始终设置 `width=2` 或更高。细线（width=1）会显得断断续续、缺乏质感。

**增加视觉层次**：
- 背景使用渐变（`create_gradient_background`）
- 叠加多个图形以提升复杂度（例如：一颗星内部嵌套一颗更小的星）

**让形状更有趣**：
- 不要只画一个普通圆形 —— 加上高光、圆环或图案
- 星星可以加发光效果（在后方绘制更大、半透明的版本）
- 组合多种形状（星星 + 闪光、圆形 + 圆环）

**注意色彩搭配**：
- 使用鲜艳、互补的颜色
- 增加对比度（浅色形状配深色描边，深色形状配浅色描边）
- 注重整体构图

**绘制复杂形状**（爱心、雪花等）时：
- 组合使用多边形和椭圆
- 仔细计算坐标点以保证对称
- 添加细节（爱心可以画一条高光曲线，雪花可以有精致的分支）

发挥创造力、注重细节！一个优秀的 Slack GIF 应当看起来精致，而不是像占位图。

## 可用工具

### GIFBuilder (`core.gif_builder`)
组装帧并针对 Slack 进行优化：
```python
builder = GIFBuilder(width=128, height=128, fps=10)
builder.add_frame(frame)  # Add PIL Image
builder.add_frames(frames)  # Add list of frames
builder.save('out.gif', num_colors=48, optimize_for_emoji=True, remove_duplicates=True)
```

### 校验器 (`core.validators`)
检查 GIF 是否满足 Slack 要求：
```python
from core.validators import validate_gif, is_slack_ready

# Detailed validation
passes, info = validate_gif('my.gif', is_emoji=True, verbose=True)

# Quick check
if is_slack_ready('my.gif'):
    print("Ready!")
```

### 缓动函数 (`core.easing`)
用平滑运动替代线性运动：
```python
from core.easing import interpolate

# Progress from 0.0 to 1.0
t = i / (num_frames - 1)

# Apply easing
y = interpolate(start=0, end=400, t=t, easing='ease_out')

# Available: linear, ease_in, ease_out, ease_in_out,
#           bounce_out, elastic_out, back_out
```

### 帧辅助函数 (`core.frame_composer`)
针对常见需求的便捷函数：
```python
from core.frame_composer import (
    create_blank_frame,         # Solid color background
    create_gradient_background,  # Vertical gradient
    draw_circle,                # Helper for circles
    draw_text,                  # Simple text rendering
    draw_star                   # 5-pointed star
)
```

## 动画概念

### 抖动/震动
通过振荡偏移对象位置：
- 使用 `math.sin()` 或 `math.cos()` 配合帧索引
- 加入少量随机变化以获得自然感
- 应用到 x 和（或）y 坐标上

### 脉动/心跳
让对象大小有节奏地缩放：
- 使用 `math.sin(t * frequency * 2 * math.pi)` 实现平滑脉动
- 心跳效果：两次快速脉动后停顿（调整正弦波）
- 在基础大小的 0.8 到 1.2 倍之间缩放

### 弹跳
对象下落并弹起：
- 落地时使用 `interpolate()` 配合 `easing='bounce_out'`
- 下落（加速）时使用 `easing='ease_in'`
- 通过每帧增加 y 方向速度来模拟重力

### 旋转/自转
让对象围绕中心旋转：
- PIL：`image.rotate(angle, resample=Image.BICUBIC)`
- 摆动效果：用正弦波代替线性变化来计算角度

### 淡入/淡出
逐渐出现或消失：
- 创建 RGBA 图像，调整 alpha 通道
- 或使用 `Image.blend(image1, image2, alpha)`
- 淡入：alpha 从 0 到 1
- 淡出：alpha 从 1 到 0

### 滑动
对象从画面外移入到指定位置：
- 起始位置：画面边界之外
- 结束位置：目标位置
- 使用 `interpolate()` 配合 `easing='ease_out'` 实现平滑停止
- 想要回弹效果：使用 `easing='back_out'`

### 缩放
通过缩放和定位实现 zoom 效果：
- Zoom in：从 0.1 缩放到 2.0，并对中心进行裁剪
- Zoom out：从 2.0 缩放到 1.0
- 可加运动模糊以增强戏剧感（使用 PIL filter）

### 爆炸/粒子迸发
创建向外辐射的粒子：
- 生成具有随机角度和速度的粒子
- 更新每个粒子：`x += vx`、`y += vy`
- 加入重力：`vy += gravity_constant`
- 让粒子随时间淡出（降低 alpha）

## 优化策略

仅当被要求减小文件体积时，再考虑使用下面几种方法：

1. **减少帧数** —— 降低 FPS（用 10 代替 20）或缩短时长
2. **减少颜色数** —— 使用 `num_colors=48` 代替 128
3. **缩小尺寸** —— 使用 128x128 代替 480x480
4. **去除重复帧** —— 在 save() 中设置 `remove_duplicates=True`
5. **Emoji 模式** —— `optimize_for_emoji=True` 会自动进行优化

```python
# Maximum optimization for emoji
builder.save(
    'emoji.gif',
    num_colors=48,
    optimize_for_emoji=True,
    remove_duplicates=True
)
```

## 设计理念

本 skill 提供：
- **知识**：Slack 的相关要求和动画概念
- **工具**：GIFBuilder、校验器、缓动函数
- **灵活性**：使用 PIL 基本图元自行编写动画逻辑

本 skill 不提供：
- 死板的动画模板或预制函数
- Emoji 字体渲染（在各平台上表现不稳定）
- 内置打包好的图形素材库

**关于用户上传的说明**：本 skill 不包含预制图形，但如果用户上传了图片，可使用 PIL 加载并处理 —— 根据用户的需求判断他们是想直接使用，还是仅作为灵感参考。

发挥创造力！把多个概念组合起来（弹跳 + 旋转、脉动 + 滑动等），充分利用 PIL 的能力。

## 依赖

```bash
pip install pillow imageio numpy
```
