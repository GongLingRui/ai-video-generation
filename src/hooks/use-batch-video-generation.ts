'use client'

import { useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvas-store'
import {
  generateVideoForConfigNode,
  resolveVideoReferenceInputs,
  getVideoBibleFromGlobalConfig,
} from '@/lib/client-video-generation'
import { validateVideoGenerationInput, fetchGenerationReadiness, hasBrowserArkOverride } from '@/lib/generation-guards'
import { persistVideoResultToProjectStorage } from '@/lib/persist-video-media'

/**
 * 按 shotId 顺序依次生成视频，镜间延迟以降低限流；可中止。
 * @param projectId 来自 URL，有则生成后将视频转存 Storage
 */
export function useBatchVideoGeneration(projectId: string | null) {
  const abortRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const runSequential = useCallback(async () => {
    const ordered = useCanvasStore.getState().getOrderedConfigNodes()
    if (ordered.length === 0) {
      toast.error('请先为配置节点设置镜头编号（shotId），可从 AI 分镜加入画布')
      return
    }

    if (!hasBrowserArkOverride()) {
      const ready = await fetchGenerationReadiness()
      if (!ready.serverVideoKey) {
        toast.error('无法批量生成：服务端未配置 VOLCENGINE_API_KEY，或请设置浏览器 Ark Key')
        return
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    toast.info(`批量队列：将顺序生成 ${ordered.length} 段视频`)

    let ok = 0
    for (let i = 0; i < ordered.length; i++) {
      if (controller.signal.aborted) {
        toast.warning('已取消批量生成')
        return
      }

      const { id, data } = ordered[i]
      const globalConfig = useCanvasStore.getState().globalConfig

      const pre = validateVideoGenerationInput(data, globalConfig)
      if (!pre.ok) {
        toast.error(`跳过 分镜 ${data.shotId}: ${pre.message}`)
        continue
      }

      useCanvasStore.getState().updateNodeStatus(id, 'generating')
      useCanvasStore.getState().updateVideoNodeStatus(id.replace('config-', 'video-'), 'generating')

      try {
        const { firstFrameUrl, lastFrameUrl, referenceImageUrls } = resolveVideoReferenceInputs(
          id,
          data,
          globalConfig
        )
        const bible = getVideoBibleFromGlobalConfig(globalConfig)

        const result = await generateVideoForConfigNode({
          nodeData: data,
          globalConfig,
          firstFrameUrl,
          lastFrameUrl,
          referenceImageUrls,
          bible,
          signal: controller.signal,
        })

        useCanvasStore.getState().setVideoResult(id, result.videoUrl, result.assembledPrompt, result.lastFrameUrl)
        useCanvasStore.getState().updateNodeStatus(id, 'done')
        void persistVideoResultToProjectStorage(id, projectId, result)
        ok += 1
        toast.success(`分镜 ${data.shotId} 完成（${ok}/${ordered.length}）`, { id: 'batch-video' })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return
        }
        const msg = e instanceof Error ? e.message : '失败'
        useCanvasStore.getState().updateNodeStatus(id, 'error')
        useCanvasStore.getState().updateVideoNodeStatus(id.replace('config-', 'video-'), 'error')
        toast.error(`分镜 ${data.shotId}: ${msg}`)
      }

      if (i < ordered.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    abortRef.current = null
    toast.success(`批量生成结束：成功 ${ok} / ${ordered.length}`)
  }, [projectId])

  return { runSequential, abort }
}
