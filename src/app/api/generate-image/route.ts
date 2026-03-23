import { NextRequest, NextResponse } from 'next/server'
import { createImageTask, buildImagePrompt } from '@/lib/seedance'
import type { ImageGenMode } from '@/types'
import { isImageModelKey, resolveImageModelId, type ImageModelKey } from '@/lib/model-registry'

export async function POST(request: NextRequest) {
  try {
    console.log('[generate-image] Request received')
    const body = await request.json()
    console.log('[generate-image] Request body:', {
      hasMode: !!body.mode,
      mode: body.mode,
      hasPrompt: !!body.prompt,
      promptLength: body.prompt?.length,
      skipTemplate: body.skipTemplate,
    })

    const { mode, prompt, skipTemplate = false, imageModelKey } = body as {
      mode: ImageGenMode
      prompt: string
      skipTemplate?: boolean
      imageModelKey?: ImageModelKey
    }

    if (!mode || !prompt) {
      console.error('[generate-image] Missing parameters')
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const arkApiKey = request.headers.get('x-ark-api-key') || undefined
    const resolvedImageModelKey: ImageModelKey | undefined =
      imageModelKey === undefined ? undefined : (isImageModelKey(imageModelKey) ? imageModelKey : undefined)

    if (imageModelKey !== undefined && !resolvedImageModelKey) {
      return NextResponse.json({ error: 'Invalid imageModelKey' }, { status: 400 })
    }

    // 如果 skipTemplate 为 true，直接使用 prompt，否则通过模板构建
    const finalPrompt = skipTemplate ? prompt : buildImagePrompt(mode, prompt)
    console.log('[generate-image] Final prompt length:', finalPrompt.length)

    console.log('[generate-image] Calling createImageTask...')
    const result = await createImageTask(
      finalPrompt,
      mode,
      arkApiKey,
      resolvedImageModelKey ? resolveImageModelId(resolvedImageModelKey) : undefined
    )

    console.log('[generate-image] API result:', {
      hasImageUrl: !!result.imageUrl,
      hasTaskId: !!result.taskId,
      keys: Object.keys(result),
    })
    return NextResponse.json({ ...result, prompt: finalPrompt })
  } catch (error) {
    console.error('[generate-image] Error:', error)
    console.error('[generate-image] Error stack:', error instanceof Error ? error.stack : 'No stack')
    const message = error instanceof Error ? error.message : '创建任务失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
