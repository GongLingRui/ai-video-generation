import { streamText } from 'ai'
import { getDoubaoModel } from '@/lib/volcengine'
import type { Shot } from '@/types'

export async function POST(request: Request) {
  // API密钥和端点ID从环境变量读取
  const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY
  const endpointId = process.env.DOUBAO_MODEL_ENDPOINT

  if (!apiKey) {
    throw new Error('DOUBAO_API_KEY not configured in .env.local')
  }
  if (!endpointId) {
    throw new Error('DOUBAO_MODEL_ENDPOINT not configured in .env.local')
  }

  try {
    const { shots } = await request.json()

    // 提取所有 text_overlay 内容
    const dialogues = shots
      .map((shot: Shot) => ({
        shotId: shot.id,
        shotTitle: shot.title,
        textOverlay: shot.text_overlay || '无',
        duration: shot.duration
      }))
      .filter((item: { shotId: number; shotTitle: string; textOverlay: string; duration: number }) => item.textOverlay !== '无')

    // 生成时间轴格式的 markdown
    const systemPrompt = [
      '你是一个专业的视频后期制作助手。',
      '根据提供的分镜文字叠加信息，生成一个时间轴格式的markdown文件，用于配音和字幕制作。',
      '',
      '输出格式要求：',
      '',
      '# 对白/旁白时间轴',
      '',
      '## 总览',
      '- 总时长: 计算所有分镜的总时长',
      '- 有文字叠加的分镜数: 统计有多少个分镜有文字内容',
      '- 适用场景: 配音参考、字幕制作、后期剪辑',
      '',
      '## 时间轴详细',
      '',
      '为每个有文字的分镜生成以下信息：',
      '',
      '### 分镜 序号: 标题',
      '- 时间码: 开始时间 - 结束时间（根据累积时长计算，格式：00:00:00）',
      '- 时长: 秒数',
      '- 文字内容: 具体文字',
      '- 配音建议: 根据文字内容建议配音风格、语速、情感',
      '- 字幕位置建议: 根据构图和画面内容建议字幕放置位置',
      '',
      '## 后期制作注意事项',
      '',
      '提供3-5条关于配音、字幕、音效的专业建议，包括：',
      '1. 配音风格统一性',
      '2. 字幕可读性',
      '3. 音频平衡',
      '4. 节奏控制',
      '5. 其他相关建议',
      '',
      '重要要求：',
      '- 时间码必须精确计算，基于每个分镜的累积时长',
      '- 配音建议要具体，包括情感、语速、停顿等',
      '- 字幕位置建议要考虑画面构图，避免遮挡主体',
      '- 后期制作建议要专业、实用',
      '- 输出必须是标准的 markdown 格式'
    ].join('\n')

    const result = streamText({
      model: getDoubaoModel(apiKey, endpointId),
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `请根据以下分镜信息生成台词时间轴：\n\n${JSON.stringify(dialogues, null, 2)}`
      }]
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[Dialogue Summary API] Error:', error)
    return new Response(
      JSON.stringify({
        error: '台词总结生成失败',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
