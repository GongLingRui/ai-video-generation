# 功能设计规范

## 用户 Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        用户打开应用                           │
│                            │                                │
│                    ┌───────┴────────┐                       │
│                    │                │                       │
│              手动创建分镜       AI 辅助创建                   │
│                    │                │                       │
│            画布上手动添加     右栏输入故事描述                  │
│            配置节点              │                           │
│                    │         AI 生成分镜脚本                  │
│                    │              │                          │
│                    │         用户确认/修改                    │
│                    │              │                          │
│                    │         点击"加入画布"                   │
│                    │              │                          │
│                    └──────┬───────┘                         │
│                           │                                 │
│                    画布上有配置节点                            │
│                           │                                 │
│                    选中节点 + 编辑 prompt                     │
│                           │                                 │
│                    从左栏添加运镜技巧（可选）                   │
│                           │                                 │
│                    点击"生成视频"                             │
│                           │                                 │
│                    等待生成（30s~2min）                       │
│                           │                                 │
│                    查看视频 / 重新生成                        │
└─────────────────────────────────────────────────────────────┘
```

## 功能点详细设计

---

### F1: 运镜技巧面板（左栏）

**描述**：展示所有可用的视频运镜技巧，分类为角度、视图、动作、风格四大类。

**验收标准**：
- [ ] 四个分类以 Collapsible 面板展示，默认全部展开
- [ ] 每个技巧以 TechniqueChip 展示，显示中文名称
- [ ] 鼠标悬停 chip 时显示 Tooltip，包含英文 keyword 和简短说明
- [ ] 点击 chip 时：若有选中节点 → 添加技巧到节点；若无 → toast 提示
- [ ] chip 状态响应当前选中节点的配置（applied / idle）
- [ ] 切换选中节点时，chip 状态实时更新

**数据定义**：

```typescript
// lib/constants.ts
const TECHNIQUE_CATEGORIES: TechniqueCategory[] = [
  {
    id: 'angle',
    label: '角度',
    icon: Compass,
    techniques: [
      { id: 'low-angle', label: '低角度', prompt_keyword: 'low angle shot', description: '从下方向上拍摄，赋予主体力量感' },
      { id: 'eye-level', label: '平角度', prompt_keyword: 'eye level shot', description: '与主体视线平齐的自然视角' },
      { id: 'high-angle', label: '高角度', prompt_keyword: 'high angle shot', description: '从上方向下拍摄，主体显得渺小' },
      { id: 'dutch-angle', label: '荷兰角', prompt_keyword: 'dutch angle', description: '倾斜镜头，营造不安感' },
      { id: 'birds-eye', label: '鸟瞰', prompt_keyword: "bird's eye view", description: '正上方俯视，展示全局空间关系' },
    ]
  },
  {
    id: 'view',
    label: '视图',
    icon: Eye,
    techniques: [
      { id: 'extreme-close-up', label: '特写', prompt_keyword: 'extreme close-up', description: '面部或细节充满画面' },
      { id: 'close-up', label: '近景', prompt_keyword: 'close-up shot', description: '头肩以上，聚焦表情' },
      { id: 'medium-shot', label: '中景', prompt_keyword: 'medium shot', description: '腰部以上，平衡人物与环境' },
      { id: 'wide-shot', label: '全景', prompt_keyword: 'wide shot', description: '展示完整人物与环境' },
      { id: 'extreme-wide', label: '远景', prompt_keyword: 'extreme wide shot', description: '环境主导，人物极小' },
      { id: 'over-shoulder', label: '过肩', prompt_keyword: 'over-the-shoulder shot', description: '从一人肩后看向另一人' },
    ]
  },
  {
    id: 'movement',
    label: '动作',
    icon: Move,
    techniques: [
      { id: 'push-in', label: '推', prompt_keyword: 'push in', description: '镜头向前推进，增强紧张感' },
      { id: 'pull-out', label: '拉', prompt_keyword: 'pull out', description: '镜头后退，揭示更大场景' },
      { id: 'pan-left', label: '摇(左)', prompt_keyword: 'pan left', description: '镜头左摇，跟随或揭示' },
      { id: 'pan-right', label: '摇(右)', prompt_keyword: 'pan right', description: '镜头右摇' },
      { id: 'tilt-up', label: '升', prompt_keyword: 'tilt up', description: '镜头上仰，揭示高度' },
      { id: 'tilt-down', label: '降', prompt_keyword: 'tilt down', description: '镜头下俯' },
      { id: 'tracking', label: '跟', prompt_keyword: 'tracking shot', description: '镜头跟随主体移动' },
      { id: 'orbit', label: '环绕', prompt_keyword: 'orbit shot', description: '围绕主体旋转' },
      { id: 'zoom-in', label: '变焦(进)', prompt_keyword: 'zoom in', description: '变焦拉近，压缩空间' },
      { id: 'zoom-out', label: '变焦(出)', prompt_keyword: 'zoom out', description: '变焦拉远' },
      { id: 'crane', label: '摇臂', prompt_keyword: 'crane shot', description: '大幅度上升或下降' },
      { id: 'steadicam', label: '稳定器', prompt_keyword: 'steadicam shot', description: '平滑的跟随移动' },
    ]
  },
  {
    id: 'style',
    label: '风格',
    icon: Palette,
    techniques: [
      { id: 'cinematic', label: '电影感', prompt_keyword: 'cinematic', description: '电影级色调和构图' },
      { id: 'documentary', label: '纪录片', prompt_keyword: 'documentary style', description: '真实感、手持感' },
      { id: 'music-video', label: 'MV风', prompt_keyword: 'music video style', description: '快切、色彩浓烈' },
      { id: 'slow-motion', label: '慢动作', prompt_keyword: 'slow motion', description: '降速播放，突出细节' },
      { id: 'timelapse', label: '延时', prompt_keyword: 'timelapse', description: '加速播放，展示时间流逝' },
      { id: 'montage', label: '蒙太奇', prompt_keyword: 'montage sequence', description: '快速剪辑序列，压缩叙事' },
      { id: 'handheld', label: '手持', prompt_keyword: 'handheld camera', description: '有意的晃动，增强临场感' },
      { id: 'aerial', label: '航拍', prompt_keyword: 'aerial shot', description: '无人机视角的大场面' },
      { id: 'noir', label: '黑色电影', prompt_keyword: 'film noir style', description: '高对比度光影、阴暗氛围' },
      { id: 'vaporwave', label: '蒸汽波', prompt_keyword: 'vaporwave aesthetic', description: '赛博感、霓虹色调' },
    ]
  },
]
```

---

### F2: 画布与节点系统（中栏）

**描述**：xyflow 节点画布，支持两种自定义节点和自动布局。

**验收标准**：

#### 配置节点 (ConfigNode)
- [ ] 默认只显示 prompt textarea 和生成按钮
- [ ] 添加运镜技巧后，在 textarea 下方以 Badge 形式展示，可点 × 移除
- [ ] 比例选择器（Select: 16:9 默认, 9:16, 1:1, 4:3, 3:4, 21:9）
- [ ] 时长选择器（Select: 5s 默认, 4s, 8s, 12s）
- [ ] 选中态：ring-2 ring-ring
- [ ] 节点宽度固定 320px
- [ ] 节点标题显示分镜序号（"分镜 #1"）或自定义标题

#### 视频节点 (VideoNode)
- [ ] 位于对应配置节点正下方，y 偏移 280px
- [ ] 默认显示占位图（空状态提示"点击上方生成按钮"）
- [ ] 生成中：显示骨架屏 + 进度提示
- [ ] 生成完成：显示视频播放器（HTML5 video，自动暂停）
- [ ] 底部操作栏：重新生成、下载
- [ ] 生成历史：底部小缩略图列表，可切换版本
- [ ] 节点宽度固定 320px

#### 画布交互
- [ ] 支持拖拽移动节点（自由定位）
- [ ] 支持画布缩放和平移
- [ ] 配置节点之间水平连接（smoothstep edge）
- [ ] 配置→视频垂直连接（straight edge）
- [ ] 双击画布空白处可手动创建空白配置节点
- [ ] 选中节点时左栏实时反映该节点的 technique 状态

#### 自动布局
- [ ] 从分镜创建节点时：x 间距 400px，起始 x=100
- [ ] 配置节点 y=100，视频节点 y=380
- [ ] 新建节点后自动 fitView 到合适缩放级别

---

### F3: AI 分镜对话（右栏）

**描述**：基于 Vercel AI SDK Generative UI 的对话系统，AI 以结构化方式生成分镜脚本。

**验收标准**：

#### 对话交互
- [ ] 支持流式输出（token by token 显示）
- [ ] 支持多轮对话，上下文保持
- [ ] 用户可发送文字消息
- [ ] AI 回复中穿插 Generative UI 组件

#### Generative UI 组件
- [ ] `StoryboardPanel`：分镜列表容器，包含多个分镜卡片
- [ ] 每个分镜卡片显示：序号、标题、描述、建议技巧
- [ ] 每个卡片有"加入画布"按钮
- [ ] 面板顶部有"全部加入画布"按钮
- [ ] 已加入画布的卡片显示为 `onCanvas` 状态（灰化 + 勾选）

#### 分镜脚本管理
- [ ] AI 通过 tool call 输出结构化分镜数据
- [ ] 用户可在对话中要求修改特定分镜
- [ ] 修改后 AI 输出更新版的 StoryboardPanel
- [ ] 已在画布中的分镜如果被修改，画布中的节点同步更新

#### System Prompt

```
你是一个专业的影视分镜师。用户会给你一个故事概要，你需要：

1. 分析故事的叙事结构
2. 将故事分解为多个视觉镜头（分镜）
3. 每个分镜包含：
   - 标题（简短描述）
   - 详细的视觉描述（用于视频生成的 prompt）
   - 建议的运镜技巧（从预定义列表中选择）
   - 建议的视频比例和时长

使用 generateStoryboard 工具来输出分镜结果。
每个分镜的描述要足够具体，能直接用作视频生成的 prompt。
镜头之间要有叙事连贯性。

可用的运镜技巧关键词：
角度: low angle, eye level, high angle, dutch angle, bird's eye view
视图: close-up, medium shot, wide shot, extreme wide, over-the-shoulder
动作: push in, pull out, pan left/right, tilt up/down, tracking, orbit
风格: cinematic, documentary, slow motion, timelapse, montage, handheld
```

---

### F4: 视频生成

**描述**：调用 Seedance 1.5 Pro API 生成视频。

**验收标准**：

#### Prompt 拼装
- [ ] 格式：`"{用户prompt}. Camera: {运镜技巧}. Style: {风格}."`
- [ ] 运镜技巧按分类组织：Camera 包含角度+视图+动作，Style 单独
- [ ] 空技巧时只发送用户 prompt
- [ ] prompt 语言：保持用户输入的语言（Seedance 支持中英文）

#### API 调用流程
- [ ] POST /api/generate 创建任务，返回 taskId
- [ ] 客户端以 3s 间隔轮询 GET /api/generate/[taskId]
- [ ] 最大轮询 60 次（3 分钟超时）
- [ ] 成功：返回 video_url，更新 VideoNode
- [ ] 失败：返回错误信息，ConfigNode 显示 error 态

#### 生成历史
- [ ] 每次生成保存到 VideoNode 的 history 数组
- [ ] 重新生成时，当前视频移入历史，新视频替换
- [ ] 历史记录包含：videoUrl, prompt（含 techniques 的完整 prompt）, 时间戳

---

### F5: 设置面板

**描述**：API Key 配置和主题切换。

**验收标准**：
- [ ] 页面右上角齿轮图标打开设置 Dialog
- [ ] API Key 输入框（password 类型，可切换显示）
- [ ] 暗色模式切换
- [ ] API Key 保存到 localStorage（单用户工具，安全性可接受）
- [ ] 若未配置 API Key，首次使用时自动弹出设置面板

---

## 边界条件与错误场景

| 场景 | 处理方式 |
|------|---------|
| API Key 未配置 | 弹出设置面板，阻止生成操作 |
| Seedance API 返回错误 | toast 显示错误信息 + 节点 error 状态 |
| 生成超时（>3min） | toast "生成超时，请重试" + error 状态 |
| 豆包 API 流中断 | 显示"连接中断"消息 + 重试按钮 |
| 无选中节点时点击左栏 | toast "请先选中一个配置节点" |
| 画布为空时 | 中间显示空状态提示："在右栏输入故事，或双击画布创建节点" |
| 视频 URL 过期/失效 | 播放失败时显示"视频已过期，请重新生成" |
| 网络断开 | 全局 banner "网络连接已断开" |

## MVP 范围外（未来迭代）

- 项目保存/加载（LocalStorage 或文件导出）
- 视频拼接/时间线编辑
- 图生视频（image-to-video 模式）
- 多用户协作
- 自定义运镜技巧
- 视频预览的分镜连播
