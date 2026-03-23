'use client'

import { useChat } from '@ai-sdk/react'
import { toast } from 'sonner'
import { DefaultChatTransport } from 'ai'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StoryboardTabs } from '@/components/ui/storyboard-tabs'
import { ThreeStageProgress } from '@/components/ui/three-stage-progress'
import { GlobalConfigBar } from '@/components/ui/global-config-bar'
import { useCanvasStore } from '@/stores/canvas-store'
import { useChainGeneration } from '@/hooks/use-chain-generation'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants, transitions } from '@/lib/motion'
import { Send, Loader2, Sparkles, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Shot } from '@/types'
import type { UIMessage } from 'ai'
import type { ConceptResult } from '@/types/concept'
import type { PlanningResult } from '@/types/planning'
import type { StoryboardResult } from '@/types/chat'

export function RightPanel() {
  const projectId = useSearchParams().get('projectId')
  const currentStage = useCanvasStore((s) => s.currentStage)
  const stageStatus = useCanvasStore((s) => s.stageStatus)
  const conceptResult = useCanvasStore((s) => s.conceptResult)
  const planningResult = useCanvasStore((s) => s.planningResult)
  const setConceptResult = useCanvasStore((s) => s.setConceptResult)
  const setPlanningResult = useCanvasStore((s) => s.setPlanningResult)
  const setStoryboardResult = useCanvasStore((s) => s.setStoryboardResult)
  const setCurrentStage = useCanvasStore((s) => s.setCurrentStage)
  const setStageStatus = useCanvasStore((s) => s.setStageStatus)

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ body, messages: msgs }) => {
          const st = useCanvasStore.getState()
          return {
            body: {
              ...body,
              messages: msgs,
              chatModelKey: st.globalConfig.chatModelKey,
              pipelineContext: {
                currentStage: st.currentStage,
                hasConcept: !!st.conceptResult,
                hasPlanning: !!st.planningResult,
              },
            },
          }
        },
      }),
    []
  )

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: chatTransport,
    onError: (err) => {
      console.error('[RightPanel] Chat error:', err)
      toast.error('对话发生错误，建议清空对话重试')
    },
    onFinish: ({ message }) => {
      console.log('[RightPanel] Chat onFinish:', {
        messageId: message.id,
        role: message.role,
        partsCount: message.parts?.length || 0,
        parts: message.parts?.map(p => ({
          type: p.type,
          state: (p as any).state,
          hasOutput: 'output' in p
        }))
      })
    },
    onToolCall: ({ toolCall }) => {
      console.log('[RightPanel] onToolCall:', {
        toolName: toolCall.toolName,
      })
    },
  })

  // 调试：监听status变化
  useEffect(() => {
    console.log('[RightPanel] Status changed:', status)
  }, [status])

  const [input, setInput] = useState('')
  const [addedShotIds, setAddedShotIds] = useState<Set<string>>(new Set())
  const [lastShots, setLastShots] = useState<Shot[]>([])
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false)
  const [inputCollapsed, setInputCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 清除对话历史
  const handleClearHistory = useCallback(() => {
    setMessages([])
    setAddedShotIds(new Set())
    setLastShots([])
  }, [setMessages, setAddedShotIds, setLastShots])

  // 分别调用 useCanvasStore，避免对象创建导致无限循环
  const addStoryboardNode = useCanvasStore((s) => s.addStoryboardNode)
  const addMultipleStoryboardNodes = useCanvasStore((s) => s.addMultipleStoryboardNodes)
  const nodes = useCanvasStore((s) => s.nodes)
  const updateNodeFirstFrame = useCanvasStore((s) => s.updateNodeFirstFrame)
  const updateNodeLastFrame = useCanvasStore((s) => s.updateNodeLastFrame)
  const updateNodeImageGenStatus = useCanvasStore((s) => s.updateNodeImageGenStatus)

  // 链式生成hook（不包含任何store调用，避免嵌套订阅）
  const { startChainGeneration, abortChainGeneration } = useChainGeneration()

  const isLoading = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0 || isLoading

  // 调试：监听 messages 变化
  useEffect(() => {
    console.log('[RightPanel] Messages updated:', {
      count: messages.length,
      messages: messages.map(m => ({
        role: m.role,
        partsCount: m.parts?.length || 0,
        hasText: m.parts?.some((p: any) => p.type === 'text'),
        parts: m.parts?.map((p: any) => ({
          type: p.type,
          state: p.state,
          toolName: p.toolName,
          hasOutput: !!p.output,
          outputKeys: p.output ? Object.keys(p.output) : []
        }))
      }))
    })
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 从全部助手消息中取「最新一次」各工具输出（避免仅看最后一条助手消息时漏掉分镜）
  useEffect(() => {
    const assistantsNewestFirst = [...messages].filter((m) => m.role === 'assistant').reverse()
    let appliedConcept = false
    let appliedPlanning = false
    let appliedStoryboard = false

    for (const message of assistantsNewestFirst) {
      if (!message.parts) continue
      for (const part of message.parts) {
        const p = part as { type?: string; state?: string; output?: unknown; toolName?: string }
        if (p.state !== 'output-available' || p.output == null) continue

        if (!appliedConcept && p.type === 'tool-generateConcept') {
          const out = p.output as ConceptResult
          const cur = useCanvasStore.getState().conceptResult
          if (cur?.concept_id === out.concept_id) {
            appliedConcept = true
            continue
          }
          setConceptResult(out)
          setStageStatus('concept', 'done')
          setCurrentStage('planning')
          appliedConcept = true
          continue
        }
        if (!appliedPlanning && p.type === 'tool-generatePlanning') {
          const out = p.output as PlanningResult
          const cur = useCanvasStore.getState().planningResult
          if (cur?.planning_id === out.planning_id) {
            appliedPlanning = true
            continue
          }
          setPlanningResult(out)
          setStageStatus('planning', 'done')
          setCurrentStage('storyboard')
          appliedPlanning = true
          continue
        }
        const isStoryboardTool =
          p.type === 'tool-generateStoryboard' ||
          (p.type === 'dynamic-tool' && p.toolName === 'generateStoryboard')
        if (!appliedStoryboard && isStoryboardTool) {
          const out = p.output as { overview?: StoryboardResult['overview']; shots?: Shot[] }
          if (!out?.shots?.length) continue
          const cur = useCanvasStore.getState().storyboardResult
          const sig = `${out.shots.length}-${out.shots[0]?.id}-${out.shots[out.shots.length - 1]?.id}`
          const curSig = cur?.shots?.length
            ? `${cur.shots.length}-${cur.shots[0]?.id}-${cur.shots[cur.shots.length - 1]?.id}`
            : ''
          if (sig === curSig) {
            appliedStoryboard = true
            continue
          }
          setStoryboardResult({
            overview: out.overview ?? {
              total_shots: out.shots.length,
              total_duration: out.shots.reduce((s, x) => s + (x.duration || 0), 0),
              style_profile: { color_scheme: '-', mood: '-', visual_style: '-' },
              consistency_report: {
                character_consistency: true,
                scene_consistency: true,
                style_consistency: true,
                notes: [],
              },
            },
            shots: out.shots,
          })
          setStageStatus('storyboard', 'done')
          setCurrentStage('complete')
          addMultipleStoryboardNodes(out.shots)
          setAddedShotIds(new Set(out.shots.map((s) => String(s.id))))
          setLastShots(out.shots)
          toast.success('分镜已同步到画布')
          appliedStoryboard = true
        }
      }
    }
  }, [
    messages,
    setConceptResult,
    setPlanningResult,
    setStoryboardResult,
    setCurrentStage,
    setStageStatus,
    addMultipleStoryboardNodes,
  ])

  const handleAddToCanvas = useCallback(
    (shot: Shot) => {
      const shotKey = String(shot.id)
      addStoryboardNode(shot)
      setAddedShotIds((prev) => new Set(prev).add(shotKey))
    },
    [addStoryboardNode]
  )

  const handleAddAllToCanvas = useCallback(
    (shots: Shot[]) => {
      addMultipleStoryboardNodes(shots)
      setAddedShotIds((prev) => {
        const next = new Set(prev)
        shots.forEach((shot) => next.add(String(shot.id)))
        return next
      })
      // 保存shots用于链式生成
      setLastShots(shots)
    },
    [addMultipleStoryboardNodes]
  )

  const handleChainGeneration = useCallback(async () => {
    if (lastShots.length === 0) {
      toast.error('请先加入分镜到画布')
      return
    }

    // 获取所有config node IDs，通过shotId匹配
    const configNodeIds = nodes
      .filter((n) => n.type === 'config')
      .filter((n) => {
        const nodeShotId = n.data.shotId
        return nodeShotId !== undefined && lastShots.some((s) => s.id === nodeShotId)
      })
      .sort((a, b) => {
        // 按shotId排序，确保顺序正确
        const aShotId = a.data.shotId ?? 0
        const bShotId = b.data.shotId ?? 0
        return aShotId - bShotId
      })
      .map((n) => n.id)

    if (configNodeIds.length !== lastShots.length) {
      toast.error('部分分镜节点未找到，请重新加入画布')
      return
    }

    setIsGeneratingFrames(true)
    try {
      console.log('[链式生成] 开始生成', {
        shotsCount: lastShots.length,
        nodesCount: configNodeIds.length,
        shots: lastShots.map((s) => ({ id: s.id, title: s.title })),
        nodes: configNodeIds,
      })
      await startChainGeneration(
        lastShots,
        configNodeIds,
        updateNodeFirstFrame,
        updateNodeLastFrame,
        updateNodeImageGenStatus,
        projectId
      )
    } catch (error) {
      console.error('链式生成失败:', error)
    } finally {
      setIsGeneratingFrames(false)
    }
  }, [lastShots, nodes, startChainGeneration, updateNodeFirstFrame, updateNodeLastFrame, updateNodeImageGenStatus, projectId])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      console.log('[handleSubmit] 发送消息:', input.trim())
      console.log('[handleSubmit] 当前状态:', { status, messagesCount: messages.length })
      sendMessage({ text: input.trim() })
      setInput('')
      console.log('[handleSubmit] 消息已发送，清空输入框')
    },
    [input, isLoading, sendMessage, status, messages]
  )

  const renderMessage = (message: UIMessage) => {
    console.log('[renderMessage] 渲染消息:', {
      role: message.role,
      partsCount: message.parts?.length || 0,
      parts: message.parts?.map(p => ({ type: p.type, hasText: 'text' in p }))
    })

    if (message.role === 'user') {
      const textContent = message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')

      return (
        <div className="mb-4 flex justify-end">
          <div className="max-w-[80%] break-words rounded-2xl border border-black/15 bg-[hsl(0_90%_50%)] px-4 py-2.5 text-sm font-medium text-white shadow-sm">
            {textContent}
          </div>
        </div>
      )
    }

    const textParts = message.parts.filter(
      (p): p is { type: 'text'; text: string } => p.type === 'text'
    )
    const textContent = textParts.map((p) => p.text).join('')

    console.log('[renderMessage] Assistant 消息内容:', {
      textPartsCount: textParts.length,
      textLength: textContent.length,
      textPreview: textContent.substring(0, 100)
    })

    const toolParts = message.parts.filter(
      (p) =>
        p.type === 'tool-generateStoryboard' ||
        (p.type === 'dynamic-tool' &&
          'toolName' in p &&
          (p as { toolName: string }).toolName === 'generateStoryboard')
    )

    console.log('[renderMessage] 工具parts:', {
      toolPartsCount: toolParts.length,
      toolParts: toolParts.map(p => ({
        type: p.type,
        state: (p as { state?: string }).state,
        hasOutput: 'output' in p,
        toolName: (p as { toolName?: string }).toolName
      }))
    })

    // 检查storyboard工具完成状态
    const completedStoryboardPart = toolParts.find(
      (p) => (p as { state: string }).state === 'output-available' && 'output' in p && typeof (p as any).output === 'object' && 'overview' in (p as any).output
    ) as { state: 'output-available'; output: any } | undefined

    // 向后兼容：如果没有overview，使用旧格式
    const completedToolPart = completedStoryboardPart || toolParts.find(
      (p) => (p as { state: string }).state === 'output-available'
    ) as { state: 'output-available'; output: { shots: Shot[] } } | undefined

    console.log('[renderMessage] 工具完成状态:', {
      hasCompletedStoryboardPart: !!completedStoryboardPart,
      completedToolPart: completedToolPart ? {
        state: completedToolPart.state,
        hasShots: !!completedToolPart.output?.shots,
        shotsCount: completedToolPart.output?.shots?.length
      } : null
    })

    const pendingToolPart = toolParts.find(
      (p) => {
        const state = (p as { state: string }).state
        return state === 'input-available' || state === 'input-streaming'
      }
    )

    return (
      <div className="flex justify-start w-full mb-4">
        <div className="w-full space-y-3">
          {textContent && (
            <div className="rounded-2xl border border-black/10 bg-white/90 px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-zinc-900 shadow-sm">
              {textContent}
            </div>
          )}
          {completedToolPart && (
            <div className="w-full">
              <StoryboardTabs
                overview={completedToolPart.output.overview || { total_shots: completedToolPart.output.shots.length, total_duration: completedToolPart.output.shots.reduce((sum: number, s: Shot) => sum + s.duration, 0), style_profile: { color_scheme: '-', mood: '-', visual_style: '-' }, consistency_report: { character_consistency: true, scene_consistency: true, style_consistency: true, notes: [] } }}
                shots={completedToolPart.output.shots}
                onAddToCanvas={handleAddToCanvas}
                onAddAllToCanvas={handleAddAllToCanvas}
                addedShotIds={addedShotIds}
                conceptResult={conceptResult}
                planningResult={planningResult}
              />
            </div>
          )}
          {pendingToolPart && !completedToolPart && (
            <div className="relative overflow-hidden rounded-2xl border border-[hsl(0_90%_50%)]/35 bg-[hsl(0_95%_55%)]/12 px-4 py-3">
              {/* 扫描动画 */}
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[hsl(0_95%_55%)]/15 to-transparent" />

              <div className="relative flex items-center gap-2.5 text-sm font-semibold text-[hsl(0_85%_40%)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Sparkles className="h-4 w-4 animate-pulse" />
                正在生成分镜...
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // No messages: show centered bottom input
  if (!hasMessages) {
    return (
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-[640px] max-w-[calc(100vw-2rem)]">
        <AnimatePresence mode="wait">
          {inputCollapsed ? (
            // Collapsed state - show a small toggle button
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#E6E7E9] rounded-xl shadow-lg border border-black/20 p-2 flex items-center justify-center"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInputCollapsed(false)}
                className="flex items-center gap-2 text-[hsl(0_90%_50%)] hover:text-[hsl(0_85%_42%)]"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">展开创作助手</span>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            // Expanded state - show full input area
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#E6E7E9] rounded-2xl shadow-[0_6px_32px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)] border border-black/20 overflow-hidden"
            >
              {/* Header with collapse button */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-black/10">
                <Sparkles className="h-4 w-4 text-[hsl(0_90%_50%)]" />
                <span className="text-xs sm:text-sm font-semibold text-black flex-1">描述你的故事，AI 将为你生成分镜脚本</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setInputCollapsed(true)}
                  className="h-6 w-6 text-black/60 hover:text-black hover:bg-black/5"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Input area */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {/* 输入框 + 发送按钮 - 同一排 */}
                <div className="flex gap-2 items-center">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="例如：一个孤独旅人穿越沙漠寻找绿洲..."
                    className="min-h-10 max-h-[80px] flex-1 resize-none border-black/15 bg-white text-sm text-zinc-900 placeholder:text-zinc-500"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    onClick={(e) => handleSubmit(e)}
                    className="shrink-0 border border-black/10 bg-[hsl(0_90%_50%)] text-white shadow-sm hover:bg-[hsl(0_85%_42%)] [&_svg]:text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1 h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">发送</span>
                  </Button>
                </div>

                {/* 全局配置栏 */}
                <GlobalConfigBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Has messages: show floating right panel
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute right-2 sm:right-5 top-12 sm:top-5 bottom-2 sm:bottom-5 w-[calc(100%-1rem)] sm:w-[360px] max-w-[calc(100vw-2rem)] z-40 bg-[#E6E7E9] text-black flex flex-col rounded-2xl shadow-[0_6px_32px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)] border border-black/20 overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-black/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(0_90%_50%)]" />
          <h2 className="text-sm font-semibold text-zinc-900">AI 分镜助手</h2>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="h-7 px-2 text-xs font-medium text-zinc-700 hover:bg-black/5 hover:text-red-700"
          >
            清空
          </Button>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-2 border-b border-black/10">
        <ThreeStageProgress currentStage={currentStage} stageStatus={stageStatus} className="bg-white/60 border-black/10" />
        <p className="mt-1.5 text-[10px] text-zinc-600">
          请按阶段推进：创意构思 → 视频规划 → 分镜脚本；模型会按需调用对应工具。
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="w-full overflow-hidden">
              {renderMessage(message)}
            </div>
          ))}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted/70 rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          {error && (
            <div className="flex justify-start">
              <div className="bg-destructive/10 border border-destructive/15 rounded-2xl px-4 py-2.5 max-w-[85%]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">请求失败</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                    <button
                      className="text-sm text-primary hover:underline"
                      onClick={clearError}
                    >
                      清除错误
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <AnimatePresence mode="wait">
        {inputCollapsed ? (
          <motion.div
            key="input-collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/10"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setInputCollapsed(false)}
              className="w-full h-10 rounded-none flex items-center justify-center gap-2 text-[hsl(0_90%_50%)] hover:text-[hsl(0_85%_42%)] border-t border-black/5"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">展开输入</span>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="input-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/10"
          >
            {/* Collapse toggle */}
            <div className="flex items-center justify-center border-b border-black/5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInputCollapsed(true)}
                className="h-8 text-xs text-black/50 hover:text-black flex items-center gap-1"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                收起
              </Button>
            </div>

            <div className="p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="描述你的故事..."
                  className="min-h-10 max-h-[120px] resize-none border-black/15 bg-white text-sm text-zinc-900 placeholder:text-zinc-500"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 self-end border border-black/10 bg-[hsl(0_90%_50%)] text-white hover:bg-[hsl(0_85%_42%)] disabled:opacity-40 [&_svg]:text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
