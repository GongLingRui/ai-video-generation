'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { Shot, ImageGenStatus } from '@/types'
import { useCanvasStore } from '@/stores/canvas-store'
import { pollImageUntilDone } from '@/lib/poll-image-task'
import { ingestRemoteUrlToProjectMedia, isPersistedProjectMediaUrl } from '@/lib/project-media'

/**
 * 链式首尾帧生成Hook
 *
 * 逻辑：
 * - shot1: 生成首帧 + 尾帧
 * - shot2-N: 只生成尾帧（首帧继承自上一个shot的尾帧）
 * - 链式关系：shot1的尾帧 = shot2的首帧
 */
export function useChainGeneration() {
  // 用于中止生成的 ref
  const abortControllerRef = useRef<AbortController | null>(null)

  // 调用API生成图片
  const generateFrame = useCallback(async (prompt: string, mode: 'initial-character' | 'story-based', signal?: AbortSignal) => {
    const globalConfig = useCanvasStore.getState().globalConfig
    const response = await fetch('/api/generate-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode, imageModelKey: globalConfig.imageModelKey }),
      signal, // 传入 signal 用于中止
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '生成失败')
    }

    return response.json()
  }, [])

  // 直接返回生成函数，不使用 useCanvasStore，避免嵌套订阅
  const generateShotFrames = useCallback(
    async (
      configNodeId: string,
      shot: Shot,
      previousLastFrameUrl: string | undefined,
      updateNodeFirstFrame: (id: string, url: string | undefined) => void,
      updateNodeLastFrame: (id: string, url: string | undefined) => void,
      updateNodeImageGenStatus: (id: string, status: ImageGenStatus) => void,
      signal?: AbortSignal,
      projectId?: string | null
    ): Promise<{ firstFrameUrl?: string; lastFrameUrl?: string }> => {
      const maybePersistImage = async (url: string | undefined, apply: (u: string) => void) => {
        if (!projectId?.trim() || !url || isPersistedProjectMediaUrl(url)) return
        const stable = await ingestRemoteUrlToProjectMedia(projectId, url, 'image')
        if (stable) apply(stable)
      }

      const pollSignal = signal ?? new AbortController().signal
      try {
        updateNodeImageGenStatus(configNodeId, 'generating')

        const results: { firstFrameUrl?: string; lastFrameUrl?: string } = {}

        // 打印shot数据，方便调试
        console.log(`[链式生成] 分镜 #${shot.id} 数据:`, {
          has_first_frame_prompt: !!shot.first_frame_prompt,
          has_last_frame_prompt: !!shot.last_frame_prompt,
          has_description: !!shot.description,
          has_selected_prompt: !!shot.selected_prompt,
        })

        // ===== 生成首帧 =====
        const isFirstShot = shot.id === 1 || !previousLastFrameUrl

        if (isFirstShot && shot.first_frame_prompt) {
          const firstResult = await generateFrame(
            shot.first_frame_prompt,
            'initial-character',
            signal
          )

          if (firstResult.imageUrl) {
            results.firstFrameUrl = firstResult.imageUrl
            updateNodeFirstFrame(configNodeId, firstResult.imageUrl)
            void maybePersistImage(firstResult.imageUrl, (u) => updateNodeFirstFrame(configNodeId, u))
          } else if (firstResult.taskId) {
            const imageUrl = await pollImageUntilDone(firstResult.taskId, {
              interval: 2000,
              maxAttempts: 60,
              signal: pollSignal,
            })
            results.firstFrameUrl = imageUrl
            updateNodeFirstFrame(configNodeId, imageUrl)
            void maybePersistImage(imageUrl, (u) => updateNodeFirstFrame(configNodeId, u))
          }
        } else if (!isFirstShot && previousLastFrameUrl) {
          // shot2-N: 首帧直接继承自上一个shot的尾帧
          results.firstFrameUrl = previousLastFrameUrl
          updateNodeFirstFrame(configNodeId, previousLastFrameUrl)
          console.log(`分镜 #${shot.id} 首帧继承自分镜 #${shot.id - 1} 的尾帧`)
        }

        // ===== 生成尾帧 =====
        if (shot.last_frame_prompt) {
          // 构建尾帧prompt，如果有上一帧则添加参考
          let lastFramePrompt = shot.last_frame_prompt
          if (previousLastFrameUrl) {
            lastFramePrompt = `${shot.last_frame_prompt}\n参考上一分镜尾帧的构图和风格，确保视觉连贯性。`
          }

          const lastResult = await generateFrame(
            lastFramePrompt,
            'story-based',
            signal
          )

          if (lastResult.imageUrl) {
            results.lastFrameUrl = lastResult.imageUrl
            updateNodeLastFrame(configNodeId, lastResult.imageUrl)
            void maybePersistImage(lastResult.imageUrl, (u) => updateNodeLastFrame(configNodeId, u))
          } else if (lastResult.taskId) {
            const imageUrl = await pollImageUntilDone(lastResult.taskId, {
              interval: 2000,
              maxAttempts: 60,
              signal: pollSignal,
            })
            results.lastFrameUrl = imageUrl
            updateNodeLastFrame(configNodeId, imageUrl)
            void maybePersistImage(imageUrl, (u) => updateNodeLastFrame(configNodeId, u))
          }
        }

        // 如果没有生成任何帧，给出提示
        if (!results.firstFrameUrl && !results.lastFrameUrl) {
          console.warn(`[链式生成] 分镜 #${shot.id} 没有生成任何帧`, {
            has_first_frame_prompt: !!shot.first_frame_prompt,
            has_last_frame_prompt: !!shot.last_frame_prompt,
          })
          toast.warning(`分镜 #${shot.id} 没有首尾帧prompt，跳过生成`)
        }

        updateNodeImageGenStatus(configNodeId, 'done')
        return results
      } catch (error) {
        // 如果是中止错误，不记录为错误日志（这是用户主动触发的正常行为）
        if (error instanceof Error && error.name === 'AbortError') {
          console.info(`分镜 #${shot.id} 生成已中止`)
          updateNodeImageGenStatus(configNodeId, 'idle')
          throw error
        }

        const message = error instanceof Error ? error.message : '生成失败'
        console.error(`分镜 #${shot.id} 帧生成失败: ${message}`, error)
        updateNodeImageGenStatus(configNodeId, 'idle') // 失败后重置为idle状态
        throw error
      }
    },
    [generateFrame]
  )

  /**
   * 启动链式生成流程
   */
  const startChainGeneration = useCallback(
    async (
      shots: Shot[],
      configNodeIds: string[],
      updateNodeFirstFrame: (id: string, url: string | undefined) => void,
      updateNodeLastFrame: (id: string, url: string | undefined) => void,
      updateNodeImageGenStatus: (id: string, status: ImageGenStatus) => void,
      projectId?: string | null
    ) => {
      if (shots.length !== configNodeIds.length) {
        toast.error('分镜数量与节点数量不匹配')
        return
      }

      if (shots.length === 0) {
        toast.error('没有需要生成分镜')
        return
      }

      // 创建新的 AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      toast.info(`开始链式生成 ${shots.length} 个分镜的首尾帧...`)

      let previousLastFrameUrl: string | undefined
      let successCount = 0
      let failureCount = 0

      // 按顺序逐个生成分镜的首尾帧
      for (let i = 0; i < shots.length; i++) {
        // 检查是否被中止
        if (controller.signal.aborted) {
          toast.warning('生成已中止')
          return
        }

        const shot = shots[i]
        const nodeId = configNodeIds[i]

        try {
          const results = await generateShotFrames(
            nodeId,
            shot,
            previousLastFrameUrl,
            updateNodeFirstFrame,
            updateNodeLastFrame,
            updateNodeImageGenStatus,
            controller.signal,
            projectId
          )

          // 将当前shot的尾帧保存，用于下一个shot的首帧参考
          previousLastFrameUrl = results.lastFrameUrl
          successCount++

          // 每生成成功一个，更新进度toast
          if (shots.length > 1) {
            toast.info(`进度: ${i + 1}/${shots.length}，已成功 ${successCount} 个`, { id: 'chain-progress' })
          }

          // 添加延迟，避免API限流
          if (i < shots.length - 1) {
            const delay = 2000 // 2秒延迟
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        } catch (error) {
          // 检查是否是中止错误
          if (error instanceof Error && error.name === 'AbortError') {
            toast.warning('生成已中止')
            return
          }

          failureCount++
          console.error(`分镜 #${shot.id} 生成失败，继续下一个分镜:`, error)
          // 继续生成下一个分镜，不中断整个流程
        }
      }

      // 清理 AbortController
      abortControllerRef.current = null

      // 总结结果
      if (failureCount === 0) {
        toast.success(`所有 ${shots.length} 个分镜首尾帧生成完成！`)
      } else if (successCount === 0) {
        toast.error(`所有分镜生成失败`)
      } else {
        toast.warning(`生成完成：成功 ${successCount}/${shots.length}，失败 ${failureCount}/${shots.length}`)
      }
    },
    [generateShotFrames]
  )

  /**
   * 重新生成单个分镜的首尾帧
   */
  const regenerateShotFrames = useCallback(
    async (
      configNodeId: string,
      shot: Shot,
      previousLastFrameUrl: string | undefined,
      updateNodeFirstFrame: (id: string, url: string | undefined) => void,
      updateNodeLastFrame: (id: string, url: string | undefined) => void,
      updateNodeImageGenStatus: (id: string, status: ImageGenStatus) => void,
      projectId?: string | null
    ) => {
      toast.info(`重新生成分镜 #${shot.id} 的首尾帧...`)

      try {
        await generateShotFrames(
          configNodeId,
          shot,
          previousLastFrameUrl,
          updateNodeFirstFrame,
          updateNodeLastFrame,
          updateNodeImageGenStatus,
          undefined,
          projectId
        )
        toast.success(`分镜 #${shot.id} 重新生成完成`)
      } catch (error) {
        console.error(`分镜 #${shot.id} 重新生成失败:`, error)
        throw error
      }
    },
    [generateShotFrames]
  )

  /**
   * 中止链式生成
   */
  const abortChainGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      toast.info('正在中止生成...')
    }
  }, [])

  return {
    generateShotFrames,
    startChainGeneration,
    abortChainGeneration, // 新增中止函数
    regenerateShotFrames,
  }
}

