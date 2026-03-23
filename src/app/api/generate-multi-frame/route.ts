import { createImageTask } from '@/lib/seedance'
import type { ImageGenMode } from '@/types'
import { isImageModelKey, resolveImageModelId, type ImageModelKey } from '@/lib/model-registry'

export async function POST(request: Request) {
  console.log('[Generate Multi-Frame API] ===== Request started =====')

  try {
    // 1. 获取 API 密钥
    const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY
    const endpointId = process.env.DOUBAO_MODEL_ENDPOINT

    console.log('[Generate Multi-Frame API] API Key check:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 8) + '...',
    })

    if (!apiKey) {
      console.error('[Generate Multi-Frame API] API Key not configured')
      return new Response(
        JSON.stringify({ error: 'API Key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 解析请求体
    let body
    try {
      body = await request.json()
      console.log('[Generate Multi-Frame API] Request body parsed successfully')
    } catch (parseError) {
      console.error('[Generate Multi-Frame API] Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, mainPrompt, imageModelKey } = body as {
      prompt?: string
      mainPrompt?: string
      imageModelKey?: ImageModelKey
    }

    console.log('[Generate Multi-Frame API] Extracted parameters:', {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasMainPrompt: !!mainPrompt,
      mainPromptLength: mainPrompt?.length || 0,
    })

    if (!prompt) {
      console.error('[Generate Multi-Frame API] Missing prompt')
      return new Response(
        JSON.stringify({ error: 'Missing prompt parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const resolvedImageModelKey: ImageModelKey | undefined =
      imageModelKey === undefined ? undefined : (isImageModelKey(imageModelKey) ? imageModelKey : undefined)

    if (imageModelKey !== undefined && !resolvedImageModelKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid imageModelKey' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. 构建九宫格 Prompt - 一张图片包含9个画面
    const backgroundInfo = mainPrompt ? `\n主故事背景: ${mainPrompt}\n` : ''
    const gridPrompt = `${prompt}${backgroundInfo}
【重要】请生成一张 3x3 九宫格分镜图，要求:
- 正方形画幅 (1:1)
- 一张图片包含9个画面，按3x3网格排列
- 从左到右、从上到下阅读
- 每格之间用细白边分隔
- 每格角落标注数字1-9
- 每个画面讲述故事的一个瞬间
- 保持角色、场景、风格的一致性

九宫格结构:
- 第1格: 建立环境
- 第2格: 出现线索
- 第3格: 情绪推进
- 第4格: 临界动作
- 第5格: 核心锚点
- 第6格: 即时反应
- 第7格: 连锁影响
- 第8格: 结果成形
- 第9格: 结尾镜头

输出: 一张完整的3x3九宫格图片，高清画质。`

    console.log('[Generate Multi-Frame API] Grid prompt constructed, length:', gridPrompt.length)

    // 4. 直接调用图片生成函数（避免不必要的 HTTP 调用）
    console.log('[Generate Multi-Frame API] Calling createImageTask...')

    let generateResult
    try {
      generateResult = await createImageTask(
        gridPrompt,
        'initial-character' as ImageGenMode,
        undefined,
        resolvedImageModelKey ? resolveImageModelId(resolvedImageModelKey) : undefined
      )
      console.log('[Generate Multi-Frame API] createImageTask result:', {
        hasImageUrl: !!generateResult.imageUrl,
        hasTaskId: !!generateResult.taskId,
      })
    } catch (taskError) {
      console.error('[Generate Multi-Frame API] createImageTask failed:', taskError)
      const errorMessage = taskError instanceof Error ? taskError.message : String(taskError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. 返回单张图片的 URL
    if (generateResult.imageUrl) {
      console.log('[Generate Multi-Frame API] Success, returning imageUrl')
      return new Response(
        JSON.stringify({
          imageUrl: generateResult.imageUrl,
          success: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else if (generateResult.taskId) {
      // 如果返回 taskId，说明是异步生成
      console.log('[Generate Multi-Frame API] Task created, returning taskId')
      return new Response(
        JSON.stringify({
          taskId: generateResult.taskId,
          message: '九宫格生成任务已创建',
        }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('[Generate Multi-Frame API] Unexpected result:', generateResult)
      return new Response(
        JSON.stringify({ error: 'Image generation did not return URL or task ID' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('[Generate Multi-Frame API] Unhandled error:', error)
    console.error('[Generate Multi-Frame API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
