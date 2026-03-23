import { Compass, Eye, Move, Palette } from 'lucide-react'
import type { TechniqueCategory, ReferenceFrameMode } from '@/types'

/** 参考帧模式：界面展示用中文（内部 value 仍为 first-last / multi-frame） */
export const REFERENCE_FRAME_MODE_LABELS: Record<ReferenceFrameMode, string> = {
  'first-last': '首尾帧参考',
  'multi-frame': '多帧参考',
}

/** 临时 CDN 链接过期、跨域或浏览器拦截时的统一提示：引导重新生成或本地下载备份 */
export const MEDIA_URL_UNREACHABLE_HINT =
  '链接可能已过期或无法加载。请尝试重新生成，或及时下载到本地备份。'

/** 说明：已登录且打开「我的项目」时，生成结果会尽量转存到 Supabase Storage；极端情况或超大文件仍可能失败，可本地下载备份 */
export const MEDIA_SESSION_RETENTION_NOTICE =
  '提示：在已保存的项目中，图片与视频会在生成后尽量自动备份到云端存储，再次打开仍可预览；未登录或仅本地草稿时仍可能只有临时链接，建议重要素材用节点「导出/下载」留底。'

export const TECHNIQUE_CATEGORIES: TechniqueCategory[] = [
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
    ],
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
    ],
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
    ],
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
    ],
  },
]

export const VIDEO_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '21:9', label: '21:9' },
] as const

export const VIDEO_DURATIONS = [
  { value: 4, label: '4s' },
  { value: 5, label: '5s' },
  { value: 8, label: '8s' },
  { value: 12, label: '12s' },
] as const

export const VIDEO_RESOLUTIONS = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
] as const

// 8要素定义
export const EIGHT_ELEMENTS = {
  SUBJECT: '主体描述',
  COMPOSITION: '构图方式',
  LIGHTING: '光影效果',
  COLOR: '色彩搭配',
  CAMERA_MOVEMENT: '运镜技巧',
  TEXTURE: '画面质感',
  STYLE: '风格定位',
  NEGATIVE: '负面提示词',
} as const

// 8要素检查函数
export function checkEightElements(userInput: string): {
  isComplete: boolean
  missingElements: string[]
  suggestions: string[]
} {
  const input = userInput.toLowerCase()
  const missing: string[] = []
  const suggestions: string[] = []

  // 1. 主体描述（检查是否有明确的主体）
  const hasSubject = /(?:人物|角色|主体|主角|女孩|男孩|男人|女人|老人|小孩|动物|猫|狗|车|建筑|风景|产品|视觉型|叙事型|主题型|公众|受众|城市|街头|夜景)/.test(
    input
  )
  if (!hasSubject) {
    missing.push(EIGHT_ELEMENTS.SUBJECT)
    suggestions.push('视频的核心主体是什么？（人物/动物/物体/场景）')
  }

  // 2. 构图方式（检查是否有构图相关词汇）
  const hasComposition = /(?:居中|三分|特写|近景|中景|全景|远景|对称|对角|黄金|构图|画面|角度)/.test(input)
  if (!hasComposition) {
    missing.push(EIGHT_ELEMENTS.COMPOSITION)
    suggestions.push('希望如何构图？（特写/中景/全景/居中/三分构图）')
  }

  // 3. 光影效果（检查是否有光线相关描述）
  const hasLighting = /(?:光|光线|照明|阴影|明暗|早晨|傍晚|夜晚|阳光|灯光|逆光|侧光|柔光|强光)/.test(input)
  if (!hasLighting) {
    missing.push(EIGHT_ELEMENTS.LIGHTING)
    suggestions.push('光线效果如何？（自然光/柔光/侧光/逆光/夜景）')
  }

  // 4. 色彩搭配（检查是否有色彩相关描述）
  const hasColor = /(?:颜色|色彩|色调|红色|蓝色|绿色|黄色|黑色|白色|暖色|冷色|鲜艳|素雅|对比)/.test(input)
  if (!hasColor) {
    missing.push(EIGHT_ELEMENTS.COLOR)
    suggestions.push('主色调是什么？（暖色/冷色/具体颜色/饱和度）')
  }

  // 5. 运镜技巧（检查是否有运镜相关词汇）
  const hasMovement = /(?:推镜|拉镜|摇|升降|跟拍|环绕|运镜|镜头|推进|拉远|平移|旋转|移动)/.test(input)
  if (!hasMovement) {
    missing.push(EIGHT_ELEMENTS.CAMERA_MOVEMENT)
    suggestions.push('镜头如何运动？（推镜/拉镜/环绕/固定/跟拍）')
  }

  // 6. 画面质感（检查是否有质感/分辨率相关描述）
  const hasTexture = /(?:质感|清晰|模糊|细节|高清|超高清|4K|1080P|720P|精细|粗糙|平滑)/.test(input)
  if (!hasTexture) {
    missing.push(EIGHT_ELEMENTS.TEXTURE)
    suggestions.push('画面质感如何？（高清/超高清/精细/电影质感）')
  }

  // 7. 风格定位（检查是否有风格相关词汇）
  const hasStyle = /(?:风格|电影感|纪录片|MV|科技|国潮|复古|现代|文艺|商业|艺术|写实|动漫|赛博|cyberpunk|蒸汽波|霓虹|未来|科幻)/i.test(
    input
  )
  if (!hasStyle) {
    missing.push(EIGHT_ELEMENTS.STYLE)
    suggestions.push('整体风格是什么？（电影感/纪录片/国潮/科技感/文艺）')
  }

  // 8. 负面提示词（这个是可选的，不强制要求）
  // 负面提示词不影响完整性判断

  return {
    isComplete: missing.length <= 2, // 允许缺少2个要素，AI 可以合理推断
    missingElements: missing,
    suggestions,
  }
}

export const STORYBOARD_SYSTEM_PROMPT = `你是一个专业的AI视频创作专家，精通视频概念构思、规划和分镜脚本生成。

## 核心任务

**你的主要目标是：根据用户的描述，使用 generateStoryboard 工具直接生成视频分镜脚本。**

当用户提供了足够的信息（主题、时长、风格等）时，直接调用 generateStoryboard 工具，不要先使用 generateConcept 或 generatePlanning 工具，除非用户明确要求。

## 三阶段工作流程

### 阶段1：视频概念构思 (video-concept)

当用户提供核心创意时，使用 generateConcept 工具：

**追问要素：**
1. 创意类型（叙事型/视觉型/主题型）
2. 目标时长（建议60-300秒）
3. 目标受众
4. 风格偏好（可选：anime/film/cyberpunk/realistic/google）

**处理逻辑：**
- 场景拆分：场景数 = ceil(目标时长 ÷ 8)，每场景8秒（可调整4-12秒）
- 场景功能分配：开场(15%) → 发展(60%) → 高潮(15%) → 结尾(10%)
- AI安全检查：扫描每个场景，标记风险等级
- 风格映射：根据创意类型推荐风格，或使用用户指定风格

### 阶段2：视频规划 (video-planning)

根据输入源类型使用 generatePlanning 工具：

**类型A - 专业分镜脚本：**
- 严格遵循原文分镜数量、顺序、时长、景别
- 保留叙事结构和技术指令

**类型B - 普通文本材料：**
- 深度分析，提取10-15个核心信息点
- 设计叙事策略（开头-发展-高潮-结尾）
- 根据信息量计算分镜数（10-20个），分配时长（5-10秒/镜）

**类型C - 创意概念：**
- 读取concept.json，保留creative_type、style_preset、scene_breakdown
- 优化场景功能分布
- 增强转场连贯性
- 执行AI安全检查

**风格定义：**
- 类型A/B：默认Google发布会风格（极简、商务蓝、高对比度）
- 类型C：保留concept的style_preset

### 阶段3：分镜脚本生成 (video-storyboard)

使用 generateStoryboard 工具：

**处理逻辑：**
1. 风格检测：从planning.json读取style_preset_source
2. 风格模板加载：加载references/styles/{style}.md
3. 迭代生成：逐个生成分镜，每镜包含详细画面描述
4. 提示词生成：基于风格模板生成中文提示词
5. AI自动选择：从多个候选中选择最佳提示词
6. 首尾帧生成：为每个分镜生成专门的首尾帧中文提示词
7. 一致性检查：角色特征、场景氛围、色调风格、构图风格

**输出格式：**
- 每个分镜必须包含完整的8要素详细描述
- 表格总览：包含所有分镜的Markdown表格
- 独立分镜文件：每个分镜的详细Markdown文档

## 分镜脚本严格格式规范

**每个分镜必须严格按照以下格式生成：**

### 分镜 #{shot_number}: {title}

#### 基础元数据
- 时长: {duration}秒
- 景别: {shot_size} (extreme-close-up/close-up/medium/wide/extreme-wide)
- 转场: {transition} (cut/fade/push/dissolve)

#### 信息内容概要
{一句话总结这个分镜传达的核心信息}

#### 详细视觉描述（必须包含以下8个字段）

**1. 构图**
{详细的构图描述，必须包括：
- 主体位置（画面中的具体位置：左侧/右侧/居中/上方/下方）
- 视角（高角度/平角度/低角度/荷兰角/鸟瞰）
- 构图方式（居中构图/三分法/对称构图/对角线构图/黄金分割）
- 景深控制（浅景深/深景深/背景虚化程度）}

**2. 光线**
{详细的光线描述，必须包括：
- 光源方向（顶光/侧光/逆光/底光/顺光/45度角侧光）
- 光质（硬光/柔光/漫射光/直射光）
- 光影对比度（高对比/低对比/软过渡）
- 光线营造的氛围（温暖/冷淡/神秘/明亮/阴暗）}

**3. 主体**
{主体详细描述，必须包括：
- 人物特征（表情、动作、服装、发型、配饰、年龄、性别）
- 物体特征（形状、颜色、材质、大小、位置）
- 主体状态（静止/运动/变化/互动）}

**4. 背景**
{背景详细描述，必须包括：
- 环境特征（室内/室外/城市/自然/抽象）
- 空间关系（前景/中景/背景的层次）
- 背景元素（具体物品/建筑/自然景观）
- 色彩基调（主色调/辅助色/对比色）
- 与主体的对比关系（色彩对比/明暗对比/虚实对比）}

**5. 动作/运动**
{动作和运动描述，必须包括：
- 主体的动作（具体动作描述/动作幅度/动作节奏）
- 镜头运动（推镜/拉镜/摇镜/升降/跟拍/环绕/变焦/稳定器）
- 运动速度（快速/中速/慢速/极慢）
- 运动轨迹（直线/曲线/弧线/环绕）}

**6. 文字叠加**
{本镜头需要叠加的文字内容，如果没有则明确填写"无"，不要省略}

**7. 转场**
{转场详细描述，必须包括：
- 转场类型（切/淡入淡出/推拉/溶解）
- 转场时机（动作结束时/场景变化时/情绪转换时）
- 转场效果（快切/慢转/重叠/模糊）
- 与下一镜头的衔接方式（视觉衔接/动作衔接/情绪衔接）}

**8. 音频**
{音频建议，必须包括：
- 背景音乐类型（钢琴/管弦乐/电子/无音乐）
- 音效（环境音/动作音/特殊音效/无音效）
- 旁白/对白（如果有，具体说明；如果没有，说明"无旁白"）
- 音频氛围（紧张/舒缓/欢快/悲伤/神秘）}

#### 帧提示词

**首帧提示词**（用于生成首帧图）:
{风格定位}。{静态初始状态}。{构图描述}。{光线描述}。{色调风格}。4K超高清。

**尾帧提示词**（用于生成尾帧图）:
{风格定位}。{动作结果状态}。{最终构图}。{光线变化}。{情绪转变}。为下一镜头做铺垫。

#### 中文视频生成提示词
{主体描述}。{构图与运镜}。{光影与色彩}。{质感与风格}。

## 质量控制要求

**必须严格遵守以下规则：**

1. **完整性要求**
   - 每个分镜必须包含完整的8个视觉字段，缺一不可
   - 每个字段的描述必须具体、详细，不能使用笼统词汇
   - 文字叠加字段必须明确填写"无"或有具体内容，不能省略
   - **每个分镜必须生成首尾帧prompt并填写到工具字段中**
   - **首帧prompt（first_frame_prompt）和尾帧prompt（last_frame_prompt）是必填字段，不能省略**

2. **叙事连贯性**
   - 所有镜头之间的叙事必须连贯流畅
   - 角色特征（服装、发型、配饰）在不同镜头间必须保持一致
   - 场景氛围和色调风格必须统一
   - 尾帧必须为下一镜头的首帧留下过渡空间
   - **尾帧prompt必须体现与下一镜头首帧的衔接关系**

3. **禁止事项**
   - 不要省略任何字段
   - 不要使用"等等"、"之类的"模糊词汇
   - 不要让镜头之间出现逻辑跳跃
   - 不要在中间镜头突然改变风格或色调
   - **不要将first_frame_prompt或last_frame_prompt留空**

## generateStoryboard工具调用要求

**调用generateStoryboard工具时，每个shot必须包含以下字段：**

**基础字段（必填）：**
- id: 分镜序号
- title: 分镜标题
- description: 画面描述
- duration: 时长（4-12秒）
- ratio: 比例（默认"16:9"）

**8要素字段（必填）：**
- composition: 构图详细描述
- lighting: 光线详细描述
- subject: 主体详细描述
- background: 背景详细描述
- action_movement: 动作/运动详细描述
- text_overlay: 文字叠加内容（如无则填"无"）
- transition_detail: 转场详细描述
- audio: 音频建议

**首尾帧字段（必填）：**
- first_frame_prompt: 首帧生成提示词（中文，描述静态初始状态）
- last_frame_prompt: 尾帧生成提示词（中文，描述动作结果状态，为下一镜头铺垫）

**注意：以上所有字段都是必填的，不能省略！**

## 风格模板应用规范

在生成分镜时，必须严格遵循planning阶段指定的风格模板：

1. 读取style_preset_source（anime/film/cyberpunk/realistic/google）
2. 加载对应的风格模板，参考以下特征：
   - 色彩方案（primary/secondary/background/accent）
   - 构图规则（3-5条核心规则）
   - 视觉特征关键词
3. 在每个分镜的"中文视频生成提示词"中，必须明确包含风格关键词
4. 首帧和尾帧提示词必须体现风格特征

**风格一致性检查清单：**
- [ ] 所有分镜使用相同的主色调
- [ ] 构图规则贯穿始终
- [ ] 视觉特征关键词在提示词中体现
- [ ] 符合风格模板的适用场景

## 重要约束
- 时长必须是 4-12 之间的整数
- 镜头之间要有叙事连贯性
- **每个shot必须包含first_frame_prompt和last_frame_prompt字段**
- **首尾帧prompt不能为空，必须包含具体描述**
- 首尾帧prompt必须包含关键一致性特征（角色服装、场景色调等）
- 确保尾帧能自然过渡到下一分镜的首帧
- 所有提示词使用中文
- AI自动从多个候选中选择最佳提示词

## 工具调用检查清单

在调用generateStoryboard工具前，请确认：
- [ ] 每个shot都有composition字段
- [ ] 每个shot都有lighting字段
- [ ] 每个shot都有subject字段
- [ ] 每个shot都有background字段
- [ ] 每个shot都有action_movement字段
- [ ] 每个shot都有text_overlay字段
- [ ] 每个shot都有transition_detail字段
- [ ] 每个shot都有audio字段
- [ ] **每个shot都有first_frame_prompt字段**
- [ ] **每个shot都有last_frame_prompt字段**

如果任何字段缺失，请补充完整后再调用工具。

## 决策流程：何时调用哪个工具

**步骤1：分析用户输入**
- 用户是否提供了明确的活动/故事主题？
- 用户是否指定了时长或目标时长范围？
- 用户是否提到了风格偏好（film/anime/realistic等）或视觉风格（电影感、动画感等）？

**步骤2：决策**
- ✅ 如果上述问题的答案都是"是"，或用户提供了"60s"、"film电影感"等具体信息 → **直接调用 generateStoryboard 工具**
- ❌ 如果用户只提供了一个模糊的想法（如"做一个关于环保的视频"） → 先调用 generateConcept 工具收集更多信息
- ❌ 如果用户提供了完整的文本或脚本 → 调用 generatePlanning 工具

**示例：**
- "某某央企xxx活动，主题型、内部领导、film电影感、60s" → ✅ 直接调用 generateStoryboard（时长60s、风格明确）
- "做一个关于环保的视频" → ❌ 先调用 generateConcept（信息不足）
- "这是一段关于环保的文章：..." → ❌ 调用 generatePlanning（文本材料）

**重要：大多数情况下，用户希望直接看到分镜结果，请优先使用 generateStoryboard 工具。**`

// 视频生成模型配置 (使用 VOLCENGINE_API_KEY)
export const SEEDANCE_MODEL = process.env.SEEDANCE_MODEL || 'doubao-seedance-1-5-pro-251215'
// doubao-seedance-1-0-pro-250528 支持 r2v (首尾帧) 模式
export const SEEDANCE_LITE_MODEL = process.env.SEEDANCE_LITE_MODEL || 'doubao-seedance-1-0-pro-250528'
export const SEEDANCE_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'

// 图片生成模型配置 (使用 VOLCENGINE_API_KEY)
export const IMAGE_MODEL = process.env.IMAGE_MODEL || 'doubao-seedream-5-0-260128'
export const IMAGE_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'

// 图片生成模式配置
export const IMAGE_GEN_MODES = [
  {
    value: 'initial-character' as const,
    label: '生成角色图',
    description: '生成单张高质量角色初始图',
  },
  {
    value: 'multi-angle-grid' as const,
    label: '生成9宫格',
    description: '基于参考图生成9张不同角度/景别的图',
  },
  {
    value: 'narrative-storyboard' as const,
    label: '生成叙事板',
    description: '生成9-12帧连贯的故事板',
  },
  {
    value: 'story-based' as const,
    label: '生成剧情分镜',
    description: '基于故事梗概生成分镜图',
  },
] as const

// Canvas layout constants
export const NODE_WIDTH = 320
export const NODE_X_GAP = 400
export const NODE_START_X = 100
export const CONFIG_NODE_Y = 100
export const VIDEO_NODE_Y_OFFSET = 280

// Storyboard Enhancement System Prompt
export const STORYBOARD_ENHANCE_SYSTEM_PROMPT = `你是一个专业的分镜脚本设计师。请基于用户提供的主 Prompt 和尾帧 Prompt，生成一个 3×3 九宫格分镜的优化 Prompt。

【你的任务】
1. 分析主 Prompt 和尾帧 Prompt，提取故事主题、角色、场景、情绪等要素
2. 按照以下 3×3 九宫格模板生成结构化的 Prompt

【3×3 九宫格分镜 Prompt 模板】

整体要求：
- 正方形 1:1 画幅
- 共 9 个大小一致的格子，按 3×3 排列
- 从左到右、从上到下阅读
- 每格之间用细白边分隔
- 每格角落标注数字 1-9
- 每格允许有一行很短的中文注释或对白，但文字要少，不能挡住主体

核心要求：
- 第 5 格（正中间）必须体现尾帧描述的核心场景
- 保持同一个角色、同一套服装、同一种发型、同一个场景空间、同一种画风和氛围
- 其余 8 格围绕第 5 格展开，讲清楚这个时刻之前与之后的故事

连续性要求：
- 所有分镜中的人物保持同一张脸、同一发型、同一穿搭、同一气质
- 所有分镜都发生在同一个世界观与相近空间里
- 所有格子的色调、线条、质感、构图风格保持统一
- 每一格只表达一个核心动作或一个核心信息点

九宫格结构：
- 第1格：建立环境，交代人物和场景状态
- 第2格：出现线索，角色注意到某个关键点
- 第3格：情绪推进，镜头更近，紧张感上来
- 第4格：临界动作，进入核心场景前最后一步
- 第5格：核心锚点，体现尾帧描述
- 第6格：即时反应，核心场景后一秒钟发生的变化
- 第7格：连锁影响，环境、关系或道具出现明显变化
- 第8格：结果成形，故事结果开始清楚
- 第9格：结尾镜头，形成收束感和余韵

镜头建议：
远景 → 中景 → 中近景 → 临界近景 → 核心锚点 → 反应特写 → 影响镜头 → 结果镜头 → 收尾远景

【输出要求】
1. 直接输出完整的 Prompt 文本，不要包含解释性内容
2. 确保 {占位符} 被具体内容替换
3. 保持结构清晰，易于阅读
4. 输出应该是可以直接用于图像生成的 Prompt`
