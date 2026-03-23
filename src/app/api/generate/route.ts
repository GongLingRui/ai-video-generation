import { NextResponse } from 'next/server'
import { buildEnhancedPrompt, createVideoTask } from '@/lib/seedance'
import { isVideoModelKey, resolveVideoModelId, type VideoModelKey } from '@/lib/model-registry'
import type { ConfigNodeData } from '@/types'

// 验证图片 URL 格式
function validateImageUrl(url: string, fieldName: string): { valid: boolean; error?: string } {
  if (typeof url !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` }
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: `${fieldName} must use HTTPS` }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: `Invalid ${fieldName} format` }
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-ark-api-key') || undefined
    const body = await request.json()
    const {
      prompt,
      negativePrompt,
      techniques,
      ratio,
      duration,
      resolution,
      videoModelKey,
      firstFrameUrl,
      lastFrameUrl,
      referenceImageUrls,
      // Enhanced metadata fields
      sceneType,
      shotSize,
      transition,
      coreInfo,
      visualKeywords,
      characterFeatures,
      sceneFeatures,
      consistencyNotes,
      selectedPrompt,
      alternativePrompts,
      firstFramePrompt,
      lastFramePrompt,
      composition,
      lighting,
      subject,
      background,
      actionMovement,
      textOverlay,
      transitionDetail,
      audio,
      projectCharacterBible,
      projectSceneBible,
      projectStyleBible,
    } = body

    const coreText =
      String(selectedPrompt || prompt || '')
        .trim() || String(coreInfo || '').trim()
    if (!coreText) {
      return NextResponse.json(
        { error: '缺少有效提示内容', details: '请在节点中填写主提示词、精选提示词或核心信息' },
        { status: 400 }
      )
    }

    // 验证首帧图 URL
    if (firstFrameUrl !== undefined) {
      const validation = validateImageUrl(firstFrameUrl, 'firstFrameUrl')
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // 验证尾帧图 URL
    if (lastFrameUrl !== undefined) {
      const validation = validateImageUrl(lastFrameUrl, 'lastFrameUrl')
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // 验证参考图 URL 数组
    if (referenceImageUrls !== undefined) {
      if (!Array.isArray(referenceImageUrls)) {
        return NextResponse.json({ error: 'referenceImageUrls must be an array' }, { status: 400 })
      }
      for (let i = 0; i < referenceImageUrls.length; i++) {
        const validation = validateImageUrl(referenceImageUrls[i], `referenceImageUrls[${i}]`)
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }
      }
      // 参考图最多2张
      if (referenceImageUrls.length > 2) {
        return NextResponse.json({ error: 'Maximum 2 reference images allowed' }, { status: 400 })
      }
    }

    // 统一走增强拼接：包含主 prompt、运镜、八要素、首尾帧意图等；空内容时在 buildEnhancedPrompt 内回退 buildPrompt
    const nodeData: ConfigNodeData = {
      prompt: prompt || '',
      negativePrompt,
      techniques: techniques || [],
      ratio: ratio || '16:9',
      duration: duration || 5,
      resolution: resolution || '720p',
      status: 'idle',
      imageGenStatus: 'idle',
      imageGenHistory: [],
      availableGenModes: [],
      sceneType,
      shotSize,
      transition,
      coreInfo,
      visualKeywords,
      characterFeatures,
      sceneFeatures,
      consistencyNotes,
      selectedPrompt,
      alternativePrompts,
      firstFramePrompt,
      lastFramePrompt,
      composition,
      lighting,
      subject,
      background,
      actionMovement,
      textOverlay,
      transitionDetail,
      audio,
    }
    const fullPrompt = buildEnhancedPrompt(nodeData, {
      character: typeof projectCharacterBible === 'string' ? projectCharacterBible : undefined,
      scene: typeof projectSceneBible === 'string' ? projectSceneBible : undefined,
      style: typeof projectStyleBible === 'string' ? projectStyleBible : undefined,
    })

    const resolvedVideoModelKey: VideoModelKey | undefined =
      videoModelKey === undefined ? undefined : (isVideoModelKey(videoModelKey) ? videoModelKey : undefined)

    if (videoModelKey !== undefined && !resolvedVideoModelKey) {
      return NextResponse.json({ error: 'Invalid videoModelKey' }, { status: 400 })
    }

    console.log('[Generate API] firstFrameUrl:', firstFrameUrl ? 'present' : 'null', 'lastFrameUrl:', lastFrameUrl ? 'present' : 'null', 'videoModelKey:', videoModelKey, 'resolvedVideoModelKey:', resolvedVideoModelKey)

    const taskId = await createVideoTask(
      fullPrompt,
      ratio || '16:9',
      duration || 5,
      apiKey,
      firstFrameUrl,
      lastFrameUrl,
      referenceImageUrls,
      resolution || '720p',
      resolvedVideoModelKey ? resolveVideoModelId(resolvedVideoModelKey) : undefined
    )

    return NextResponse.json({ taskId, prompt: fullPrompt })
  } catch (error) {
    console.error('[Generate API Error]:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
