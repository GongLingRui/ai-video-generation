import { generateText } from 'ai'
import { getDoubaoModel } from '@/lib/volcengine'
import { STORYBOARD_ENHANCE_SYSTEM_PROMPT } from '@/lib/constants'
import { isChatModelKey, resolveChatEndpointId, type ChatModelKey } from '@/lib/model-registry'

export async function POST(request: Request) {
  try {
    // 1. 获取 API 密钥
    const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY
    const defaultEndpointId = process.env.DOUBAO_MODEL_ENDPOINT

    if (!apiKey) {
      console.error('[Enhance Prompt API] API Key not configured')
      return new Response(
        JSON.stringify({ error: 'API Key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 解析请求体
    const body = (await request.json()) as { mainPrompt?: string; currentPrompt?: string; chatModelKey?: ChatModelKey }
    const { mainPrompt, currentPrompt, chatModelKey } = body

    const resolvedChatModelKey: ChatModelKey | undefined =
      chatModelKey === undefined ? undefined : (isChatModelKey(chatModelKey) ? chatModelKey : undefined)

    if (chatModelKey !== undefined && !resolvedChatModelKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid chatModelKey' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const endpointId = resolvedChatModelKey ? resolveChatEndpointId(resolvedChatModelKey) : defaultEndpointId
    if (!endpointId) {
      return new Response(
        JSON.stringify({ error: 'DOUBAO_MODEL_ENDPOINT not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!mainPrompt && !currentPrompt) {
      console.error('[Enhance Prompt API] Missing prompt data')
      return new Response(
        JSON.stringify({ error: 'Missing prompt data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. 构建用户消息
    const userMessage = `主 Prompt：${mainPrompt || '无'}

当前尾帧 Prompt：${currentPrompt || '无'}

请基于以上信息，生成一个优化的 3×3 九宫格分镜 Prompt。`

    console.log('[Enhance Prompt API] Processing request:', {
      hasMainPrompt: !!mainPrompt,
      hasCurrentPrompt: !!currentPrompt,
      mainPromptLength: mainPrompt?.length || 0,
      currentPromptLength: currentPrompt?.length || 0,
    })

    // 4. 调用 AI (使用 generateText 而不是 streamText)
    const result = await generateText({
      model: getDoubaoModel(apiKey, endpointId),
      system: STORYBOARD_ENHANCE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
    })

    console.log('[Enhance Prompt API] Generation completed, text length:', result.text.length)

    // 5. 返回 JSON 响应
    return new Response(
      JSON.stringify({ enhancedPrompt: result.text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Enhance Prompt API] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to enhance prompt',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
