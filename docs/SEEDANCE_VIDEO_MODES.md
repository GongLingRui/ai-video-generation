# Seedance 视频生成模式梳理

> 基于火山方舟官方文档整理，模型：`doubao-seedance-1-5-pro-251215`
> API：`POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`

---

## 一、核心生成模式（按 content 输入类型划分）

### 1. 文生视频 (Text-to-Video)

纯文本 prompt 生成视频，最基础的模式。

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "小猫对着镜头打哈欠" }
  ],
  "ratio": "16:9",
  "duration": 5
}
```

**适用场景**：从零创作，AI 完全自主生成画面。

---

### 2. 图生视频 (Image-to-Video)

在文本基础上附加图片，控制视频的起始/结束画面。分三个子模式：

#### 2a. 首帧生视频（单图 → 视频）

以一张图作为视频第一帧，AI 生成后续动态内容。

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "image_url", "image_url": { "url": "https://..." }, "role": "first_frame" },
    { "type": "text", "text": "女孩缓缓转头微笑" }
  ],
  "duration": 5
}
```

**适用场景**：已有概念图/分镜稿，需要"让静态画面动起来"。

#### 2b. 首尾帧生视频（双图 → 视频）

同时指定首帧和尾帧，AI 生成两帧之间的过渡动画。

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "image_url", "image_url": { "url": "https://first.png" }, "role": "first_frame" },
    { "type": "image_url", "image_url": { "url": "https://last.png" }, "role": "last_frame" },
    { "type": "text", "text": "镜头从远景推至近景" }
  ],
  "duration": 5
}
```

**适用场景**：精确控制视频起止画面，如场景转换、角色动作起止。

#### 2c. 参考图生视频（风格/角色参考）

上传参考图，不作为帧而是作为风格/角色一致性参考。

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "image_url", "image_url": { "url": "https://ref.png" }, "role": "reference_image" },
    { "type": "text", "text": "同一个角色在海边奔跑" }
  ]
}
```

**适用场景**：保持角色/风格一致性，适合多镜头连续叙事。
**限制**：不支持 1080p 分辨率，ratio 不支持 adaptive。

---

### 3. 样片 → 正式视频 (Draft-to-Official)

**仅 Seedance 1.5 Pro 支持。** 两步工作流：先生成低成本样片预览，确认满意后再生成正式高质量视频。

**第一步：生成样片**
```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "城市街道延时摄影" }
  ],
  "draft": true,
  "resolution": "480p"
}
```

**第二步：基于样片生成正式视频**
```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "draft_task", "draft_task": { "id": "cgt-2025xxxxxx-xxxx" } }
  ],
  "resolution": "720p"
}
```

**适用场景**：降低试错成本，先快速预览再正式出片。
**限制**：样片固定 480p，不支持返回尾帧，不支持离线推理。

---

## 二、增强能力（通过参数组合叠加）

| 能力 | 参数 | 值 | 说明 |
|------|------|-----|------|
| **有声视频** | `generate_audio` | `true`（默认） | 自动生成人声、音效、背景音乐。对话用双引号包裹效果更佳 |
| **无声视频** | `generate_audio` | `false` | 纯画面，无音频 |
| **固定摄像头** | `camera_fixed` | `true` | 锁定机位，适合固定场景 |
| **连续视频** | `return_last_frame` | `true` | 返回尾帧图，可作为下一段视频的首帧，实现多段连续叙事 |
| **可复现生成** | `seed` | 具体整数 | 相同 seed + 相同 prompt ≈ 相似结果 |

---

## 三、输出规格参数

### 分辨率 (resolution)

| 值 | Seedance 1.5 Pro 默认 | 说明 |
|-----|----------------------|------|
| `480p` | - | 低画质，样片模式专用 |
| `720p` | **默认** | 标准画质 |
| `1080p` | - | 高画质（参考图场景不支持） |

### 宽高比 (ratio)

| 值 | 适用场景 |
|-----|---------|
| `16:9` | 横屏电影感（1.0 系列默认） |
| `9:16` | 竖屏短视频 |
| `1:1` | 方形，社交媒体 |
| `4:3` | 传统电视比例 |
| `3:4` | 竖屏海报感 |
| `21:9` | 超宽银幕 |
| `adaptive` | 模型自动选择（**1.5 Pro 文生视频默认**） |

### 时长 (duration)

| 模型 | 范围 | 特殊值 |
|------|------|--------|
| Seedance 1.5 Pro | `[4, 12]` 整数秒 | `-1` = 模型自主决定 |
| Seedance 1.0 系列 | `[2, 12]` 秒 | - |

---

## 四、服务等级 (service_tier)

| 值 | 模式 | 价格 | 适用场景 |
|-----|------|------|---------|
| `default` | 在线推理 | 标准价 | 实时交互，要求低延迟 |
| `flex` | 离线推理 | **50% 价格** | 批量生成，不要求实时 |

---

## 五、模式组合矩阵（Daliu-Jimeng 项目可用）

| 模式 | content 组合 | 关键参数 | 优先级 |
|------|-------------|---------|--------|
| 文生视频 | `[text]` | ratio, duration | **P0 - 已实现** |
| 首帧生视频 | `[image(first_frame), text]` | ratio, duration | P1 - 画布分镜可扩展 |
| 首尾帧生视频 | `[image(first_frame), image(last_frame), text]` | duration | P2 |
| 参考图生视频 | `[image(reference_image), text]` | ratio, duration | P2 |
| 样片→正式 | `[text]` → `[draft_task]` | draft=true/false | P1 - 降低成本 |
| 连续多段视频 | `[text]` + return_last_frame | return_last_frame=true | P1 - 分镜串联 |

---

## 六、与项目现有功能的映射

```
当前实现：
  AI 分镜助手 → 生成 shots[] → 每个 shot 文生视频 (T2V)

可扩展方向：
  1. 样片预览模式：先 draft=true 低成本预览 → 确认后正式生成
  2. 连续分镜串联：return_last_frame=true → 尾帧作为下一镜首帧
  3. 首帧控制：用户上传/AI 生成参考图 → image(first_frame) + text
  4. 有声/无声切换：generate_audio 参数开关
  5. 离线批量生成：service_tier=flex 半价批量出片
```
