import type { ConfigNodeData } from '@/types'
import type { GlobalConfig } from '@/stores/canvas-store'

const MAX_REFERENCE_IMAGES = 2

export function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

/** 校验将发往 /api/generate 的参考图 URL（HTTPS） */
export function validateReferenceImageUrls(urls: string[] | undefined): { ok: true } | { ok: false; message: string } {
  if (!urls || urls.length === 0) return { ok: true }
  if (urls.length > MAX_REFERENCE_IMAGES) {
    return { ok: false, message: `参考图最多 ${MAX_REFERENCE_IMAGES} 张，当前 ${urls.length} 张` }
  }
  for (let i = 0; i < urls.length; i++) {
    if (!isHttpsUrl(urls[i])) {
      return { ok: false, message: `参考图 ${i + 1} 须为有效 HTTPS 链接` }
    }
  }
  return { ok: true }
}

/** 本地生成前检查：文案、模式与参考素材 */
export function validateVideoGenerationInput(
  nodeData: ConfigNodeData,
  globalConfig: GlobalConfig
): { ok: true } | { ok: false; message: string } {
  const mode = nodeData.referenceFrameMode || globalConfig.referenceFrameMode
  const text =
    (nodeData.selectedPrompt || nodeData.prompt || '').trim() ||
    (nodeData.coreInfo || '').trim()

  if (!text) {
    return { ok: false, message: '请填写主提示词或核心信息后再生成视频' }
  }

  if (mode === 'multi-frame') {
    if (!nodeData.multiFrameImageUrl?.trim()) {
      return { ok: false, message: '多帧参考模式下请先生成或载入九宫格参考图' }
    }
    if (!isHttpsUrl(nodeData.multiFrameImageUrl)) {
      return { ok: false, message: '九宫格参考图须为 HTTPS 链接' }
    }
  }

  if (nodeData.firstFrameUrl && !isHttpsUrl(nodeData.firstFrameUrl)) {
    return { ok: false, message: '首帧图须为 HTTPS 链接' }
  }
  if (nodeData.lastFrameUrl && !isHttpsUrl(nodeData.lastFrameUrl)) {
    return { ok: false, message: '尾帧图须为 HTTPS 链接' }
  }

  const ref = validateReferenceImageUrls(nodeData.referenceImageUrls)
  if (!ref.ok) return ref

  return { ok: true }
}

export type GenerationReadiness = {
  serverVideoKey: boolean
  serverChatKey: boolean
  browserOverrideKey: boolean
}

/** 不暴露密钥，仅告知客户端是否有可用凭证 */
export async function fetchGenerationReadiness(signal?: AbortSignal): Promise<GenerationReadiness> {
  const res = await fetch('/api/config/ready', { signal })
  if (!res.ok) {
    return { serverVideoKey: false, serverChatKey: false, browserOverrideKey: false }
  }
  return res.json()
}

export function hasBrowserArkOverride(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem('ark-api-key')?.trim())
}
