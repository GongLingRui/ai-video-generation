'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { motionVariants, transitions } from '@/lib/motion'
import { cva } from 'class-variance-authority'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GenerationButton } from '@/components/ui/generation-button'
import { ImageDisplay } from '@/components/ui/image-display'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptEditDialog } from '@/components/ui/prompt-edit-dialog'
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog'
import { useCanvasStore } from '@/stores/canvas-store'
import { useVideoGeneration } from '@/hooks/use-video-generation'
import {
  VIDEO_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_RESOLUTIONS,
  REFERENCE_FRAME_MODE_LABELS,
  MEDIA_URL_UNREACHABLE_HINT,
} from '@/lib/constants'
import { pollImageUntilDone } from '@/lib/poll-image-task'
import { ingestRemoteUrlToProjectMedia, isPersistedProjectMediaUrl } from '@/lib/project-media'
import { toast } from 'sonner'
import { X, Link2, Layers, Loader2, ChevronDown, ChevronRight, Square, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ConfigNode as ConfigNodeType,
  ConfigNodeData,
  VideoRatio,
  VideoDuration,
  ReferenceFrameMode,
  VideoNodeData,
} from '@/types'

const configNodeVariants = cva(
  'rounded-2xl border bg-card/95 backdrop-blur-lg p-4 w-80 transition-all shadow-md overflow-visible',
  {
    variants: {
      selected: {
        true: 'ring-2 ring-ring border-ring',
        false: 'border-border/10 hover:shadow-lg',
      },
      status: {
        idle: '',
        generating: 'border-primary/20',
        done: '',
        error: 'border-destructive/20',
      },
    },
    defaultVariants: { selected: false, status: 'idle' },
  }
)

function ConfigNodeComponent({ id, data, selected }: NodeProps<ConfigNodeType>) {
  const projectId = useSearchParams().get('projectId')

  // Tab状态
  const [activeTab, setActiveTab] = useState<'config' | 'frames'>('config')

  // 编辑弹窗状态
  const [showFirstFrameEdit, setShowFirstFrameEdit] = useState(false)
  const [showLastFrameEdit, setShowLastFrameEdit] = useState(false)
  const [showMultiFrameEdit, setShowMultiFrameEdit] = useState(false)

  // 多帧参考状态
  const [multiFrameEnhancing, setMultiFrameEnhancing] = useState(false)
  const [generatingMultiFrame, setGeneratingMultiFrame] = useState(false)

  // 预览弹窗状态
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>()

  // 8字段展开状态
  const [showEightFields, setShowEightFields] = useState(false)

  // 生成状态追踪
  const [generatingFirst, setGeneratingFirst] = useState(false)
  const [generatingLast, setGeneratingLast] = useState(false)

  // AbortController refs for cancelling requests
  const firstFrameAbortRef = useRef<AbortController | null>(null)
  const lastFrameAbortRef = useRef<AbortController | null>(null)
  const multiFrameAbortRef = useRef<AbortController | null>(null)

  const [multiFrameFailedUrl, setMultiFrameFailedUrl] = useState<string | null>(null)
  const multiFrameImageLoadError = Boolean(
    data.multiFrameImageUrl && multiFrameFailedUrl === data.multiFrameImageUrl
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (firstFrameAbortRef.current) {
        firstFrameAbortRef.current.abort()
      }
      if (lastFrameAbortRef.current) {
        lastFrameAbortRef.current.abort()
      }
      if (multiFrameAbortRef.current) {
        multiFrameAbortRef.current.abort()
      }
    }
  }, [])

  const updateNodePrompt = useCanvasStore((s) => s.updateNodePrompt)
  const updateNodeNegativePrompt = useCanvasStore((s) => s.updateNodeNegativePrompt)
  const updateNodeRatio = useCanvasStore((s) => s.updateNodeRatio)
  const updateNodeDuration = useCanvasStore((s) => s.updateNodeDuration)
  const updateNodeResolution = useCanvasStore((s) => s.updateNodeResolution)
  const removeNodeTechnique = useCanvasStore((s) => s.removeNodeTechnique)
  const updateNodeFirstFrame = useCanvasStore((s) => s.updateNodeFirstFrame)
  const updateNodeLastFrame = useCanvasStore((s) => s.updateNodeLastFrame)
  const updateNodeFirstFramePrompt = useCanvasStore((s) => s.updateNodeFirstFramePrompt)
  const updateNodeLastFramePrompt = useCanvasStore((s) => s.updateNodeLastFramePrompt)
  const updateNodeMultiFramePrompt = useCanvasStore((s) => s.updateNodeMultiFramePrompt)
  const updateNodeMultiFrameImageUrl = useCanvasStore((s) => s.updateNodeMultiFrameImageUrl)
  const updateNodeReferenceImages = useCanvasStore((s) => s.updateNodeReferenceImages)
  const updateNodeReferenceFrameMode = useCanvasStore((s) => s.updateNodeReferenceFrameMode)
  const updateNodeEightFields = useCanvasStore((s) => s.updateNodeEightFields)

  /** 尾帧 URL 变更时同步 video 节点与链式下一镜首帧 */
  const syncLastFrameDerived = useCallback(
    (u: string) => {
      updateNodeLastFrame(id, u)
      const videoNodeId = id.replace('config-', 'video-')
      const nodesSnapshot = useCanvasStore.getState().nodes
      const edgesSnapshot = useCanvasStore.getState().edges
      const videoNode = nodesSnapshot.find((n) => n.id === videoNodeId && n.type === 'video')
      if (videoNode) {
        useCanvasStore.getState().setVideoResult(
          id,
          (videoNode.data as VideoNodeData).videoUrl ?? '',
          data.prompt,
          u
        )
      }
      const outgoingEdge = edgesSnapshot.find(
        (e) => e.source === videoNodeId && !e.targetHandle && e.target.startsWith('config-')
      )
      if (outgoingEdge) {
        useCanvasStore.getState().updateNodeFirstFrame(outgoingEdge.target, u)
      }
    },
    [id, data.prompt, updateNodeLastFrame]
  )
  const deleteNode = useCanvasStore((s) => s.deleteNode)
  const globalConfig = useCanvasStore((s) => s.globalConfig)
  const isPendingRegeneration = useCanvasStore((s) => s.pendingRegeneration.has(id))
  const clearPendingRegeneration = useCanvasStore((s) => s.clearPendingRegeneration)
  const { generate: generateVideo, cancel: cancelVideoGeneration, status: videoGenerationStatus } = useVideoGeneration(id)
  const chainFrameUrl = useCanvasStore(
    (s) => s.getPreviousNodeLastFrame(id)
  )
  const hasChainFrame = chainFrameUrl !== undefined
  const updateNodeImageGenStatus = useCanvasStore((s) => s.updateNodeImageGenStatus)

  // 当前节点的参考帧模式，优先使用节点自己的，否则继承全局配置
  const currentMode = data.referenceFrameMode || globalConfig.referenceFrameMode

  // Auto-trigger generation when this node is marked for regeneration
  useEffect(() => {
    if (isPendingRegeneration && data.prompt.trim()) {
      clearPendingRegeneration(id)
      generateVideo(data)
    }
  }, [isPendingRegeneration, id, data, generateVideo, clearPendingRegeneration])

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodePrompt(id, e.target.value)
    },
    [id, updateNodePrompt]
  )

  // 处理8字段更新
  const handleEightFieldChange = useCallback((field: keyof ConfigNodeData, value: string) => {
    updateNodeEightFields(id, { [field]: value })
  }, [id, updateNodeEightFields])

  const handleGenerate = useCallback(() => {
    // 如果正在生成，则取消
    if (videoGenerationStatus === 'generating') {
      cancelVideoGeneration()
      toast.info('已取消视频生成')
      return
    }

    if (!data.prompt.trim()) {
      toast.error('请先输入画面描述')
      return
    }
    generateVideo(data)
  }, [generateVideo, cancelVideoGeneration, videoGenerationStatus, data])

  // 生成首帧（基于主 prompt）
  const handleGenerateFirstFrame = useCallback(async () => {
    // 如果正在生成，则取消
    if (generatingFirst && firstFrameAbortRef.current) {
      firstFrameAbortRef.current.abort()
      setGeneratingFirst(false)
      firstFrameAbortRef.current = null
      toast.info('已取消首帧生成')
      return
    }

    if (!data.prompt) {
      toast.error('此分镜没有画面描述，无法生成首帧')
      return
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    firstFrameAbortRef.current = abortController

    setGeneratingFirst(true)
    try {
      toast.info(`正在生成分镜 #${data.shotId} 的首帧...`)

      // 构建首帧 prompt：场景开始状态
      const firstFramePrompt = `电影感首帧画面，场景开始状态：${data.prompt}。镜头起始位置，主体进入画面或场景展开。电影布光，高画质，16:9比例。`

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'initial-character', // 使用单图模式
          prompt: firstFramePrompt,
          imageModelKey: globalConfig.imageModelKey,
          skipTemplate: true // 跳过模板，直接使用我们构建的 prompt
        }),
        signal: abortController.signal
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '生成失败')
      }

      const result = await res.json()

      if (result.imageUrl) {
        updateNodeFirstFrame(id, result.imageUrl)
        if (projectId && !isPersistedProjectMediaUrl(result.imageUrl)) {
          void ingestRemoteUrlToProjectMedia(projectId, result.imageUrl, 'image').then((stable) => {
            if (stable) updateNodeFirstFrame(id, stable)
          })
        }
        toast.success(`分镜 #${data.shotId} 首帧生成完成`)
      } else if (result.taskId) {
        toast.info(`首帧生成任务已创建，正在处理...`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('已取消首帧生成')
      } else {
        const message = error instanceof Error ? error.message : '首帧生成失败'
        toast.error(`首帧生成失败: ${message}`)
      }
    } finally {
      setGeneratingFirst(false)
      firstFrameAbortRef.current = null
    }
  }, [id, data, generatingFirst, projectId, updateNodeFirstFrame])

  // 生成尾帧（优先使用保存的尾帧 prompt，否则使用主 prompt）
  const handleGenerateLastFrame = useCallback(async () => {
    // 如果正在生成，则取消
    if (generatingLast && lastFrameAbortRef.current) {
      lastFrameAbortRef.current.abort()
      setGeneratingLast(false)
      lastFrameAbortRef.current = null
      toast.info('已取消尾帧生成')
      return
    }

    // 优先使用尾帧 prompt，如果没有则使用主 prompt
    const basePrompt = data.lastFramePrompt || data.prompt
    if (!basePrompt) {
      toast.error('此分镜没有画面描述，无法生成尾帧')
      return
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    lastFrameAbortRef.current = abortController

    setGeneratingLast(true)
    try {
      toast.info(`正在生成分镜 #${data.shotId} 的尾帧...`)

      // 如果有保存的尾帧 prompt，直接使用；否则使用默认模板
      const lastFramePrompt = data.lastFramePrompt
        ? data.lastFramePrompt
        : `电影感尾帧画面，场景结束状态：${data.prompt}。镜头最终位置，主体离开或场景结束定格。电影布光，高画质，16:9比例，与首帧保持风格一致。`

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'initial-character', // 使用单图模式
          prompt: lastFramePrompt,
          imageModelKey: globalConfig.imageModelKey,
          skipTemplate: true // 跳过模板，直接使用我们构建的 prompt
        }),
        signal: abortController.signal
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '生成失败')
      }

      const result = await res.json()

      if (result.imageUrl) {
        syncLastFrameDerived(result.imageUrl)
        if (projectId && !isPersistedProjectMediaUrl(result.imageUrl)) {
          void ingestRemoteUrlToProjectMedia(projectId, result.imageUrl, 'image').then((stable) => {
            if (stable) syncLastFrameDerived(stable)
          })
        }

        toast.success(`分镜 #${data.shotId} 尾帧生成完成`)
      } else if (result.taskId) {
        toast.info(`尾帧生成任务已创建，正在处理...`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('已取消尾帧生成')
      } else {
        const message = error instanceof Error ? error.message : '尾帧生成失败'
        toast.error(`尾帧生成失败: ${message}`)
      }
    } finally {
      setGeneratingLast(false)
      lastFrameAbortRef.current = null
    }
  }, [id, data, generatingLast, projectId, syncLastFrameDerived])

  // 保存首帧 prompt
  const handleSaveFirstFramePrompt = useCallback((prompt: string) => {
    updateNodeFirstFramePrompt(id, prompt)
    toast.success('首帧 Prompt 已更新')
  }, [id, updateNodeFirstFramePrompt])

  // 保存尾帧 prompt
  const handleSaveLastFramePrompt = useCallback((prompt: string) => {
    updateNodeLastFramePrompt(id, prompt)

    // 检查是否之前生成过尾帧
    const hasExistingLastFrame = !!data.lastFrameUrl

    if (hasExistingLastFrame) {
      // 提示用户是否重新生成
      toast.success('尾帧 Prompt 已更新', {
        action: {
          label: '重新生成尾帧',
          onClick: () => {
            // 短暂延迟后触发重新生成，确保 toast 关闭
            setTimeout(() => {
              handleGenerateLastFrame()
            }, 500)
          },
        },
      })
    } else {
      toast.success('尾帧 Prompt 已更新')
    }
  }, [id, updateNodeLastFramePrompt, data.lastFrameUrl, handleGenerateLastFrame])

  // 保存多帧参考 prompt
  const handleSaveMultiFramePrompt = useCallback((prompt: string) => {
    updateNodeMultiFramePrompt(id, prompt)
    toast.success('多帧参考 Prompt 已更新')
  }, [id, updateNodeMultiFramePrompt])

  // AI 增强多帧参考 prompt
  const handleEnhanceMultiFrame = useCallback(async () => {
    if (!data.prompt && !data.multiFramePrompt) {
      toast.error('请先输入 Prompt 或提供主 Prompt')
      return
    }

    setMultiFrameEnhancing(true)
    try {
      const globalConfig = useCanvasStore.getState().globalConfig
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainPrompt: data.prompt || '',
          currentPrompt: data.multiFramePrompt || '',
          chatModelKey: globalConfig.chatModelKey,
        }),
      })

      if (!response.ok) {
        throw new Error('增强请求失败')
      }

      const result = await response.json()
      const enhancedText = result.enhancedPrompt

      // 保存增强后的 Prompt
      updateNodeMultiFramePrompt(id, enhancedText)

      // 询问是否立即生成
      toast.success('多帧参考 Prompt 已增强', {
        action: {
          label: '生成九宫格',
          onClick: () => {
            setTimeout(() => {
              handleGenerateMultiFrame()
            }, 500)
          },
        },
      })
    } catch (error) {
      console.error('[Enhance MultiFrame] Error:', error)
      toast.error('AI 增强失败，请重试')
    } finally {
      setMultiFrameEnhancing(false)
    }
  }, [data.prompt, data.multiFramePrompt, id])

  // 生成九宫格（单张图片包含9个画面）
  const handleGenerateMultiFrame = useCallback(async () => {
    if (!data.multiFramePrompt) {
      toast.error('请先设置多帧参考 Prompt')
      return
    }

    setGeneratingMultiFrame(true)
    try {
      toast.info('正在生成 3×3 九宫格...')

      const response = await fetch('/api/generate-multi-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.multiFramePrompt,
          mainPrompt: data.prompt,
          imageModelKey: globalConfig.imageModelKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        console.error('[Generate MultiFrame] API Error:', errorData)
        throw new Error(errorData.error || errorData.details || '生成失败')
      }

      const result = await response.json()

      if (result.imageUrl) {
        updateNodeMultiFrameImageUrl(id, result.imageUrl)
        if (projectId && !isPersistedProjectMediaUrl(result.imageUrl)) {
          void ingestRemoteUrlToProjectMedia(projectId, result.imageUrl, 'image').then((stable) => {
            if (stable) updateNodeMultiFrameImageUrl(id, stable)
          })
        }
        toast.success('九宫格生成完成')
      } else if (result.taskId) {
        multiFrameAbortRef.current?.abort()
        const controller = new AbortController()
        multiFrameAbortRef.current = controller
        toast.info('九宫格生成中，请稍候…', { id: 'multi-frame-poll' })
        try {
          const imageUrl = await pollImageUntilDone(result.taskId, {
            interval: 2000,
            maxAttempts: 60,
            signal: controller.signal,
          })
          updateNodeMultiFrameImageUrl(id, imageUrl)
          if (projectId && !isPersistedProjectMediaUrl(imageUrl)) {
            void ingestRemoteUrlToProjectMedia(projectId, imageUrl, 'image').then((stable) => {
              if (stable) updateNodeMultiFrameImageUrl(id, stable)
            })
          }
          toast.success('九宫格生成完成', { id: 'multi-frame-poll' })
        } catch (pollErr) {
          if (pollErr instanceof DOMException && pollErr.name === 'AbortError') {
            return
          }
          const msg = pollErr instanceof Error ? pollErr.message : '轮询失败'
          console.error('[Generate MultiFrame] Poll error:', pollErr)
          toast.error(`九宫格生成失败: ${msg}`, { id: 'multi-frame-poll' })
          throw pollErr
        } finally {
          if (multiFrameAbortRef.current === controller) {
            multiFrameAbortRef.current = null
          }
        }
      } else {
        console.error('[Generate MultiFrame] Invalid response:', result)
        throw new Error('返回数据格式不正确')
      }
    } catch (error) {
      console.error('[Generate MultiFrame] Error:', error)
      const message = error instanceof Error ? error.message : '未知错误'
      toast.error(`九宫格生成失败: ${message}`)
    } finally {
      setGeneratingMultiFrame(false)
    }
  }, [data.multiFramePrompt, data.prompt, id, projectId, updateNodeMultiFrameImageUrl])

  // 下载图片
  const handleDownloadImage = useCallback(async (url: string, type: 'first' | 'last') => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `shot-${data.shotId}-${type}-frame.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
      toast.success(`${type === 'first' ? '首帧' : '尾帧'}已保存`)
    } catch (error) {
      toast.error('保存失败，请重试')
    }
  }, [data.shotId])

  // 预览图片
  const handlePreviewImage = useCallback((url: string) => {
    setPreviewImageUrl(url)
  }, [])

  return (
    <motion.div
      className={configNodeVariants({ selected: !!selected, status: data.status })}
      {...motionVariants.scaleIn}
      transition={transitions.spring}
    >
      <Handle type="target" position={Position.Left} className="bg-border! w-2! h-2!" />
      <Handle type="source" position={Position.Right} className="bg-border! w-2! h-2!" />
      <Handle type="source" position={Position.Bottom} id="video" className="bg-border! w-2! h-2!" />

      {/* Title */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {data.title || '分镜'}
          {hasChainFrame && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-primary/70">
              <Link2 className="h-3 w-3" />
              已衔接
            </span>
          )}
        </div>
        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteNode(id)
          }}
          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80 transition-colors shadow-md"
          title="删除节点"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="w-full" onValueChange={(value) => setActiveTab(value as 'config' | 'frames')}>
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="config" className="text-xs">
            配置
          </TabsTrigger>
          <TabsTrigger value="frames" className="text-xs">
            首尾帧
          </TabsTrigger>
        </TabsList>

        {/* 配置 Tab */}
        <TabsContent value="config" className="mt-0 space-y-2 overflow-visible">
          {/* Prompt */}
          <Textarea
            placeholder="描述你想要的画面..."
            value={data.prompt}
            onChange={handlePromptChange}
            className="text-sm min-h-[60px] resize-none nodrag"
            rows={3}
          />

          {/* Negative Prompt */}
          {data.negativePrompt && (
            <div className="mb-3">
              <Textarea
                placeholder="需要避免的内容（如：模糊、卡顿、变形）"
                value={data.negativePrompt}
                onChange={(e) => updateNodeNegativePrompt(id, e.target.value)}
                className="text-sm min-h-[40px] resize-none nodrag text-muted-foreground"
                rows={2}
              />
            </div>
          )}

          {/* Applied Techniques */}
          {data.techniques.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {data.techniques.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 gap-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => removeNodeTechnique(id, t.id)}
                >
                  {t.label}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))}
            </div>
          )}

          {/* 三阶段流程详情 - 只要有 shotId 就显示 */}
          {data.shotId && (
            <div className="bg-muted/30 rounded-lg p-2 mb-3 space-y-2 nodrag">
              <div className="text-[10px] font-semibold text-foreground">分镜 #{data.shotId} 详情</div>

              {/* 场景类型和景别 */}
              {(data.sceneType || data.shotSize || data.transition) && (
                <div className="flex gap-2 text-[10px]">
                  {data.sceneType && (
                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 rounded text-blue-600 dark:text-blue-400">
                      {data.sceneType}
                    </span>
                  )}
                  {data.shotSize && (
                    <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/20 rounded text-purple-600 dark:text-purple-400">
                      {data.shotSize}
                    </span>
                  )}
                  {data.transition && (
                    <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-950/20 rounded text-green-600 dark:text-green-400">
                      {data.transition}
                    </span>
                  )}
                </div>
              )}

              {/* 核心信息 */}
              {data.coreInfo && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">核心:</span>
                  <span className="ml-1">{data.coreInfo}</span>
                </div>
              )}

              {/* 视觉关键词 */}
              {data.visualKeywords && data.visualKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.visualKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 角色特征 */}
              {data.characterFeatures && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">角色:</span>
                  <span className="ml-1">{data.characterFeatures}</span>
                </div>
              )}

              {/* 场景特征 */}
              {data.sceneFeatures && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">场景:</span>
                  <span className="ml-1">{data.sceneFeatures}</span>
                </div>
              )}

              {/* 一致性备注 */}
              {data.consistencyNotes && (
                <div className="text-[10px] bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                  <span className="text-muted-foreground">备注:</span>
                  <span className="ml-1">{data.consistencyNotes}</span>
                </div>
              )}

              {/* 8要素详细描述 - 始终显示 */}
              <div className="pt-1.5 border-t border-border/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[9px] font-medium w-full justify-start nodrag"
                  onClick={() => setShowEightFields(!showEightFields)}
                >
                  {showEightFields ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  8要素详细描述（可编辑）
                </Button>

                {showEightFields && (
                  <div className="mt-1.5 space-y-1 text-[9px]">
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">1. 构图</label>
                      <Textarea
                        value={data.composition || ''}
                        onChange={(e) => handleEightFieldChange('composition', e.target.value)}
                        placeholder="主体位置、视角、构图方式、景深控制..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">2. 光线</label>
                      <Textarea
                        value={data.lighting || ''}
                        onChange={(e) => handleEightFieldChange('lighting', e.target.value)}
                        placeholder="光源方向、光质、光影对比度、光线氛围..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">3. 主体</label>
                      <Textarea
                        value={data.subject || ''}
                        onChange={(e) => handleEightFieldChange('subject', e.target.value)}
                        placeholder="人物特征、物体特征、主体状态..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">4. 背景</label>
                      <Textarea
                        value={data.background || ''}
                        onChange={(e) => handleEightFieldChange('background', e.target.value)}
                        placeholder="环境特征、空间关系、背景元素、色彩基调..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">5. 动作/运动</label>
                      <Textarea
                        value={data.actionMovement || ''}
                        onChange={(e) => handleEightFieldChange('actionMovement', e.target.value)}
                        placeholder="主体动作、镜头运动、运动速度、运动轨迹..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">6. 文字叠加</label>
                      <Textarea
                        value={data.textOverlay || ''}
                        onChange={(e) => handleEightFieldChange('textOverlay', e.target.value)}
                        placeholder="本镜头需要叠加的文字内容，如无则填写'无'..."
                        className="min-h-[30px] text-[8px] resize-none nodrag p-1"
                        rows={1}
                      />
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">7. 转场</label>
                      <Textarea
                        value={data.transitionDetail || ''}
                        onChange={(e) => handleEightFieldChange('transitionDetail', e.target.value)}
                        placeholder="转场类型、转场时机、转场效果、衔接方式..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded px-1.5 py-1 space-y-1">
                      <label className="font-medium">8. 音频</label>
                      <Textarea
                        value={data.audio || ''}
                        onChange={(e) => handleEightFieldChange('audio', e.target.value)}
                        placeholder="背景音乐、音效、旁白/对白、音频氛围..."
                        className="min-h-[40px] text-[8px] resize-none nodrag p-1"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ratio, Duration & Resolution — Select 浮层 disablePortal，避免 React Flow transform 下错位 */}
          <div className="mb-3 grid grid-cols-3 gap-1.5 nodrag">
            <div className="relative min-w-0">
              <Select
                value={data.resolution}
                onValueChange={(v) => updateNodeResolution(id, v as ConfigNodeData['resolution'])}
              >
                <SelectTrigger className="h-7 w-full min-w-0 border-black/10 bg-white text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent disablePortal alignItemWithTrigger={false} side="bottom" align="start">
                  {VIDEO_RESOLUTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative min-w-0">
              <Select value={data.ratio} onValueChange={(v) => updateNodeRatio(id, v as VideoRatio)}>
                <SelectTrigger className="h-7 w-full min-w-0 border-black/10 bg-white text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent disablePortal alignItemWithTrigger={false} side="bottom" align="start">
                  {VIDEO_RATIOS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative min-w-0">
              <Select
                value={String(data.duration)}
                onValueChange={(v) => updateNodeDuration(id, Number(v) as VideoDuration)}
              >
                <SelectTrigger className="h-7 w-full min-w-0 border-black/10 bg-white text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent disablePortal alignItemWithTrigger={false} side="bottom" align="start">
                  {VIDEO_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="nodrag">
            <GenerationButton
              state={videoGenerationStatus === 'generating' ? 'generating' : data.status}
              onClick={handleGenerate}
            />
          </div>
        </TabsContent>

        {/* 首尾帧 Tab */}
        <TabsContent value="frames" className="mt-0 space-y-2 overflow-visible">
          <div className="space-y-2 nodrag">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>图片素材</span>
              </div>
              <div className="relative shrink-0">
                <Select
                  value={currentMode}
                  onValueChange={(v) => updateNodeReferenceFrameMode(id, v as ReferenceFrameMode)}
                >
                  <SelectTrigger className="h-6 min-w-[5.5rem] max-w-[7rem] border-black/10 bg-white text-[10px]">
                    <SelectValue placeholder="参考模式">
                      {REFERENCE_FRAME_MODE_LABELS[currentMode]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    disablePortal
                    alignItemWithTrigger={false}
                    side="bottom"
                    align="end"
                    className="min-w-[140px]"
                  >
                    <SelectItem value="first-last" className="text-xs">
                      首尾帧参考
                    </SelectItem>
                    <SelectItem value="multi-frame" className="text-xs">
                      多帧参考
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 根据模式显示不同的上传界面 */}
            {currentMode === 'first-last' && (
              <div className="space-y-3">
                {/* 首帧区域 */}
                <div className="space-y-2">
                  {hasChainFrame ? (
                    // 已衔接：只显示图片和提示，不可编辑/删除
                    <>
                      <ImageDisplay
                        label="首帧图（已衔接）"
                        value={chainFrameUrl}
                        generating={false}
                        onPreview={() => chainFrameUrl && handlePreviewImage(chainFrameUrl)}
                        onSave={() => chainFrameUrl && handleDownloadImage(chainFrameUrl, 'first')}
                        onRemove={() => {}}
                      />
                      <p className="text-[9px] text-muted-foreground text-center">
                        ✓ 首帧自动使用上一个镜头的尾帧，不可编辑
                      </p>
                    </>
                  ) : (
                    // 未衔接：只有 shot1 显示完整操作
                    <>
                      <ImageDisplay
                        label="首帧图"
                        value={data.firstFrameUrl}
                        generating={generatingFirst}
                        onRemove={() => updateNodeFirstFrame(id, undefined)}
                        onPreview={() => data.firstFrameUrl && handlePreviewImage(data.firstFrameUrl)}
                        onSave={() => data.firstFrameUrl && handleDownloadImage(data.firstFrameUrl, 'first')}
                      />
                      {/* 显示编辑和生成按钮 */}
                      {(!data.shotId || data.shotId === 1) && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px]"
                            onClick={() => setShowFirstFrameEdit(true)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant={generatingFirst ? "destructive" : "default"}
                            className="h-7 text-[10px]"
                            onClick={handleGenerateFirstFrame}
                            disabled={generatingLast}
                          >
                            {generatingFirst ? (
                              <>
                                <Square className="w-3 h-3 mr-1" />
                                停止
                              </>
                            ) : (
                              '生成'
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 尾帧区域 */}
                <div className="space-y-2">
                  <ImageDisplay
                    label="尾帧图"
                    value={data.lastFrameUrl}
                    generating={generatingLast}
                    onRemove={() => updateNodeLastFrame(id, undefined)}
                    onPreview={() => data.lastFrameUrl && handlePreviewImage(data.lastFrameUrl)}
                    onSave={() => data.lastFrameUrl && handleDownloadImage(data.lastFrameUrl, 'last')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => setShowLastFrameEdit(true)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant={generatingLast ? "destructive" : "default"}
                      className="h-7 text-[10px]"
                      onClick={handleGenerateLastFrame}
                      disabled={generatingFirst}
                    >
                      {generatingLast ? (
                        <>
                          <Square className="w-3 h-3 mr-1" />
                          停止
                        </>
                      ) : (
                        '生成'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentMode === 'multi-frame' && (
              <div className="space-y-3">
                {/* Prompt 展示和编辑区域 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">多帧参考 Prompt</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => setShowMultiFrameEdit(true)}
                    >
                      编辑
                    </Button>
                  </div>

                  {/* Prompt 预览 */}
                  {data.multiFramePrompt && (
                    <div className="p-2 bg-muted/30 rounded text-[10px] text-muted-foreground line-clamp-3">
                      {data.multiFramePrompt}
                    </div>
                  )}

                  {/* AI 增强和生成按钮 */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-[10px] flex-1 gap-1"
                      onClick={handleEnhanceMultiFrame}
                      disabled={multiFrameEnhancing || generatingMultiFrame}
                    >
                      {multiFrameEnhancing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          增强中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          AI 增强
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-[10px] flex-1"
                      onClick={handleGenerateMultiFrame}
                      disabled={generatingMultiFrame || multiFrameEnhancing}
                    >
                      {generatingMultiFrame ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        '生成九宫格'
                      )}
                    </Button>
                  </div>
                </div>

                {/* 3×3 九宫格展示区域 */}
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground">3×3 九宫格参考图</span>

                  {data.multiFrameImageUrl ? (
                    <div className="relative aspect-square">
                      {multiFrameImageLoadError ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 rounded border border-destructive/20 bg-destructive/5 p-3 text-center">
                          <p className="text-[10px] text-destructive">{MEDIA_URL_UNREACHABLE_HINT}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px]"
                            onClick={() => void handleGenerateMultiFrame()}
                            disabled={generatingMultiFrame}
                          >
                            重新生成九宫格
                          </Button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={data.multiFrameImageUrl}
                            alt="3×3 九宫格参考图"
                            className="w-full h-full object-contain rounded border border-border/10"
                            onError={() =>
                              data.multiFrameImageUrl &&
                              setMultiFrameFailedUrl(data.multiFrameImageUrl)
                            }
                          />
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-[8px] px-2 py-1 rounded">
                            九宫格
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square border-2 border-dashed border-border/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Layers className="h-6 w-6 mx-auto mb-1 opacity-40" />
                        <p className="text-[10px]">点击「AI 增强」或「生成九宫格」开始</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Prompt 编辑弹窗 */}
      <PromptEditDialog
        open={showFirstFrameEdit}
        onClose={() => setShowFirstFrameEdit(false)}
        onSave={handleSaveFirstFramePrompt}
        title="编辑首帧 Prompt"
        initialValue={data.firstFramePrompt || ''}
        placeholder="请输入首帧的画面描述..."
      />

      <PromptEditDialog
        open={showLastFrameEdit}
        onClose={() => setShowLastFrameEdit(false)}
        onSave={handleSaveLastFramePrompt}
        title="编辑尾帧 Prompt"
        initialValue={data.lastFramePrompt || ''}
        placeholder="请输入尾帧的画面描述..."
      />

      <PromptEditDialog
        open={showMultiFrameEdit}
        onClose={() => setShowMultiFrameEdit(false)}
        onSave={handleSaveMultiFramePrompt}
        title="编辑多帧参考 Prompt"
        initialValue={data.multiFramePrompt || ''}
        placeholder="请输入多帧参考的画面描述..."
        mainPrompt={data.prompt}
        showEnhanceButton={true}
      />

      {/* 图片预览弹窗 */}
      <ImagePreviewDialog
        open={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(undefined)}
        imageUrl={previewImageUrl}
      />
    </motion.div>
  )
}

export const ConfigNode = React.memo(ConfigNodeComponent)
