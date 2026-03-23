import { NextRequest, NextResponse } from 'next/server'
import { createImageTask } from '@/lib/seedance'
import type { ImageGenMode } from '@/types'
import { isImageModelKey, resolveImageModelId, type ImageModelKey } from '@/lib/model-registry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, mode, imageModelKey } = body as {
      prompt: string
      mode: ImageGenMode
      imageModelKey?: ImageModelKey
    }

    if (!prompt || !mode) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 添加30秒超时处理
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const resolvedImageModelKey: ImageModelKey | undefined =
        imageModelKey === undefined ? undefined : (isImageModelKey(imageModelKey) ? imageModelKey : undefined)

      if (imageModelKey !== undefined && !resolvedImageModelKey) {
        return NextResponse.json({ error: 'Invalid imageModelKey' }, { status: 400 })
      }

      // API key从服务端环境变量读取
      const result = await createImageTask(
        prompt,
        mode,
        undefined,
        resolvedImageModelKey ? resolveImageModelId(resolvedImageModelKey) : undefined
      )
      clearTimeout(timeoutId)

      console.log('[generate-frame] API result:', result)
      return NextResponse.json(result)
    } catch (error) {
      clearTimeout(timeoutId)

      // 处理超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ error: '生成超时，请重试' }, { status: 504 })
      }
      throw error
    }
  } catch (error) {
    console.error('[generate-frame] Error:', error)
    const message = error instanceof Error ? error.message : '生成帧失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
