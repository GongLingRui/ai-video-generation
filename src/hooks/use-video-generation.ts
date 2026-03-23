'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvas-store'
import type { ConfigNodeData } from '@/types'
import {
  validateVideoGenerationInput,
  fetchGenerationReadiness,
  hasBrowserArkOverride,
} from '@/lib/generation-guards'
import {
  generateVideoForConfigNode,
  resolveVideoReferenceInputs,
  getVideoBibleFromGlobalConfig,
} from '@/lib/client-video-generation'
import { persistVideoResultToProjectStorage } from '@/lib/persist-video-media'

export function useVideoGeneration(nodeId: string) {
  const projectId = useSearchParams().get('projectId')
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const clearLastError = useCallback(() => setLastError(null), [])

  const generate = useCallback(
    async (nodeData: ConfigNodeData) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setLastError(null)
      setStatus('generating')
      useCanvasStore.getState().updateNodeStatus(nodeId, 'generating')
      useCanvasStore.getState().updateVideoNodeStatus(
        nodeId.replace('config-', 'video-'),
        'generating'
      )

      try {
        const globalConfig = useCanvasStore.getState().globalConfig

        const pre = validateVideoGenerationInput(nodeData, globalConfig)
        if (!pre.ok) {
          setStatus('idle')
          useCanvasStore.getState().updateNodeStatus(nodeId, 'idle')
          useCanvasStore.getState().updateVideoNodeStatus(
            nodeId.replace('config-', 'video-'),
            'idle'
          )
          toast.error(pre.message)
          return
        }

        if (!hasBrowserArkOverride()) {
          const ready = await fetchGenerationReadiness(controller.signal)
          if (!ready.serverVideoKey) {
            setStatus('idle')
            useCanvasStore.getState().updateNodeStatus(nodeId, 'idle')
            useCanvasStore.getState().updateVideoNodeStatus(
              nodeId.replace('config-', 'video-'),
              'idle'
            )
            toast.error('无法生成视频：服务端未配置 VOLCENGINE_API_KEY，或请在本地设置浏览器 Ark API Key')
            return
          }
        }

        const { firstFrameUrl, lastFrameUrl, referenceImageUrls } = resolveVideoReferenceInputs(
          nodeId,
          nodeData,
          globalConfig
        )
        const bible = getVideoBibleFromGlobalConfig(globalConfig)

        const result = await generateVideoForConfigNode({
          nodeData,
          globalConfig,
          firstFrameUrl,
          lastFrameUrl,
          referenceImageUrls,
          bible,
          signal: controller.signal,
        })

        useCanvasStore.getState().setVideoResult(
          nodeId,
          result.videoUrl,
          result.assembledPrompt,
          result.lastFrameUrl
        )
        useCanvasStore.getState().updateNodeStatus(nodeId, 'done')
        void persistVideoResultToProjectStorage(nodeId, projectId, result)
        setStatus('done')
        toast.success('视频生成完成')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStatus('idle')
          useCanvasStore.getState().updateNodeStatus(nodeId, 'idle')
          useCanvasStore.getState().updateVideoNodeStatus(
            nodeId.replace('config-', 'video-'),
            'idle'
          )
          return
        }
        const message = error instanceof Error ? error.message : '未知错误'
        setLastError(message)
        setStatus('error')
        useCanvasStore.getState().updateNodeStatus(nodeId, 'error')
        useCanvasStore.getState().updateVideoNodeStatus(
          nodeId.replace('config-', 'video-'),
          'error'
        )
        toast.error(message, {
          duration: 8000,
          description: '可修改参数后重试；文案与设置已保留。',
        })
      }
    },
    [nodeId, projectId]
  )

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setStatus('idle')
  }, [])

  return { status, generate, cancel, lastError, clearLastError }
}
