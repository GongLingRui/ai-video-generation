import { streamText, tool } from 'ai'
import { z } from 'zod'
import { getDoubaoModel } from '@/lib/volcengine'
import { STORYBOARD_SYSTEM_PROMPT, checkEightElements } from '@/lib/constants'
import type { ConceptResult, CreativeType, StylePreset } from '@/types/concept'
import type { PlanningResult, SourceType } from '@/types/planning'
import type { StoryboardResult } from '@/types/chat'
import { isChatModelKey, resolveChatEndpointId, type ChatModelKey } from '@/lib/model-registry'

// 将 @ai-sdk/react v3 的消息格式转换为旧版 AI SDK 格式
function convertMessages(messages: any[]): any[] {
  console.log('[convertMessages] 输入消息数量:', messages.length)
  console.log('[convertMessages] 原始消息:', JSON.stringify(messages, null, 2))

  const result = messages
    .map((msg, index) => {
      console.log(`[convertMessages] 处理消息 ${index}:`, {
        role: msg.role,
        hasContent: !!msg.content,
        contentType: typeof msg.content,
        hasParts: !!msg.parts,
        partsType: Array.isArray(msg.parts) ? 'array' : typeof msg.parts,
      })

      // 如果是旧格式（有 content 字符串），直接返回
      if (typeof msg.content === 'string') {
        console.log(`[convertMessages] 消息 ${index} 是旧格式，直接返回`)
        return msg
      }

      // 处理新格式：提取文本内容
      let textContent = ''

      // 情况1: content 是数组（旧版本的某些格式）
      if (msg.content && Array.isArray(msg.content)) {
        const textParts = msg.content.filter((part: any) => part.type === 'text')
        console.log(`[convertMessages] 消息 ${index} content 是数组，找到 ${textParts.length} 个文本部分`)
        textContent = textParts.map((part: any) => part.text).join('')
      }
      // 情况2: parts 是数组（@ai-sdk/react v3 格式）
      else if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((part: any) => part.type === 'text')
        console.log(`[convertMessages] 消息 ${index} parts 是数组，找到 ${textParts.length} 个文本部分`)
        textContent = textParts.map((part: any) => part.text).join('')
      }
      // 情况3: content 是对象
      else if (msg.content && typeof msg.content === 'object') {
        console.log(`[convertMessages] 消息 ${index} content 是对象`)
        textContent = msg.content.text || ''
      }

      // 返回旧格式
      const converted = {
        role: msg.role,
        content: textContent,
      }

      console.log(`[convertMessages] 消息 ${index} 转换结果:`, {
        role: converted.role,
        contentLength: converted.content.length,
        contentPreview: converted.content.substring(0, 100),
      })

      // 验证转换后的消息，过滤空内容
      if (!textContent || textContent.trim() === '') {
        console.warn(`[convertMessages] 跳过空内容消息 ${index}:`, msg.role, msg)
        return null
      }

      return converted
    })
    .filter((msg) => msg !== null) // 移除 null 值

  console.log('[convertMessages] 输出消息数量:', result.length)
  console.log('[convertMessages] 转换后消息:', JSON.stringify(result, null, 2))

  return result
}

export async function POST(request: Request) {
  // API密钥和端点ID从环境变量读取，不再从前端传递
  const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY
  const defaultEndpointId = process.env.DOUBAO_MODEL_ENDPOINT

  if (!apiKey) {
    throw new Error('DOUBAO_API_KEY not configured in .env.local')
  }
  if (!defaultEndpointId) {
    throw new Error('DOUBAO_MODEL_ENDPOINT not configured in .env.local')
  }

  const { messages, chatModelKey, pipelineContext } = (await request.json()) as {
    messages: any[]
    chatModelKey?: ChatModelKey
    pipelineContext?: {
      currentStage?: string
      hasConcept?: boolean
      hasPlanning?: boolean
    }
  }
  const resolvedChatModelKey: ChatModelKey | undefined =
    chatModelKey === undefined ? undefined : (isChatModelKey(chatModelKey) ? chatModelKey : undefined)

  if (chatModelKey !== undefined && !resolvedChatModelKey) {
    return new Response(JSON.stringify({ error: 'Invalid chatModelKey' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const endpointId = resolvedChatModelKey ? resolveChatEndpointId(resolvedChatModelKey) : defaultEndpointId
  if (!endpointId) {
    throw new Error('Chat endpointId not configured')
  }

  // 获取最新的用户消息内容用于8要素检查
  const lastMessage = messages[messages.length - 1]
  let userContent = ''
  if (lastMessage) {
    if (typeof lastMessage.content === 'string') {
      userContent = lastMessage.content
    } else if (lastMessage.content && Array.isArray(lastMessage.content)) {
      userContent = lastMessage.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('')
    } else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      userContent = lastMessage.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('')
    }
  }

  // 检查8要素完整性
  const { isComplete, missingElements, suggestions } = checkEightElements(userContent)

  // 仅在严重缺信息时追加「先追问」提示，避免短但完整的约束被误判（见 lib/constants checkEightElements）
  let enhancedSystemPrompt = STORYBOARD_SYSTEM_PROMPT
  if (!isComplete && missingElements.length > 6) {
    enhancedSystemPrompt += `\n\n【重要】用户当前提供的信息缺少以下要素：${missingElements.join('、')}。请先追问这些要素，等收集到足够信息后再生成分镜脚本。\n\n建议追问顺序：\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
  }

  if (pipelineContext?.currentStage) {
    enhancedSystemPrompt += `\n\n【三阶段流水线 — 客户端状态】当前阶段标签：${pipelineContext.currentStage}；已完成概念工具：${pipelineContext.hasConcept ? '是' : '否'}；已完成规划工具：${pipelineContext.hasPlanning ? '是' : '否'}。
若用户已在单次消息中给出可执行的创作约束（如创意类型/时长/受众/风格等），请直接调用 generateStoryboard 生成分镜表，无需为了「走满三阶段」而强行先调用 generateConcept 或 generatePlanning。
仅在用户只给出模糊一句话、或明确要求分步构思时，再使用 generateConcept / generatePlanning。`
  }

  // 转换消息格式
  const convertedMessages = convertMessages(messages)

  // 验证转换后的消息不为空
  if (convertedMessages.length === 0) {
    return new Response(
      JSON.stringify({
        error: '消息格式转换失败',
        details: '没有有效的消息内容'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('[Chat API] 准备调用 streamText')
    console.log('[Chat API] API Key configured:', !!apiKey)
    console.log('[Chat API] Endpoint ID:', endpointId)
    console.log('[Chat API] 转换后的消息数量:', convertedMessages.length)

    const result = streamText({
      model: getDoubaoModel(apiKey, endpointId),
      system: enhancedSystemPrompt,
      messages: convertedMessages,
      tools: {
        // ===== 工具1: generateConcept - 阶段1：创意构思 =====
        generateConcept: tool({
          description: '根据用户核心创意生成视频概念构思，包含创意分析、风格预设、场景拆分',

          inputSchema: z.object({
            concept_id: z.string(),
            creative_analysis: z.object({
              core_idea: z.string(),
              creative_type: z.enum(['story', 'visual', 'theme']),
              target_audience: z.string(),
              estimated_duration: z.string(),
            }),
            style_preset: z.object({
              style_name: z.enum(['anime', 'film', 'cyberpunk', 'realistic', 'google']),
              style_characteristics: z.object({
                color_scheme: z.object({
                  primary: z.string(),
                  secondary: z.string(),
                  background: z.string(),
                  accent: z.string(),
                }),
                mood: z.string(),
                composition_rules: z.array(z.string()),
                visual_keywords: z.array(z.string()),
              }),
            }),
            scene_breakdown: z.array(
              z.object({
                scene_id: z.string(),
                duration: z.number(),
                function: z.enum(['opening', 'development', 'climax', 'ending']),
                core_info: z.string(),
                suggested_shot: z.enum(['wide', 'medium', 'closeup', 'extreme_closeup']),
                transition: z.enum(['cut', 'fade', 'push', 'dissolve']),
                ai_notes: z.object({
                  avoid: z.array(z.string()),
                  recommend: z.array(z.string()),
                  risk_level: z.enum(['low', 'medium', 'high']),
                }),
              })
            ),
            next_step_recommendation: z.enum(['quick_path', 'enhanced_path']),
          }),

          execute: async (input) => {
            console.log('[Tool] generateConcept 被调用')
            return input
          },
        }),

        // ===== 工具2: generatePlanning - 阶段2：视频规划 =====
        generatePlanning: tool({
          description: '根据输入源（专业分镜脚本/普通文本/创意概念）生成视频规划方案',

          inputSchema: z.object({
            planning_id: z.string(),
            source_type: z.enum(['A', 'B', 'C']),
            content_analysis: z.object({
              source_material: z.string(),
              core_info_points: z.array(z.string()),
              narrative_strategy: z.string(),
              total_duration_estimate: z.string(),
            }),
            storyboard_plan: z.object({
              total_shots: z.number(),
              narrative_shots: z.array(
                z.object({
                  shot_id: z.string(),
                  duration: z.number(),
                  shot_type: z.literal('narrative'),
                  shot_size: z.enum(['wide', 'medium', 'closeup', 'extreme_closeup']),
                  transition: z.enum(['cut', 'fade', 'push', 'dissolve']),
                  core_info: z.string(),
                  camera_angle: z.enum(['high', 'eye_level', 'low', 'dutch']),
                  composition_notes: z.string(),
                })
              ),
              auxiliary_shots: z.array(
                z.object({
                  shot_id: z.string(),
                  duration: z.number(),
                  shot_type: z.literal('narrative'),
                  shot_size: z.enum(['wide', 'medium', 'closeup', 'extreme_closeup']),
                  transition: z.enum(['cut', 'fade', 'push', 'dissolve']),
                  core_info: z.string(),
                  camera_angle: z.enum(['high', 'eye_level', 'low', 'dutch']),
                  composition_notes: z.string(),
                })
              ),
            }),
            style_definition: z.object({
              style_preset_source: z.enum(['anime', 'film', 'cyberpunk', 'realistic', 'google']),
              color_scheme: z.object({
                primary: z.string(),
                secondary: z.string(),
                background: z.string(),
                accent: z.string(),
              }),
              composition_rules: z.array(z.string()),
              nano_banana_prompt_template: z.string(),
            }),
          }),

          execute: async (input) => {
            console.log('[Tool] generatePlanning 被调用')
            return input
          },
        }),

        // ===== 工具3: generateStoryboard - 阶段3：分镜脚本（扩展） =====
        generateStoryboard: tool({
          description: '根据视频规划方案生成详细分镜脚本，包含总览表格和独立分镜文件',

          inputSchema: z.object({
            overview: z.object({
              total_shots: z.number(),
              total_duration: z.number(),
              style_profile: z.object({
                color_scheme: z.string(),
                mood: z.string(),
                visual_style: z.string(),
              }),
              consistency_report: z.object({
                character_consistency: z.boolean(),
                scene_consistency: z.boolean(),
                style_consistency: z.boolean(),
                notes: z.array(z.string()),
              }),
            }),
            shots: z.array(
              z.object({
                // 现有字段（保持向后兼容）
                id: z.number(),
                title: z.string(),
                description: z.string(),
                suggested_techniques: z.array(z.string()),
                duration: z.number(),
                ratio: z.string(),

                // 扩展字段
                scene_type: z.string().optional(),
                shot_size: z.string().optional(),
                transition: z.string().optional(),
                core_info: z.string().optional(),
                visual_keywords: z.array(z.string()).optional(),
                character_features: z.string().optional(),
                scene_features: z.string().optional(),
                consistency_notes: z.string().optional(),

                // Nano Banana提示词（AI自动选择最佳）
                selected_prompt: z.string().optional(),
                alternative_prompts: z.array(z.string()).optional(),

                // 首尾帧提示词（必填）
                first_frame_prompt: z.string().describe('首帧生成提示词：中文，描述静态初始状态、构图、光线、色调，用于生成首帧图'),
                last_frame_prompt: z.string().describe('尾帧生成提示词：中文，描述动作结果状态、最终构图、光线变化，为下一镜头铺垫'),

                // 8要素字段（必填）
                composition: z.string().describe('构图：详细的构图描述，包括主体位置、视角、构图方式、景深控制'),
                lighting: z.string().describe('光线：详细的光线描述，包括光源方向、光质、光影对比度、光线氛围'),
                subject: z.string().describe('主体：主体详细描述，包括人物特征、物体特征、主体状态'),
                background: z.string().describe('背景：背景详细描述，包括环境特征、空间关系、背景元素、色彩基调'),
                action_movement: z.string().describe('动作/运动：动作和运动描述，包括主体动作、镜头运动、运动速度、运动轨迹'),
                text_overlay: z.string().describe('文字叠加：本镜头需要叠加的文字内容，如无则填"无"'),
                transition_detail: z.string().describe('转场：转场详细描述，包括转场类型、时机、效果、衔接方式'),
                audio: z.string().describe('音频：音频建议，包括背景音乐、音效、旁白、音频氛围'),
              })
            ),
          }),

          execute: async (input) => {
            console.log('[Tool] generateStoryboard 被调用')
            console.log('[Tool] 分镜数量:', input.shots.length)
            console.log('[Tool] overview:', JSON.stringify(input.overview, null, 2))

            // 验证必填字段完整性（8要素 + 首尾帧）
            const requiredFields = ['composition', 'lighting', 'subject', 'background',
                                   'action_movement', 'text_overlay', 'transition_detail', 'audio',
                                   'first_frame_prompt', 'last_frame_prompt']

            for (const shot of input.shots) {
              const missingFields = requiredFields.filter(field => !shot[field as keyof typeof shot])
              if (missingFields.length > 0) {
                console.warn(`[Tool] Shot ${shot.id} missing required fields:`, missingFields)
              }
            }

            console.log('[Tool] 准备返回结果给AI SDK')
            console.log('[Tool] 返回数据结构:', {
              hasOverview: !!input.overview,
              overviewKeys: input.overview ? Object.keys(input.overview) : [],
              shotsCount: input.shots?.length,
              firstShotKeys: input.shots?.[0] ? Object.keys(input.shots[0]) : []
            })

            // 确保返回值是可序列化的纯对象
            const result = {
              overview: input.overview,
              shots: input.shots
            }

            console.log('[Tool] 返回结果，shots数量:', result.shots.length)
            return result
          },
        }),
      },
      temperature: 0.7,
    })

    console.log('[Chat API] streamText 调用成功，准备返回响应')
    const response = result.toUIMessageStreamResponse()
    console.log('[Chat API] 返回响应类型:', response.constructor.name)
    console.log('[Chat API] 响应headers:', Object.fromEntries(response.headers.entries()))

    // 添加额外的响应头确保流式传输正常
    response.headers.set('X-Stream-Response', 'true')

    return response
  } catch (error) {
    console.error('[Chat API] Error:', error)
    return new Response(
      JSON.stringify({
        error: '对话处理失败',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
