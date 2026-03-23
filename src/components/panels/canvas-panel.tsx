'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeTypes,
  type OnSelectionChangeFunc,
} from '@xyflow/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { motionVariants, transitions } from '@/lib/motion'
import { ConfigNode } from '@/components/nodes/config-node'
import { VideoNode } from '@/components/nodes/video-node'
import { useCanvasStore } from '@/stores/canvas-store'
import { useChainGeneration } from '@/hooks/use-chain-generation'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles, Square, Trash2, CheckSquare, Film } from 'lucide-react'
import { useBatchVideoGeneration } from '@/hooks/use-batch-video-generation'
import type { AppNode, AppEdge, Shot } from '@/types'

const nodeTypes: NodeTypes = {
  config: ConfigNode,
  video: VideoNode,
}

export function CanvasPanel() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const onNodesChange = useCanvasStore((s) => s.onNodesChange)
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange)
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId)
  const addEmptyConfigNode = useCanvasStore((s) => s.addEmptyConfigNode)
  const deleteNode = useCanvasStore((s) => s.deleteNode)
  const deleteNodes = useCanvasStore((s) => s.deleteNodes)
  const runAutoLayout = useCanvasStore((s) => s.runAutoLayout)
  const updateNodeFirstFrame = useCanvasStore((s) => s.updateNodeFirstFrame)
  const updateNodeLastFrame = useCanvasStore((s) => s.updateNodeLastFrame)
  const updateNodeImageGenStatus = useCanvasStore((s) => s.updateNodeImageGenStatus)
  const { fitView } = useReactFlow()
  const prevNodeCountRef = useRef(nodes.length)

  // 使用链式生成 hook
  const { startChainGeneration, abortChainGeneration } = useChainGeneration()
  const { runSequential: runBatchVideoSequential, abort: abortBatchVideo } = useBatchVideoGeneration(projectId)

  // 链式首尾帧生成状态
  const [isChainGenerating, setIsChainGenerating] = useState(false)
  const [currentChainShot, setCurrentChainShot] = useState(0)
  const [isBatchVideoRunning, setIsBatchVideoRunning] = useState(false)

  // 选中的节点列表
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  useEffect(() => {
    if (nodes.length !== prevNodeCountRef.current && nodes.length > 0) {
      prevNodeCountRef.current = nodes.length
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 })
      }, 50)
      return () => clearTimeout(timer)
    }
    prevNodeCountRef.current = nodes.length
  }, [nodes.length, fitView])

  const onSelectionChange: OnSelectionChangeFunc<AppNode, AppEdge> = useCallback(
    ({ nodes: selectedNodes }) => {
      const configNode = selectedNodes.find((n) => n.type === 'config')
      setSelectedNodeId(configNode?.id ?? null)
      setSelectedNodeIds(selectedNodes.map((n) => n.id))
    },
    [setSelectedNodeId]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Only trigger on pane double-click, not on nodes/edges
      const target = event.target as HTMLElement
      const isPane = target.classList.contains('react-flow__pane')
      if (isPane) {
        addEmptyConfigNode()
      }
    },
    [addEmptyConfigNode]
  )

  // 删除选中的节点
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      deleteNodes(selectedNodeIds)
      setSelectedNodeIds([])
    } else if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }, [selectedNodeIds, selectedNodeId, deleteNode, deleteNodes])

  // 全选节点
  const handleSelectAll = useCallback(() => {
    const configNodeIds = nodes
      .filter((n) => n.type === 'config')
      .map((n) => n.id)
    setSelectedNodeIds(configNodeIds)
  }, [nodes])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 只有当没有输入框聚焦时才删除节点
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          handleDeleteSelected()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDeleteSelected])

  // 从 config nodes 构造 Shot 数组
  const constructShotsFromNodes = useCallback((configNodes: Array<AppNode & { type: 'config' }>): Shot[] => {
    return configNodes.map((node) => {
      const data = node.data
      return {
        id: data.shotId || 0,
        title: data.title || `分镜 #${data.shotId}`,
        description: data.prompt,
        suggested_techniques: data.techniques.map((t) => t.prompt_keyword),
        duration: data.duration,
        ratio: data.ratio,
        scene_type: data.sceneType,
        shot_size: data.shotSize,
        transition: data.transition,
        core_info: data.coreInfo,
        visual_keywords: data.visualKeywords,
        character_features: data.characterFeatures,
        scene_features: data.sceneFeatures,
        consistency_notes: data.consistencyNotes,
        selected_prompt: data.selectedPrompt,
        alternative_prompts: data.alternativePrompts,
        first_frame_prompt: data.firstFramePrompt,
        last_frame_prompt: data.lastFramePrompt,
        composition: data.composition,
        lighting: data.lighting,
        subject: data.subject,
        background: data.background,
        action_movement: data.actionMovement,
        text_overlay: data.textOverlay,
        transition_detail: data.transitionDetail,
        audio: data.audio,
      }
    })
  }, [])

  // 开始链式生成
  const handleStartChainGeneration = useCallback(async () => {
    const configNodes = nodes.filter((n): n is AppNode & { type: 'config' } => n.type === 'config')

    if (configNodes.length === 0) {
      return
    }

    // 按shotId排序
    const sortedNodes = [...configNodes].sort((a, b) => (a.data.shotId || 0) - (b.data.shotId || 0))

    // 构造 Shot 数组和 node IDs
    const shots = constructShotsFromNodes(sortedNodes)
    const configNodeIds = sortedNodes.map((n) => n.id)

    setIsChainGenerating(true)
    setCurrentChainShot(0)

    try {
      await startChainGeneration(
        shots,
        configNodeIds,
        updateNodeFirstFrame,
        updateNodeLastFrame,
        updateNodeImageGenStatus,
        projectId
      )
    } catch (error) {
      console.error('[Chain Generation] Error:', error)
    } finally {
      setIsChainGenerating(false)
      setCurrentChainShot(0)
    }
  }, [nodes, constructShotsFromNodes, startChainGeneration, updateNodeFirstFrame, updateNodeLastFrame, updateNodeImageGenStatus, projectId])

  // 停止链式生成
  const handleStopChainGeneration = useCallback(() => {
    abortChainGeneration()
    setIsChainGenerating(false)
    setCurrentChainShot(0)
  }, [abortChainGeneration])

  // 根据状态处理按钮点击
  const handleChainGenerationClick = useCallback(() => {
    if (isChainGenerating) {
      handleStopChainGeneration()
    } else {
      handleStartChainGeneration()
    }
  }, [isChainGenerating, handleStartChainGeneration, handleStopChainGeneration])

  const handleBatchVideoClick = useCallback(async () => {
    if (isBatchVideoRunning) {
      abortBatchVideo()
      setIsBatchVideoRunning(false)
      return
    }
    setIsBatchVideoRunning(true)
    try {
      await runBatchVideoSequential()
    } finally {
      setIsBatchVideoRunning(false)
    }
  }, [isBatchVideoRunning, abortBatchVideo, runBatchVideoSequential])

  const isEmpty = nodes.length === 0

  return (
    <motion.div className="flex-1 relative" {...motionVariants.fadeIn} transition={transitions.default}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onDoubleClick={onDoubleClick}
        deleteKeyCode="Delete"
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{
          animated: false,
          type: 'default',
          style: { stroke: '#b0b0b0', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="transparent" />
        <Controls className="bg-card/90! backdrop-blur-lg! border-border/10! shadow-md! rounded-xl!" />
        <MiniMap
          className="bg-card/90! backdrop-blur-lg! border-border/10! rounded-xl! shadow-sm!"
          nodeColor="var(--muted)"
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              在右栏输入故事，或双击画布创建节点
            </p>
            <Button
              onClick={addEmptyConfigNode}
              variant="outline"
              className="pointer-events-auto text-xs sm:text-sm"
            >
              + 添加第一个分镜
            </Button>
          </div>
        </div>
      )}

      {/* 画布工具栏 */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shadow-md gap-1.5 text-xs sm:text-sm')}
        >
          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">返回首页</span>
        </Link>
        <Button
          onClick={addEmptyConfigNode}
          variant="default"
          size="sm"
          className="shadow-md border border-black/10 bg-[hsl(0_90%_50%)] text-white hover:bg-[hsl(0_85%_42%)] [&_svg]:text-white text-xs sm:text-sm"
        >
          + 添加节点
        </Button>
        {!isEmpty && selectedNodeIds.length > 0 && (
          <>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="shadow-md gap-1.5 text-xs"
            >
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">全选</span>
            </Button>
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              size="sm"
              className="shadow-md gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">删除选中</span>({selectedNodeIds.length})
            </Button>
          </>
        )}
        {!isEmpty && selectedNodeIds.length === 0 && selectedNodeId && (
          <Button
            onClick={handleDeleteSelected}
            variant="destructive"
            size="sm"
            className="shadow-md gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">删除节点</span>
          </Button>
        )}
      </div>

      {/* Chain + batch video — bottom-center */}
      {!isEmpty && (
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={handleChainGenerationClick}
            disabled={nodes.length === 0 || isBatchVideoRunning}
            variant="default"
            className={isChainGenerating
              ? 'rounded-full border border-red-800/20 bg-red-600 px-4 sm:px-6 py-2 sm:py-3 text-white shadow-lg transition-all hover:bg-red-700 [&_svg]:text-white text-xs sm:text-sm'
              : 'rounded-full border border-black/15 bg-[hsl(0_90%_50%)] px-4 sm:px-6 py-2 sm:py-3 text-white shadow-lg transition-all hover:bg-[hsl(0_85%_42%)] [&_svg]:text-white text-xs sm:text-sm'
            }
          >
            {isChainGenerating ? (
              <>
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                停止生成 ({currentChainShot}/{nodes.filter((n) => n.type === 'config').length})
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                链式首尾帧生成
              </>
            )}
          </Button>
          <Button
            onClick={handleBatchVideoClick}
            disabled={nodes.length === 0 || isChainGenerating}
            variant="default"
            className={isBatchVideoRunning
              ? 'rounded-full border border-amber-900/25 bg-amber-700 px-4 sm:px-6 py-2 sm:py-3 text-white shadow-lg transition-all hover:bg-amber-800 [&_svg]:text-white text-xs sm:text-sm'
              : 'rounded-full border border-black/15 bg-[hsl(220_70%_45%)] px-4 sm:px-6 py-2 sm:py-3 text-white shadow-lg transition-all hover:bg-[hsl(220_65%_38%)] [&_svg]:text-white text-xs sm:text-sm'
            }
          >
            {isBatchVideoRunning ? (
              <>
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                停止批量视频
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                顺序生成视频
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}
