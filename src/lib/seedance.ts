import { SEEDANCE_MODEL, SEEDANCE_LITE_MODEL, SEEDANCE_BASE_URL, IMAGE_MODEL, IMAGE_BASE_URL } from '@/lib/constants'
import type { Technique, ImageGenMode, ConfigNodeData } from '@/types'

export function buildPrompt(userPrompt: string, techniques: Technique[], negativePrompt?: string): string {
  const parts: string[] = [userPrompt]

  const cameraIds = new Set([
    'low-angle', 'eye-level', 'high-angle', 'dutch-angle', 'birds-eye',
    'extreme-close-up', 'close-up', 'medium-shot', 'wide-shot', 'extreme-wide', 'over-shoulder',
    'push-in', 'pull-out', 'pan-left', 'pan-right', 'tilt-up', 'tilt-down',
    'tracking', 'orbit', 'zoom-in', 'zoom-out', 'crane', 'steadicam',
  ])

  const styleIds = new Set([
    'cinematic', 'documentary', 'music-video', 'slow-motion', 'timelapse',
    'montage', 'handheld', 'aerial', 'noir', 'vaporwave',
  ])

  const cameraKeywords = techniques
    .filter((t) => cameraIds.has(t.id))
    .map((t) => t.prompt_keyword)

  const styleKeywords = techniques
    .filter((t) => styleIds.has(t.id))
    .map((t) => t.prompt_keyword)

  if (cameraKeywords.length > 0) parts.push(`Camera: ${cameraKeywords.join(', ')}`)
  if (styleKeywords.length > 0) parts.push(`Style: ${styleKeywords.join(', ')}`)
  if (negativePrompt) parts.push(`Avoid: ${negativePrompt}`)

  return parts.join('. ') + '.'
}

/**
 * Enhanced prompt builder that incorporates all rich metadata from ConfigNodeData.
 * This significantly improves video generation quality by sending comprehensive
 * scene information to the video model.
 */
export type ProjectPromptBible = {
  character?: string
  scene?: string
  style?: string
}

export function buildEnhancedPrompt(nodeData: ConfigNodeData, projectBible?: ProjectPromptBible): string {
  const parts: string[] = []

  // Debug log
  console.log('[buildEnhancedPrompt] Input nodeData:', {
    hasSelectedPrompt: !!nodeData.selectedPrompt,
    hasPrompt: !!nodeData.prompt,
    hasSceneType: !!nodeData.sceneType,
    hasShotSize: !!nodeData.shotSize,
    hasComposition: !!nodeData.composition,
    hasLighting: !!nodeData.lighting,
    hasSubject: !!nodeData.subject,
    hasBackground: !!nodeData.background,
    techniquesCount: nodeData.techniques?.length || 0,
  })

  // 1. Core prompt (base user request or AI-selected prompt)
  const basePrompt = nodeData.selectedPrompt || nodeData.prompt
  if (basePrompt) parts.push(basePrompt)

  if (projectBible?.character?.trim()) {
    parts.push(`【项目-角色圣经】${projectBible.character.trim()}`)
  }
  if (projectBible?.scene?.trim()) {
    parts.push(`【项目-场景圣经】${projectBible.scene.trim()}`)
  }
  if (projectBible?.style?.trim()) {
    parts.push(`【项目-风格圣经】${projectBible.style.trim()}`)
  }

  // 2. Scene type and shot size
  const sceneDescriptions: string[] = []
  if (nodeData.sceneType) {
    const sceneTypeLabels: Record<string, string> = {
      'opening': '开场镜头',
      'dialogue': '对话镜头',
      'action': '动作镜头',
      'climax': '高潮镜头',
      'ending': '结尾镜头'
    }
    sceneDescriptions.push(`场景类型: ${sceneTypeLabels[nodeData.sceneType] || nodeData.sceneType}`)
  }
  if (nodeData.shotSize) {
    const shotSizeLabels: Record<string, string> = {
      'extreme-close-up': '极特写',
      'close-up': '特写',
      'medium': '中景',
      'wide': '全景',
      'extreme-wide': '远景'
    }
    sceneDescriptions.push(`景别: ${shotSizeLabels[nodeData.shotSize] || nodeData.shotSize}`)
  }
  if (nodeData.transition) {
    sceneDescriptions.push(`转场: ${nodeData.transition}`)
  }
  if (sceneDescriptions.length > 0) {
    parts.push(sceneDescriptions.join('，'))
  }

  // 3. 8 Elements (core visual components)
  const elementParts: string[] = []

  if (nodeData.subject) {
    elementParts.push(`主体: ${nodeData.subject}`)
  }
  if (nodeData.composition) {
    elementParts.push(`构图: ${nodeData.composition}`)
  }
  if (nodeData.lighting) {
    elementParts.push(`光线: ${nodeData.lighting}`)
  }
  if (nodeData.background) {
    elementParts.push(`背景: ${nodeData.background}`)
  }
  if (nodeData.actionMovement) {
    elementParts.push(`动作: ${nodeData.actionMovement}`)
  }
  if (nodeData.textOverlay && nodeData.textOverlay !== '无') {
    elementParts.push(`文字: ${nodeData.textOverlay}`)
  }
  if (nodeData.transitionDetail) {
    elementParts.push(`转场细节: ${nodeData.transitionDetail}`)
  }
  if (nodeData.audio && nodeData.audio !== '无旁白') {
    elementParts.push(`音频: ${nodeData.audio}`)
  }

  if (elementParts.length > 0) {
    parts.push('【视觉要素】' + elementParts.join('。') + '。')
  }

  // 4. Character and scene features (for consistency)
  if (nodeData.characterFeatures) {
    parts.push(`【角色特征】${nodeData.characterFeatures}`)
  }
  if (nodeData.sceneFeatures) {
    parts.push(`【场景特征】${nodeData.sceneFeatures}`)
  }
  if (nodeData.consistencyNotes) {
    parts.push(`【一致性要求】${nodeData.consistencyNotes}`)
  }

  // Keyframe intents (used for image generation; also guides video motion between frames)
  if (nodeData.firstFramePrompt?.trim()) {
    parts.push(`【首帧画面意图】${nodeData.firstFramePrompt.trim()}`)
  }
  if (nodeData.lastFramePrompt?.trim()) {
    parts.push(`【尾帧画面意图】${nodeData.lastFramePrompt.trim()}`)
  }

  // 5. Visual keywords
  if (nodeData.visualKeywords && Array.isArray(nodeData.visualKeywords) && nodeData.visualKeywords.length > 0) {
    parts.push(`关键词: ${nodeData.visualKeywords.join(', ')}`)
  }

  // 6. Core info (one-sentence summary)
  if (nodeData.coreInfo) {
    parts.push(`核心信息: ${nodeData.coreInfo}`)
  }

  // 7. Technique keywords (camera and style)
  const cameraIds = new Set([
    'low-angle', 'eye-level', 'high-angle', 'dutch-angle', 'birds-eye',
    'extreme-close-up', 'close-up', 'medium-shot', 'wide-shot', 'extreme-wide', 'over-shoulder',
    'push-in', 'pull-out', 'pan-left', 'pan-right', 'tilt-up', 'tilt-down',
    'tracking', 'orbit', 'zoom-in', 'zoom-out', 'crane', 'steadicam',
  ])

  const styleIds = new Set([
    'cinematic', 'documentary', 'music-video', 'slow-motion', 'timelapse',
    'montage', 'handheld', 'aerial', 'noir', 'vaporwave',
  ])

  const cameraKeywords = (nodeData.techniques || [])
    .filter((t) => t && cameraIds.has(t.id))
    .map((t) => t.prompt_keyword)

  const styleKeywords = (nodeData.techniques || [])
    .filter((t) => t && styleIds.has(t.id))
    .map((t) => t.prompt_keyword)

  if (cameraKeywords.length > 0) parts.push(`镜头: ${cameraKeywords.join(', ')}`)
  if (styleKeywords.length > 0) parts.push(`风格: ${styleKeywords.join(', ')}`)

  // 8. Negative prompt
  if (nodeData.negativePrompt) {
    parts.push(`避免: ${nodeData.negativePrompt}`)
  }

  if (parts.length === 0) {
    return buildPrompt(nodeData.prompt || '', nodeData.techniques || [], nodeData.negativePrompt)
  }

  const result = parts.join('。') + '。'
  console.log('[buildEnhancedPrompt] Output prompt length:', result.length)
  console.log('[buildEnhancedPrompt] Output prompt preview:', result.substring(0, 200))
  return result
}

export async function createVideoTask(
  prompt: string,
  ratio: string,
  duration: number,
  apiKey?: string,
  firstFrameUrl?: string,
  lastFrameUrl?: string,
  referenceImageUrls?: string[],
  resolution = '720p',
  model?: string
): Promise<string> {
  // 优先使用传入的apiKey，否则使用环境变量，确保与图片生成、文本生成逻辑一致
  const key = apiKey || process.env.VOLCENGINE_API_KEY
  if (!key) throw new Error('VOLCENGINE_API_KEY not configured in .env.local')

  // Seedance API accepts duration 4-12 (integer seconds)
  const clampedDuration = Math.max(4, Math.min(12, Math.round(duration)))

  // 如果同时提供了首帧和尾帧，需要使用支持 r2v 模式的模型
  // doubao-seedance-1-5-pro-251215 不支持 r2v (首尾帧生视频)，需要切换到 doubao-seedance-1-0-pro-250528
  const hasFirstFrame = !!firstFrameUrl
  const hasLastFrame = !!lastFrameUrl
  const usingR2VMode = hasFirstFrame && hasLastFrame

  let resolvedModel = model || SEEDANCE_MODEL
  console.log('[createVideoTask] model param:', model, 'resolvedModel:', resolvedModel, 'usingR2VMode:', usingR2VMode, 'SEEDANCE_MODEL:', SEEDANCE_MODEL)
  if (usingR2VMode && resolvedModel === SEEDANCE_MODEL) {
    console.log('[createVideoTask] Switching to SEEDANCE_LITE_MODEL for r2v support')
    resolvedModel = SEEDANCE_LITE_MODEL
  }

  // Build content array with optional images
  const content: Array<Record<string, unknown>> = []

  // 首帧图
  if (firstFrameUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: firstFrameUrl },
      role: 'first_frame',
    })
  }

  // 尾帧图
  if (lastFrameUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: lastFrameUrl },
      role: 'last_frame',
    })
  }

  // 参考图
  if (referenceImageUrls && referenceImageUrls.length > 0) {
    for (const url of referenceImageUrls) {
      content.push({
        type: 'image_url',
        image_url: { url },
        role: 'reference_image',
      })
    }
  }

  // 文本提示词
  content.push({ type: 'text', text: prompt })

  console.log('[createVideoTask] FINAL REQUEST - model:', resolvedModel, 'usingR2VMode:', usingR2VMode)

  const response = await fetch(`${SEEDANCE_BASE_URL}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      content,
      ratio,
      duration: clampedDuration,
      resolution,
      watermark: false,
      return_last_frame: true,
      generate_audio: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Seedance API Error]:', response.status, error)
    throw new Error(`Seedance API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  console.log('[Seedance API Success]: Task ID', data.id)
  return data.id
}

type VideoTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'expired'

export async function queryVideoTask(taskId: string, apiKey?: string): Promise<{
  status: VideoTaskStatus
  videoUrl?: string
  lastFrameUrl?: string
  error?: string
}> {
  // 优先使用传入的apiKey，否则使用环境变量，确保与图片生成、文本生成逻辑一致
  const key = apiKey || process.env.VOLCENGINE_API_KEY
  if (!key) throw new Error('VOLCENGINE_API_KEY not configured in .env.local')

  const response = await fetch(`${SEEDANCE_BASE_URL}/contents/generations/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Seedance query error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const status = (data.status?.toLowerCase() || 'queued') as VideoTaskStatus

  return {
    status,
    videoUrl: data.content?.video_url,
    lastFrameUrl: data.content?.last_frame_url,
    error: data.error?.message,
  }
}

// ===== 图片生成相关函数 =====

// 提示词模板
const PROMPT_TEMPLATES = {
  'initial-character': (userPrompt: string) => {
    return `超写实电影感半身肖像，${userPrompt}。身着精致服装，配有细节配饰。皮肤纹理真实，可见细微颗粒与瑕疵。正对镜头，表情自然。电影布光，主光分明，侧逆光勾勒轮廓。85mm焦段拍摄，浅景深，背景柔和虚化。电影色调，高动态范围，轻微胶片颗粒感。比例精准，写实主义，无画面畸变。`
  },

  'multi-angle-grid': (userPrompt: string, referenceImageDesc: string) => {
    return `<指令> 分析输入图像的整体构图。识别所有出现的关键主体及其空间关系与互动。生成一张和谐统一的 3x3 矩阵"电影镜头索引页"，在相同环境中展示这组主体的 9 个不同摄影镜头。
第一排（交代环境）：1. 大远景 (ELS) 2. 全景 (LS) 3. 中远景 (3-4镜头)
第二排（核心覆盖）：4. 中景 (MS) 5. 中特写 (MCU) 6. 特写 (CU)
第三排（细节与角度）：7. 大特写 (ECU) 8. 低角度镜头 9. 高角度镜头
确保严格的一致性：9 个面板中必须保持相同的人物/物体、相同的服装和相同的光影。景深应随景别真实变化。
参考图描述：${referenceImageDesc}
用户需求：${userPrompt}`
  },

  'multi-angle': (userPrompt: string, referenceImageDesc: string) => {
    return `<指令> 分析输入图像的整体构图。识别所有出现的关键主体及其空间关系与互动。生成一张和谐统一的 3x3 矩阵"电影镜头索引页"，在相同环境中展示这组主体的 9 个不同摄影镜头。
第一排（交代环境）：1. 大远景 (ELS) 2. 全景 (LS) 3. 中远景 (3-4镜头)
第二排（核心覆盖）：4. 中景 (MS) 5. 中特写 (MCU) 6. 特写 (CU)
第三排（细节与角度）：7. 大特写 (ECU) 8. 低角度镜头 9. 高角度镜头
确保严格的一致性：9 个面板中必须保持相同的人物/物体、相同的服装和相同的光影。景深应随景别真实变化。
参考图描述：${referenceImageDesc}
用户需求：${userPrompt}`
  },

  'narrative': (userPrompt: string, referenceImageDesc: string) => {
    return `<角色> 您是一位屡获殊荣的预告片导演 + 摄影指导 + 分镜师。您的任务是：将一张参考图转化为一个连贯的电影短片序列，并输出可供 AI 视频生成的关键帧。
第 4 步 - AI 视频关键帧 (Keyframes for AI Video)
默认输出 9-12 帧（随后汇编至一张总图）。每帧必须是同一环境下逻辑连贯的延续。
每帧格式： [KF# | 建议时长 (秒) | 镜头类型]
参考图：${referenceImageDesc}
用户需求：${userPrompt}
输出一张完整的 3x3 联络单大图（包含所有关键帧）。`
  },

  'story': (userPrompt: string, referenceImageDesc?: string) => {
    const refPart = referenceImageDesc ? `\n参考图：${referenceImageDesc}` : ''
    return `故事梗概：${userPrompt}${refPart}
重要提示：为图像创建详细的提示词。图像提示词必须参考用户提供的故事和参考图。
创建一个完整的 3×3 电影感分镜网格，包含同一主体在同一环境下的 9 个不同镜头，保持服装、光影和氛围的高度一致。
第一排 —— 交代环境：1. 大远景 (ELS) 2. 全景 (LS) 3. 中远景 (MLS)
第二排 —— 核心覆盖：4. 中景 (MS) 5. 中特写 (MCU) 6. 特写 (CU)
第三排 —— 细节与角度：7. 大特写 (ECU) 8. 低角度镜头 9. 高角度镜头
全局要求：所有 9 帧中必须是相同的图像主体、相同的服装、相同的光影条件和调色方案`
  }
}

export function buildImagePrompt(
  mode: ImageGenMode,
  userPrompt: string,
  referenceImageDesc?: string
): string {
  const template = PROMPT_TEMPLATES[mode as keyof typeof PROMPT_TEMPLATES]
  if (!template) {
    throw new Error(`Unsupported image generation mode: ${mode}`)
  }

  // 处理不同参数数量的模板函数
  if (mode === 'initial-character') {
    // 单参数模板
    return (template as (userPrompt: string) => string)(userPrompt)
  }

  // 双参数模板
  return (template as (userPrompt: string, referenceImageDesc: string) => string)(
    userPrompt,
    referenceImageDesc || ''
  )
}

export async function createImageTask(
  prompt: string,
  mode: ImageGenMode,
  apiKey?: string,
  model?: string
): Promise<{ taskId?: string; imageUrl?: string }> {
  // 优先使用传入的apiKey，否则使用环境变量，确保与视频生成、文本生成逻辑一致
  const key = apiKey || process.env.VOLCENGINE_API_KEY
  if (!key) throw new Error('VOLCENGINE_API_KEY not configured in .env.local')

  const response = await fetch(`${IMAGE_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || IMAGE_MODEL,
      prompt,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '2K',
      stream: false,
      // Align with video generation (no watermark) so reference frames match final look
      watermark: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Image generation API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  console.log('[createImageTask] ARK API response:', JSON.stringify(data, null, 2))

  // Check for direct image URL response (when response_format: "url" and stream: false)
  const imageUrl = data.data?.[0]?.url || data.image_url || data.url

  // If we have a URL directly, return it (no polling needed)
  if (imageUrl) {
    console.log('[createImageTask] Got direct image URL:', imageUrl)
    return { imageUrl }
  }

  // Otherwise, look for task ID (async mode)
  const taskId = data.id || data.task_id || data.data?.id || data.data?.task_id

  if (taskId) {
    console.log('[createImageTask] Got task ID, will poll:', taskId)
    return { taskId }
  }

  console.error('[createImageTask] No task ID or image URL found in response:', data)
  throw new Error('Image generation API did not return a task ID or image URL')
}

export async function queryImageTask(taskId: string, apiKey?: string): Promise<{
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'expired'
  imageUrl?: string
  error?: string
}> {
  // 优先使用传入的apiKey，否则使用环境变量，确保与视频生成、文本生成逻辑一致
  const key = apiKey || process.env.VOLCENGINE_API_KEY
  if (!key) throw new Error('VOLCENGINE_API_KEY not configured in .env.local')

  // Try multiple possible endpoint paths
  const possiblePaths = [
    `${IMAGE_BASE_URL}/images/generations/${taskId}`,
    `${IMAGE_BASE_URL}/images/generations/tasks/${taskId}`,
    `${IMAGE_BASE_URL}/tasks/${taskId}`,
  ]

  let lastError: Error | null = null

  for (const path of possiblePaths) {
    try {
      const response = await fetch(path, {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const raw = String(data.status?.toLowerCase() || 'queued')
        const status = raw as 'queued' | 'running' | 'succeeded' | 'failed' | 'expired'

        return {
          status,
          imageUrl: data.data?.[0]?.url || data.content?.image_url || data.imageUrl,
          error: data.error?.message,
        }
      }

      const errorText = await response.text()
      lastError = new Error(`Path ${path} returned ${response.status}: ${errorText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError || new Error('All query paths failed')
}
