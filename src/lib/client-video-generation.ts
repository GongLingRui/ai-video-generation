import type { ConfigNodeData } from '@/types'
import type { GlobalConfig } from '@/stores/canvas-store'
import { useCanvasStore } from '@/stores/canvas-store'
export type VideoGenBible = {
  character?: string
  scene?: string
  style?: string
}

export type BuildVideoRequestBodyOptions = {
  nodeData: ConfigNodeData
  globalConfig: GlobalConfig
  firstFrameUrl?: string
  lastFrameUrl?: string
  referenceImageUrls?: string[]
  bible?: VideoGenBible
}

export function resolveVideoReferenceInputs(
  configNodeId: string,
  nodeData: ConfigNodeData,
  globalConfig: GlobalConfig
): { firstFrameUrl?: string; lastFrameUrl?: string; referenceImageUrls?: string[] } {
  const currentMode = nodeData.referenceFrameMode || globalConfig.referenceFrameMode

  if (currentMode === 'multi-frame' && nodeData.multiFrameImageUrl) {
    return {
      referenceImageUrls: [nodeData.multiFrameImageUrl],
    }
  }

  const chainFirstFrameUrl = useCanvasStore.getState().getPreviousNodeLastFrame(configNodeId)
  return {
    firstFrameUrl: nodeData.firstFrameUrl || chainFirstFrameUrl,
    lastFrameUrl: nodeData.lastFrameUrl,
    referenceImageUrls: nodeData.referenceImageUrls,
  }
}

export function buildVideoGenerationRequestBody(options: BuildVideoRequestBodyOptions): Record<string, unknown> {
  const { nodeData, globalConfig, firstFrameUrl, lastFrameUrl, referenceImageUrls, bible } = options
  return {
    prompt: nodeData.prompt,
    negativePrompt: nodeData.negativePrompt,
    techniques: nodeData.techniques,
    ratio: nodeData.ratio,
    duration: nodeData.duration,
    resolution: nodeData.resolution,
    videoModelKey: globalConfig.videoModelKey,
    firstFrameUrl,
    lastFrameUrl,
    referenceImageUrls,
    sceneType: nodeData.sceneType,
    shotSize: nodeData.shotSize,
    transition: nodeData.transition,
    coreInfo: nodeData.coreInfo,
    visualKeywords: nodeData.visualKeywords,
    characterFeatures: nodeData.characterFeatures,
    sceneFeatures: nodeData.sceneFeatures,
    consistencyNotes: nodeData.consistencyNotes,
    selectedPrompt: nodeData.selectedPrompt,
    alternativePrompts: nodeData.alternativePrompts,
    firstFramePrompt: nodeData.firstFramePrompt,
    lastFramePrompt: nodeData.lastFramePrompt,
    composition: nodeData.composition,
    lighting: nodeData.lighting,
    subject: nodeData.subject,
    background: nodeData.background,
    actionMovement: nodeData.actionMovement,
    textOverlay: nodeData.textOverlay,
    transitionDetail: nodeData.transitionDetail,
    audio: nodeData.audio,
    projectCharacterBible: bible?.character,
    projectSceneBible: bible?.scene,
    projectStyleBible: bible?.style,
  }
}

export function getVideoBibleFromGlobalConfig(globalConfig: GlobalConfig): VideoGenBible {
  return {
    character: globalConfig.characterBible?.trim() || undefined,
    scene: globalConfig.sceneBible?.trim() || undefined,
    style: globalConfig.styleBible?.trim() || undefined,
  }
}

async function pollVideoUntilDone(
  taskId: string,
  options: { interval: number; maxAttempts: number; signal: AbortSignal }
): Promise<{ videoUrl: string; lastFrameUrl?: string }> {
  const arkApiKey = typeof window !== 'undefined' ? localStorage.getItem('ark-api-key') || '' : ''
  const pollHeaders: Record<string, string> = {}
  if (arkApiKey) pollHeaders['x-ark-api-key'] = arkApiKey

  for (let i = 0; i < options.maxAttempts; i++) {
    if (options.signal.aborted) {
      throw new DOMException('Polling aborted', 'AbortError')
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, options.interval)
      options.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Polling aborted', 'AbortError'))
        },
        { once: true }
      )
    })

    const res = await fetch(`/api/generate/${taskId}`, {
      headers: pollHeaders,
      signal: options.signal,
    })
    if (!res.ok) {
      let detail = '查询任务状态失败'
      try {
        const j = await res.json()
        if (j.error) detail = String(j.error)
      } catch {
        /* ignore */
      }
      throw new Error(detail)
    }

    const data = await res.json()

    if (data.status === 'succeeded' && data.videoUrl) {
      return { videoUrl: data.videoUrl, lastFrameUrl: data.lastFrameUrl }
    }
    if (data.status === 'failed' || data.status === 'expired') {
      throw new Error(data.error || '视频生成失败')
    }
  }
  throw new Error('生成超时，请重试')
}

export async function runVideoGenerationRequest(options: {
  body: Record<string, unknown>
  signal: AbortSignal
}): Promise<{ taskId: string; fullPrompt: string }> {
  const arkApiKey = typeof window !== 'undefined' ? localStorage.getItem('ark-api-key') || '' : ''
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (arkApiKey) customHeaders['x-ark-api-key'] = arkApiKey

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(options.body),
    signal: options.signal,
  })

  let errMessage = '创建任务失败'
  let errDetails: string | undefined
  if (!res.ok) {
    try {
      const errData = await res.json()
      errMessage = errData.error || errMessage
      errDetails = errData.details ? String(errData.details) : undefined
    } catch {
      errMessage = `${errMessage}（HTTP ${res.status}）`
    }
    throw new Error(errDetails ? `${errMessage}：${errDetails}` : errMessage)
  }

  const { taskId, prompt: fullPrompt } = await res.json()
  return { taskId, fullPrompt: fullPrompt || '' }
}

export async function generateVideoForConfigNode(options: {
  nodeData: ConfigNodeData
  globalConfig: GlobalConfig
  firstFrameUrl?: string
  lastFrameUrl?: string
  referenceImageUrls?: string[]
  bible?: VideoGenBible
  signal: AbortSignal
}): Promise<{ videoUrl: string; lastFrameUrl?: string; assembledPrompt: string }> {
  const body = buildVideoGenerationRequestBody({
    nodeData: options.nodeData,
    globalConfig: options.globalConfig,
    firstFrameUrl: options.firstFrameUrl,
    lastFrameUrl: options.lastFrameUrl,
    referenceImageUrls: options.referenceImageUrls,
    bible: options.bible,
  })

  const { taskId, fullPrompt } = await runVideoGenerationRequest({
    body,
    signal: options.signal,
  })

  const assembledPrompt = fullPrompt || options.nodeData.prompt
  const result = await pollVideoUntilDone(taskId, {
    interval: 3000,
    maxAttempts: 60,
    signal: options.signal,
  })

  return { ...result, assembledPrompt }
}
