import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from '@xyflow/react'
import type { AppNode, AppEdge, ConfigNodeData, VideoNodeData, ConfigNode, VideoNode, Technique, Shot, ReferenceFrameMode, ImageGrid, ImageGenMode, ImageGenStatus } from '@/types'
import type { ConceptResult } from '@/types/concept'
import type { PlanningResult } from '@/types/planning'
import type { StoryboardResult } from '@/types/chat'
import type { StyleTemplate } from '@/lib/style-templates'
import { NODE_X_GAP, NODE_START_X, CONFIG_NODE_Y, VIDEO_NODE_Y_OFFSET, TECHNIQUE_CATEGORIES } from '@/lib/constants'
import { autoLayout } from '@/lib/auto-layout'
import {
  getDefaultChatModelKey,
  getDefaultImageModelKey,
  getDefaultVideoModelKey,
  type ChatModelKey,
  type ImageModelKey,
  type VideoModelKey,
} from '@/lib/model-registry'

// 全局配置类型
export type GlobalConfig = {
  videoModelKey: VideoModelKey
  imageModelKey: ImageModelKey
  chatModelKey: ChatModelKey
  referenceFrameMode: ReferenceFrameMode
  ratio: ConfigNodeData['ratio']
  duration: ConfigNodeData['duration']
  resolution: ConfigNodeData['resolution']
  /** 项目级一致性：写入每镜视频 prompt（可在左栏编辑） */
  characterBible: string
  sceneBible: string
  styleBible: string
}

export type ProjectCanvasSnapshot = {
  id: string
  label: string
  createdAt: string
  core: {
    version: 1
    nodes: AppNode[]
    edges: AppEdge[]
    nodeCounter: number
    globalConfig: GlobalConfig
    conceptResult?: ConceptResult
    planningResult?: PlanningResult
    storyboardResult?: StoryboardResult
    currentStage: 'concept' | 'planning' | 'storyboard' | 'complete'
    stageStatus: {
      concept: 'pending' | 'loading' | 'done'
      planning: 'pending' | 'loading' | 'done'
      storyboard: 'pending' | 'loading' | 'done'
    }
  }
}

// Build a lookup map from prompt_keyword to Technique for resolving AI suggestions
const techniqueByKeyword: Map<string, Technique> = new Map()
for (const category of TECHNIQUE_CATEGORIES) {
  for (const technique of category.techniques) {
    techniqueByKeyword.set(technique.prompt_keyword.toLowerCase(), technique)
  }
}

function resolveTechniques(suggestedKeywords: string[]): Technique[] {
  const resolved: Technique[] = []
  const seen = new Set<string>()
  for (const keyword of suggestedKeywords) {
    const technique = techniqueByKeyword.get(keyword.toLowerCase())
    if (technique && !seen.has(technique.id)) {
      seen.add(technique.id)
      resolved.push(technique)
    }
  }
  return resolved
}

function mergeShotIntoConfigData(shot: Shot, prev: ConfigNodeData, globalConfig: GlobalConfig): ConfigNodeData {
  const resolvedTechniques =
    shot.suggested_techniques?.length > 0
      ? resolveTechniques(shot.suggested_techniques)
      : prev.techniques
  const prompt = shot.selected_prompt || shot.description || prev.prompt

  return {
    ...prev,
    shotId: shot.id,
    title: `分镜 #${shot.id}: ${shot.title}`,
    prompt,
    techniques: resolvedTechniques,
    ratio: (shot.ratio as ConfigNodeData['ratio']) || prev.ratio || globalConfig.ratio,
    duration: (shot.duration as ConfigNodeData['duration']) || prev.duration || globalConfig.duration,
    resolution: prev.resolution,
    referenceFrameMode: prev.referenceFrameMode,
    sceneType: shot.scene_type ?? prev.sceneType,
    shotSize: shot.shot_size ?? prev.shotSize,
    transition: shot.transition ?? prev.transition,
    coreInfo: shot.core_info ?? prev.coreInfo,
    visualKeywords: shot.visual_keywords ?? prev.visualKeywords,
    characterFeatures: shot.character_features ?? prev.characterFeatures,
    sceneFeatures: shot.scene_features ?? prev.sceneFeatures,
    consistencyNotes: shot.consistency_notes ?? prev.consistencyNotes,
    selectedPrompt: shot.selected_prompt ?? prev.selectedPrompt,
    alternativePrompts: shot.alternative_prompts ?? prev.alternativePrompts,
    firstFramePrompt: shot.first_frame_prompt ?? prev.firstFramePrompt,
    lastFramePrompt: shot.last_frame_prompt ?? prev.lastFramePrompt,
    composition: shot.composition ?? prev.composition,
    lighting: shot.lighting ?? prev.lighting,
    subject: shot.subject ?? prev.subject,
    background: shot.background ?? prev.background,
    actionMovement: shot.action_movement ?? prev.actionMovement,
    textOverlay: shot.text_overlay ?? prev.textOverlay,
    transitionDetail: shot.transition_detail ?? prev.transitionDetail,
    audio: shot.audio ?? prev.audio,
    firstFrameUrl: prev.firstFrameUrl,
    lastFrameUrl: prev.lastFrameUrl,
    multiFrameImageUrl: prev.multiFrameImageUrl,
    multiFramePrompt: prev.multiFramePrompt,
    referenceImageUrls: prev.referenceImageUrls,
    negativePrompt: prev.negativePrompt,
    status: prev.status,
    imageGenStatus: prev.imageGenStatus,
    imageGenHistory: prev.imageGenHistory,
    availableGenModes: prev.availableGenModes,
    currentImageGrid: prev.currentImageGrid,
  }
}

type CanvasState = {
  nodes: AppNode[]
  edges: AppEdge[]
  selectedNodeId: string | null
  nodeCounter: number
  pendingRegeneration: Set<string>
  globalConfig: GlobalConfig

  // ===== 三阶段流程状态 =====
  // 阶段数据
  conceptResult?: ConceptResult
  planningResult?: PlanningResult
  storyboardResult?: StoryboardResult

  // 当前阶段和状态
  currentStage: 'concept' | 'planning' | 'storyboard' | 'complete'
  stageStatus: {
    concept: 'pending' | 'loading' | 'done'
    planning: 'pending' | 'loading' | 'done'
    storyboard: 'pending' | 'loading' | 'done'
  }

  // 风格模板缓存
  styleTemplateCache: Map<string, StyleTemplate>

  /** 手动里程碑快照（仅存于项目 JSON，非对象存储） */
  stateSnapshots: ProjectCanvasSnapshot[]

  // React Flow handlers
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void

  // Setters
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: AppEdge[]) => void
  setSelectedNodeId: (id: string | null) => void
  setGlobalConfig: (config: Partial<GlobalConfig>) => void

  // Node creation
  addEmptyConfigNode: () => void
  addStoryboardNode: (shot: Shot) => void
  addMultipleStoryboardNodes: (shots: Shot[]) => { configNodeIds: string[]; shots: Shot[] }
  deleteNode: (nodeId: string) => void
  deleteNodes: (nodeIds: string[]) => void

  // Node updates
  updateNodeConfig: (nodeId: string, technique: Technique) => void
  removeNodeTechnique: (nodeId: string, techniqueId: string) => void
  updateNodePrompt: (nodeId: string, prompt: string) => void
  updateNodeNegativePrompt: (nodeId: string, negativePrompt: string) => void
  updateNodeRatio: (nodeId: string, ratio: ConfigNodeData['ratio']) => void
  updateNodeDuration: (nodeId: string, duration: ConfigNodeData['duration']) => void
  updateNodeResolution: (nodeId: string, resolution: ConfigNodeData['resolution']) => void
  updateNodeStatus: (nodeId: string, status: ConfigNodeData['status']) => void
  setVideoResult: (configNodeId: string, videoUrl: string, prompt?: string, lastFrameUrl?: string) => void
  /** 将视频节点当前展示与历史最新一条的 URL 替换为 Storage 稳定地址（不改变历史条数） */
  patchVideoNodeMediaUrls: (
    configNodeId: string,
    patch: { videoUrl?: string; lastFrameUrl?: string }
  ) => void
  updateVideoNodeStatus: (videoNodeId: string, status: VideoNodeData['status']) => void

  // Image uploads (首尾帧模式 + 参考图模式)
  updateNodeFirstFrame: (nodeId: string, firstFrameUrl: string | undefined) => void
  updateNodeLastFrame: (nodeId: string, lastFrameUrl: string | undefined) => void
  updateNodeFirstFramePrompt: (nodeId: string, firstFramePrompt: string) => void
  updateNodeLastFramePrompt: (nodeId: string, lastFramePrompt: string) => void
  updateNodeMultiFramePrompt: (nodeId: string, multiFramePrompt: string) => void
  updateNodeMultiFrameImageUrl: (nodeId: string, multiFrameImageUrl: string) => void
  updateNodeReferenceImages: (nodeId: string, referenceImageUrls: string[]) => void
  updateNodeReferenceFrameMode: (nodeId: string, referenceFrameMode: ReferenceFrameMode) => void

  // Regeneration
  resetForRegeneration: (configNodeId: string) => void
  clearPendingRegeneration: (configNodeId: string) => void

  // Video version switching
  switchVideoVersion: (videoNodeId: string, historyEntryId: string) => void

  // Layout
  runAutoLayout: () => void

  // Chain generation
  getPreviousNodeLastFrame: (configNodeId: string) => string | undefined

  // Image generation operations
  updateNodeImageGenStatus: (nodeId: string, status: ImageGenStatus) => void
  setCurrentImageGrid: (nodeId: string, grid: ImageGrid | undefined) => void
  selectImageInGrid: (nodeId: string, imageId: string) => void
  confirmImageSelection: (nodeId: string, imageUrl: string, targetSlot: 'first' | 'last' | 'reference') => void
  updateAvailableGenModes: (nodeId: string) => void

  // 8要素字段更新
  updateNodeEightFields: (nodeId: string, fields: Partial<Pick<ConfigNodeData, 'composition' | 'lighting' | 'subject' | 'background' | 'actionMovement' | 'textOverlay' | 'transitionDetail' | 'audio'>>) => void

  // Getters
  getSelectedNodeData: () => ConfigNodeData | null

  // ===== 三阶段流程方法 =====
  // 设置阶段数据
  setConceptResult: (result: ConceptResult) => void
  setPlanningResult: (result: PlanningResult) => void
  setStoryboardResult: (result: StoryboardResult) => void

  // 设置当前阶段
  setCurrentStage: (stage: 'concept' | 'planning' | 'storyboard' | 'complete') => void
  setStageStatus: (stage: 'concept' | 'planning' | 'storyboard', status: 'pending' | 'loading' | 'done') => void

  // 风格模板缓存
  setStyleTemplateCache: (styleName: string, template: StyleTemplate) => void
  getStyleTemplateFromCache: (styleName: string) => StyleTemplate | undefined

  // 重置三阶段数据
  resetThreeStageData: () => void

  pushStateSnapshot: (label: string) => void
  restoreStateSnapshot: (snapshotId: string) => void

  getOrderedConfigNodes: () => { id: string; data: ConfigNodeData }[]
  getConfigNodeByShotId: (shotId: number) => ConfigNode | undefined

  // ===== 项目持久化（Supabase） =====
  getPersistableState: () => {
    version: 1
    nodes: AppNode[]
    edges: AppEdge[]
    nodeCounter: number
    globalConfig: GlobalConfig
    conceptResult?: ConceptResult
    planningResult?: PlanningResult
    storyboardResult?: StoryboardResult
    currentStage: CanvasState['currentStage']
    stageStatus: CanvasState['stageStatus']
    stateSnapshots: ProjectCanvasSnapshot[]
  }
  hydratePersistedState: (snapshot: {
    version: 1
    nodes: AppNode[]
    edges: AppEdge[]
    nodeCounter: number
    globalConfig: GlobalConfig
    conceptResult?: ConceptResult
    planningResult?: PlanningResult
    storyboardResult?: StoryboardResult
    currentStage: CanvasState['currentStage']
    stageStatus: CanvasState['stageStatus']
    stateSnapshots?: ProjectCanvasSnapshot[]
  }) => void
  resetCanvas: () => void
}

function createConfigNode(
  id: string,
  position: { x: number; y: number },
  data: Partial<ConfigNodeData> = {}
): ConfigNode {
  return {
    id,
    type: 'config',
    position,
    data: {
      prompt: '',
      techniques: [],
      ratio: '16:9',
      duration: 5,
      resolution: '720p',
      status: 'idle',
      imageGenStatus: 'idle',
      imageGenHistory: [],
      availableGenModes: ['initial-character', 'story-based'],
      ...data,
    },
  }
}

function createVideoNode(configNodeId: string, position: { x: number; y: number }): VideoNode {
  return {
    id: configNodeId.replace('config-', 'video-'),
    type: 'video',
    position,
    data: {
      configNodeId,
      history: [],
      status: 'idle',
    },
  }
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  nodeCounter: 0,
  pendingRegeneration: new Set(),
  globalConfig: {
    videoModelKey: getDefaultVideoModelKey(),
    imageModelKey: getDefaultImageModelKey(),
    chatModelKey: getDefaultChatModelKey(),
    referenceFrameMode: 'first-last',
    ratio: '16:9',
    duration: 5,
    resolution: '720p',
    characterBible: '',
    sceneBible: '',
    styleBible: '',
  },

  // 三阶段流程初始状态
  conceptResult: undefined,
  planningResult: undefined,
  storyboardResult: undefined,
  currentStage: 'concept',
  stageStatus: {
    concept: 'pending',
    planning: 'pending',
    storyboard: 'pending',
  },
  styleTemplateCache: new Map(),
  stateSnapshots: [],

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as AppNode[],
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as AppEdge[],
    }))
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setGlobalConfig: (config) => set((state) => ({ globalConfig: { ...state.globalConfig, ...config } })),

  addEmptyConfigNode: () => {
    const { nodes, edges, nodeCounter, globalConfig } = get()
    const newCounter = nodeCounter + 1
    const configId = `config-${newCounter}`

    // 计算画布中心位置（假设画布宽度为1920，高度为1080）
    // 画布中心上方：x=760, y=100
    const canvasCenterX = 760
    const canvasTopY = 100

    const configNode = createConfigNode(configId, { x: canvasCenterX, y: canvasTopY }, {
      title: `分镜 #${newCounter}`,
      shotId: newCounter,
      ratio: globalConfig.ratio,
      duration: globalConfig.duration,
      resolution: globalConfig.resolution,
      referenceFrameMode: globalConfig.referenceFrameMode,
    })
    const videoNode = createVideoNode(configId, { x: canvasCenterX, y: canvasTopY + VIDEO_NODE_Y_OFFSET })

    const newEdges: AppEdge[] = []

    // Connect config to its video node with vertical straight edge
    newEdges.push({
      id: `e-${configId}-video-${newCounter}`,
      source: configId,
      sourceHandle: 'video',
      target: `video-${newCounter}`,
      type: 'default',
    })

    const allNodes = [...nodes, configNode, videoNode]
    const allEdges = [...edges, ...newEdges]
    set({
      nodes: allNodes,
      edges: allEdges,
      nodeCounter: newCounter,
      selectedNodeId: configId,
    })
  },

  addStoryboardNode: (shot) => {
    const { nodes, edges, nodeCounter, globalConfig } = get()
    const existing = nodes.find(
      (n): n is ConfigNode => n.type === 'config' && (n.data as ConfigNodeData).shotId === shot.id
    )
    if (existing) {
      const updated = nodes.map((n) => {
        if (n.id !== existing.id || n.type !== 'config') return n
        return {
          ...n,
          data: mergeShotIntoConfigData(shot, n.data as ConfigNodeData, globalConfig),
        }
      })
      set({
        nodes: autoLayout(updated, edges),
        selectedNodeId: existing.id,
      })
      return
    }

    const newCounter = nodeCounter + 1
    const configId = `config-${newCounter}`
    const x = NODE_START_X + nodeCounter * NODE_X_GAP

    const resolvedTechniques = shot.suggested_techniques
      ? resolveTechniques(shot.suggested_techniques)
      : []

    const prompt = shot.selected_prompt || shot.description

    const configNode = createConfigNode(configId, { x, y: CONFIG_NODE_Y }, {
      shotId: shot.id,
      title: `分镜 #${shot.id}: ${shot.title}`,
      prompt,
      techniques: resolvedTechniques,
      ratio: (shot.ratio as ConfigNodeData['ratio']) || globalConfig.ratio,
      duration: (shot.duration as ConfigNodeData['duration']) || globalConfig.duration,
      resolution: globalConfig.resolution,
      referenceFrameMode: globalConfig.referenceFrameMode,
      sceneType: shot.scene_type,
      shotSize: shot.shot_size,
      transition: shot.transition,
      coreInfo: shot.core_info,
      visualKeywords: shot.visual_keywords,
      characterFeatures: shot.character_features,
      sceneFeatures: shot.scene_features,
      consistencyNotes: shot.consistency_notes,
      selectedPrompt: shot.selected_prompt,
      alternativePrompts: shot.alternative_prompts,
      firstFramePrompt: shot.first_frame_prompt,
      lastFramePrompt: shot.last_frame_prompt,
      composition: shot.composition,
      lighting: shot.lighting,
      subject: shot.subject,
      background: shot.background,
      actionMovement: shot.action_movement,
      textOverlay: shot.text_overlay,
      transitionDetail: shot.transition_detail,
      audio: shot.audio,
    })
    const videoNode = createVideoNode(configId, { x, y: CONFIG_NODE_Y + VIDEO_NODE_Y_OFFSET })

    const newEdges: AppEdge[] = []

    if (nodeCounter > 0) {
      const prevConfigId = `config-${nodeCounter}`
      newEdges.push({
        id: `e-${prevConfigId}-${configId}`,
        source: prevConfigId,
        target: configId,
        type: 'default',
      })
    }

    newEdges.push({
      id: `e-${configId}-video-${newCounter}`,
      source: configId,
      sourceHandle: 'video',
      target: `video-${newCounter}`,
      type: 'default',
    })

    const allNodes = [...nodes, configNode, videoNode]
    const allEdges = [...edges, ...newEdges]
    set({
      nodes: autoLayout(allNodes, allEdges),
      edges: allEdges,
      nodeCounter: newCounter,
      selectedNodeId: configId,
    })
  },

  addMultipleStoryboardNodes: (shots) => {
    const { nodes, edges, nodeCounter, globalConfig } = get()
    let nextNodes: AppNode[] = [...nodes]
    let nextEdges: AppEdge[] = [...edges]
    let counter = nodeCounter
    let lastSelected: string | null = null
    const newConfigIds: string[] = []

    for (const shot of shots) {
      const existing = nextNodes.find(
        (n): n is ConfigNode => n.type === 'config' && (n.data as ConfigNodeData).shotId === shot.id
      )
      if (existing) {
        nextNodes = nextNodes.map((n) => {
          if (n.id !== existing.id || n.type !== 'config') return n
          return {
            ...n,
            data: mergeShotIntoConfigData(shot, n.data as ConfigNodeData, globalConfig),
          }
        })
        lastSelected = existing.id
        continue
      }

      counter += 1
      const configId = `config-${counter}`
      const x = NODE_START_X + (counter - 1) * NODE_X_GAP

      const resolvedTechniques = shot.suggested_techniques
        ? resolveTechniques(shot.suggested_techniques)
        : []

      const prompt = shot.selected_prompt || shot.description

      const configNode = createConfigNode(configId, { x, y: CONFIG_NODE_Y }, {
        shotId: shot.id,
        title: `分镜 #${shot.id}: ${shot.title}`,
        prompt,
        techniques: resolvedTechniques,
        ratio: (shot.ratio as ConfigNodeData['ratio']) || globalConfig.ratio,
        duration: (shot.duration as ConfigNodeData['duration']) || globalConfig.duration,
        resolution: globalConfig.resolution,
        referenceFrameMode: globalConfig.referenceFrameMode,
        sceneType: shot.scene_type,
        shotSize: shot.shot_size,
        transition: shot.transition,
        coreInfo: shot.core_info,
        visualKeywords: shot.visual_keywords,
        characterFeatures: shot.character_features,
        sceneFeatures: shot.scene_features,
        consistencyNotes: shot.consistency_notes,
        selectedPrompt: shot.selected_prompt,
        alternativePrompts: shot.alternative_prompts,
        firstFramePrompt: shot.first_frame_prompt,
        lastFramePrompt: shot.last_frame_prompt,
        composition: shot.composition,
        lighting: shot.lighting,
        subject: shot.subject,
        background: shot.background,
        actionMovement: shot.action_movement,
        textOverlay: shot.text_overlay,
        transitionDetail: shot.transition_detail,
        audio: shot.audio,
      })
      const videoNode = createVideoNode(configId, { x, y: CONFIG_NODE_Y + VIDEO_NODE_Y_OFFSET })

      nextNodes.push(configNode, videoNode)

      if (counter > 1) {
        const prevConfigId = `config-${counter - 1}`
        nextEdges.push({
          id: `e-${prevConfigId}-${configId}`,
          source: prevConfigId,
          target: configId,
          type: 'default',
        })
      }

      nextEdges.push({
        id: `e-${configId}-video-${counter}`,
        source: configId,
        sourceHandle: 'video',
        target: `video-${counter}`,
        type: 'default',
      })

      lastSelected = configId
      newConfigIds.push(configId)
    }

    set({
      nodes: autoLayout(nextNodes, nextEdges),
      edges: nextEdges,
      nodeCounter: counter,
      selectedNodeId: lastSelected ?? get().selectedNodeId,
    })

    return { configNodeIds: newConfigIds, shots }
  },

  deleteNode: (nodeId) => {
    const { nodes, edges } = get()

    // 找到要删除的节点
    const nodeToDelete = nodes.find((n) => n.id === nodeId)
    if (!nodeToDelete) return

    // 确定要删除的所有节点ID
    const nodeIdsToDelete = [nodeId]

    // 如果删除的是 config 节点，也要删除对应的 video 节点
    if (nodeToDelete.type === 'config') {
      const videoNodeId = nodeId.replace('config-', 'video-')
      nodeIdsToDelete.push(videoNodeId)
    }
    // 如果删除的是 video 节点，也要删除对应的 config 节点
    else if (nodeToDelete.type === 'video') {
      const configNodeId = nodeId.replace('video-', 'config-')
      nodeIdsToDelete.push(configNodeId)
    }

    // 过滤掉要删除的节点
    const remainingNodes = nodes.filter((n) => !nodeIdsToDelete.includes(n.id))

    // 过滤掉与已删除节点相关的边
    const remainingEdges = edges.filter(
      (e) => !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target)
    )

    // 如果删除了中间的 config 节点，需要重新连接前后节点
    const deletedConfigId = nodeIdsToDelete.find((id) => id.startsWith('config-'))
    if (deletedConfigId) {
      // 找到与已删除节点相连的边
      const incomingEdges = edges.filter((e) => e.target === deletedConfigId)
      const outgoingEdges = edges.filter((e) => e.source === deletedConfigId)

      // 找到前后的 config 节点
      const prevConfigId = incomingEdges.find((e) => e.source.startsWith('config-'))?.source
      // 找到从已删除节点的 video 节点出去的边，连接到下一个 config 节点
      const deletedVideoNodeId = deletedConfigId.replace('config-', 'video-')
      const nextConfigId = edges.find((e) =>
        e.source === deletedVideoNodeId && e.target.startsWith('config-')
      )?.target

      // 如果前后都有节点，创建新的连接
      if (prevConfigId && nextConfigId) {
        remainingEdges.push({
          id: `e-${prevConfigId}-${nextConfigId}`,
          source: prevConfigId,
          target: nextConfigId,
          type: 'default',
        })
      }
    }

    set({
      nodes: remainingNodes,
      edges: remainingEdges,
      selectedNodeId: null,
    })
  },

  deleteNodes: (nodeIds) => {
    const { nodes, edges } = get()
    if (!nodeIds || nodeIds.length === 0) return

    // 收集所有要删除的节点ID（包括对应的video节点）
    const allNodeIdsToDelete = new Set<string>()

    for (const nodeId of nodeIds) {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      allNodeIdsToDelete.add(nodeId)

      // 如果是 config 节点，删除对应的 video 节点
      if (node.type === 'config') {
        const videoNodeId = nodeId.replace('config-', 'video-')
        allNodeIdsToDelete.add(videoNodeId)
      }
      // 如果是 video 节点，删除对应的 config 节点
      else if (node.type === 'video') {
        const configNodeId = nodeId.replace('video-', 'config-')
        allNodeIdsToDelete.add(configNodeId)
      }
    }

    // 过滤掉要删除的节点
    const remainingNodes = nodes.filter((n) => !allNodeIdsToDelete.has(n.id))

    // 过滤掉与已删除节点相关的边
    const remainingEdges = edges.filter(
      (e) => !allNodeIdsToDelete.has(e.source) && !allNodeIdsToDelete.has(e.target)
    )

    // 重新连接相邻的节点
    const deletedConfigIds = Array.from(allNodeIdsToDelete).filter((id) => id.startsWith('config-'))

    for (const deletedConfigId of deletedConfigIds) {
      // 找到与已删除节点相连的边
      const incomingEdges = edges.filter((e) => e.target === deletedConfigId)
      const outgoingEdges = edges.filter((e) => e.source === deletedConfigId)

      // 找到前后的 config 节点
      const prevConfigId = incomingEdges.find((e) => e.source.startsWith('config-'))?.source
      const deletedVideoNodeId = deletedConfigId.replace('config-', 'video-')
      const nextConfigId = edges.find((e) =>
        e.source === deletedVideoNodeId && e.target.startsWith('config-')
      )?.target

      // 如果前后都有节点，创建新的连接
      if (prevConfigId && nextConfigId && !allNodeIdsToDelete.has(prevConfigId) && !allNodeIdsToDelete.has(nextConfigId)) {
        // 检查是否已经存在这个连接
        const existingEdge = remainingEdges.find(
          (e) => e.source === prevConfigId && e.target === nextConfigId
        )
        if (!existingEdge) {
          remainingEdges.push({
            id: `e-${prevConfigId}-${nextConfigId}`,
            source: prevConfigId,
            target: nextConfigId,
            type: 'default',
          })
        }
      }
    }

    set({
      nodes: remainingNodes,
      edges: remainingEdges,
      selectedNodeId: null,
    })
  },

  updateNodeConfig: (nodeId, technique) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const configData = node.data as ConfigNodeData
          // Check for duplicates
          const exists = configData.techniques.some((t) => t.id === technique.id)
          if (exists) return node
          return {
            ...node,
            data: {
              ...configData,
              techniques: [...configData.techniques, technique],
            },
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  removeNodeTechnique: (nodeId, techniqueId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const configData = node.data as ConfigNodeData
          return {
            ...node,
            data: {
              ...configData,
              techniques: configData.techniques.filter((t) => t.id !== techniqueId),
            },
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodePrompt: (nodeId, prompt) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, prompt } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeNegativePrompt: (nodeId, negativePrompt) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, negativePrompt } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeRatio: (nodeId, ratio) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, ratio } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeDuration: (nodeId, duration) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, duration } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeResolution: (nodeId, resolution) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, resolution } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, status } }
        }
        return node
      }) as AppNode[],
    }))
  },

  setVideoResult: (configNodeId, videoUrl, prompt, lastFrameUrl) => {
    const videoNodeId = configNodeId.replace('config-', 'video-')
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === videoNodeId && node.type === 'video') {
          const videoData = node.data as VideoNodeData
          return {
            ...node,
            data: {
              ...videoData,
              videoUrl,
              lastFrameUrl,
              status: 'done' as const,
              history: [
                ...videoData.history,
                {
                  id: `${Date.now()}`,
                  videoUrl,
                  lastFrameUrl,
                  prompt: prompt || '',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  patchVideoNodeMediaUrls: (configNodeId, patch) => {
    const videoNodeId = configNodeId.replace('config-', 'video-')
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== videoNodeId || node.type !== 'video') return node
        const videoData = node.data as VideoNodeData
        const nextVideoUrl = patch.videoUrl ?? videoData.videoUrl
        const nextLastFrame = patch.lastFrameUrl !== undefined ? patch.lastFrameUrl : videoData.lastFrameUrl
        const hist = videoData.history
        if (hist.length === 0) {
          return {
            ...node,
            data: {
              ...videoData,
              videoUrl: nextVideoUrl,
              lastFrameUrl: nextLastFrame,
            },
          }
        }
        const lastIdx = hist.length - 1
        const nextHist = hist.map((h, i) =>
          i === lastIdx
            ? {
                ...h,
                ...(patch.videoUrl !== undefined ? { videoUrl: patch.videoUrl } : {}),
                ...(patch.lastFrameUrl !== undefined ? { lastFrameUrl: patch.lastFrameUrl } : {}),
              }
            : h
        )
        return {
          ...node,
          data: {
            ...videoData,
            videoUrl: nextVideoUrl,
            lastFrameUrl: nextLastFrame,
            history: nextHist,
          },
        }
      }) as AppNode[],
    }))
  },

  updateVideoNodeStatus: (videoNodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === videoNodeId && node.type === 'video') {
          return { ...node, data: { ...node.data, status } }
        }
        return node
      }) as AppNode[],
    }))
  },

  resetForRegeneration: (configNodeId) => {
    const videoNodeId = configNodeId.replace('config-', 'video-')
    set((state) => {
      const nextPending = new Set(state.pendingRegeneration)
      nextPending.add(configNodeId)
      return {
        nodes: state.nodes.map((node) => {
          if (node.id === configNodeId && node.type === 'config') {
            return { ...node, data: { ...node.data, status: 'idle' as const } }
          }
          if (node.id === videoNodeId && node.type === 'video') {
            return { ...node, data: { ...node.data, status: 'idle' as const } }
          }
          return node
        }) as AppNode[],
        pendingRegeneration: nextPending,
      }
    })
  },

  clearPendingRegeneration: (configNodeId) => {
    set((state) => {
      const nextPending = new Set(state.pendingRegeneration)
      nextPending.delete(configNodeId)
      return { pendingRegeneration: nextPending }
    })
  },

  switchVideoVersion: (videoNodeId, historyEntryId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === videoNodeId && node.type === 'video') {
          const videoData = node.data as VideoNodeData
          const entry = videoData.history.find((h) => h.id === historyEntryId)
          if (entry) {
            return {
              ...node,
              data: { ...videoData, videoUrl: entry.videoUrl, lastFrameUrl: entry.lastFrameUrl, status: 'done' as const },
            }
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  getPreviousNodeLastFrame: (configNodeId) => {
    const { nodes, edges } = get()
    // Find horizontal edge where this node is target (no sourceHandle = config-to-config)
    const incomingEdge = edges.find(
      (e) => e.target === configNodeId && !e.sourceHandle && e.source.startsWith('config-')
    )
    if (!incomingEdge) return undefined

    const prevVideoNodeId = incomingEdge.source.replace('config-', 'video-')
    const prevVideoNode = nodes.find(
      (n) => n.id === prevVideoNodeId && n.type === 'video'
    )
    if (!prevVideoNode) return undefined
    return (prevVideoNode.data as VideoNodeData).lastFrameUrl
  },

  runAutoLayout: () => {
    const { nodes, edges } = get()
    set({ nodes: autoLayout(nodes, edges) })
  },

  getSelectedNodeData: () => {
    const { nodes, selectedNodeId } = get()
    if (!selectedNodeId) return null
    const node = nodes.find((n) => n.id === selectedNodeId)
    if (!node || node.type !== 'config') return null
    return node.data as ConfigNodeData
  },

  updateNodeFirstFrame: (nodeId, firstFrameUrl) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, firstFrameUrl } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeLastFrame: (nodeId, lastFrameUrl) => {
    set((state) => {
      // 先更新当前节点的尾帧
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, lastFrameUrl } }
        }
        return node
      }) as AppNode[]

      // 链式更新：找到下一个使用这个尾帧作为首帧的节点
      const videoNodeId = nodeId.replace('config-', 'video-')
      const outgoingEdge = state.edges.find(
        (e) => e.source === videoNodeId && !e.targetHandle && e.target.startsWith('config-')
      )

      if (outgoingEdge && lastFrameUrl) {
        const nextConfigNodeId = outgoingEdge.target
        // 更新下一个节点的首帧
        return {
          nodes: updatedNodes.map((node) => {
          if (node.id === nextConfigNodeId && node.type === 'config') {
            return { ...node, data: { ...node.data, firstFrameUrl: lastFrameUrl } }
          }
          return node
        }),
        }
      }

      return { nodes: updatedNodes }
    })
  },

  updateNodeFirstFramePrompt: (nodeId, firstFramePrompt) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, firstFramePrompt } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeLastFramePrompt: (nodeId, lastFramePrompt) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, lastFramePrompt } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeMultiFramePrompt: (nodeId, multiFramePrompt) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, multiFramePrompt } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeMultiFrameImageUrl: (nodeId, multiFrameImageUrl) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, multiFrameImageUrl } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeReferenceImages: (nodeId, referenceImageUrls) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, referenceImageUrls } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeReferenceFrameMode: (nodeId, referenceFrameMode) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, referenceFrameMode } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeImageGenStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, imageGenStatus: status } }
        }
        return node
      }) as AppNode[],
    }))
  },

  setCurrentImageGrid: (nodeId, grid) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          return { ...node, data: { ...node.data, currentImageGrid: grid } }
        }
        return node
      }) as AppNode[],
    }))
  },

  selectImageInGrid: (nodeId, imageId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const currentGrid = (node.data as ConfigNodeData).currentImageGrid
          if (!currentGrid) return node
          return {
            ...node,
            data: {
              ...node.data,
              currentImageGrid: { ...currentGrid, selectedImageId: imageId }
            }
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  confirmImageSelection: (nodeId, imageUrl, targetSlot) => {
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const data = node.data as ConfigNodeData

          // 根据目标槽位填充
          const updateData: Partial<ConfigNodeData> = {
            imageGenStatus: 'done',
            currentImageGrid: undefined,
          }

          if (targetSlot === 'first') {
            updateData.firstFrameUrl = imageUrl
          } else if (targetSlot === 'last') {
            updateData.lastFrameUrl = imageUrl
          }

          return { ...node, data: { ...data, ...updateData } }
        }
        return node
      })

      // 更新可用模式
      return { nodes }
    })
  },

  updateAvailableGenModes: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const data = node.data as ConfigNodeData
          const modes: ImageGenMode[] = []

          // 流程逻辑
          if (!data.firstFrameUrl) {
            modes.push('initial-character')
          } else {
            modes.push('multi-angle-grid', 'narrative-storyboard')
          }

          modes.push('story-based')

          return { ...node, data: { ...data, availableGenModes: modes } }
        }
        return node
      }) as AppNode[],
    }))
  },

  updateNodeEightFields: (nodeId, fields) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'config') {
          const data = node.data as ConfigNodeData
          return {
            ...node,
            data: {
              ...data,
              ...fields,
            }
          }
        }
        return node
      }) as AppNode[],
    }))
  },

  // ===== 三阶段流程方法实现 =====

  setConceptResult: (result) => set({ conceptResult: result }),

  setPlanningResult: (result) => set({ planningResult: result }),

  setStoryboardResult: (result) => set({ storyboardResult: result }),

  setCurrentStage: (stage) => set({ currentStage: stage }),

  setStageStatus: (stage, status) => set((state) => ({
    stageStatus: { ...state.stageStatus, [stage]: status }
  })),

  setStyleTemplateCache: (styleName, template) => set((state) => {
    const newCache = new Map(state.styleTemplateCache)
    newCache.set(styleName, template)
    return { styleTemplateCache: newCache }
  }),

  getStyleTemplateFromCache: (styleName) => {
    return get().styleTemplateCache.get(styleName)
  },

  resetThreeStageData: () => set({
    conceptResult: undefined,
    planningResult: undefined,
    storyboardResult: undefined,
    currentStage: 'concept',
    stageStatus: {
      concept: 'pending',
      planning: 'pending',
      storyboard: 'pending',
    },
  }),

  pushStateSnapshot: (label) => {
    const s = get()
    const core: ProjectCanvasSnapshot['core'] = {
      version: 1,
      nodes: s.nodes,
      edges: s.edges,
      nodeCounter: s.nodeCounter,
      globalConfig: s.globalConfig,
      conceptResult: s.conceptResult,
      planningResult: s.planningResult,
      storyboardResult: s.storyboardResult,
      currentStage: s.currentStage,
      stageStatus: s.stageStatus,
    }
    const snap: ProjectCanvasSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: label.trim() || '里程碑',
      createdAt: new Date().toISOString(),
      core,
    }
    set({
      stateSnapshots: [snap, ...s.stateSnapshots].slice(0, 12),
    })
  },

  restoreStateSnapshot: (snapshotId) => {
    const snap = get().stateSnapshots.find((x) => x.id === snapshotId)
    if (!snap) return
    const { core } = snap
    set({
      nodes: core.nodes,
      edges: core.edges,
      nodeCounter: core.nodeCounter,
      selectedNodeId: null,
      globalConfig: core.globalConfig,
      conceptResult: core.conceptResult,
      planningResult: core.planningResult,
      storyboardResult: core.storyboardResult,
      currentStage: core.currentStage,
      stageStatus: core.stageStatus,
      pendingRegeneration: new Set(),
      styleTemplateCache: new Map(),
    })
  },

  getPersistableState: () => {
    const s = get()
    return {
      version: 1 as const,
      nodes: s.nodes,
      edges: s.edges,
      nodeCounter: s.nodeCounter,
      globalConfig: s.globalConfig,
      conceptResult: s.conceptResult,
      planningResult: s.planningResult,
      storyboardResult: s.storyboardResult,
      currentStage: s.currentStage,
      stageStatus: s.stageStatus,
      stateSnapshots: s.stateSnapshots,
    }
  },

  hydratePersistedState: (snapshot) => {
    const incomingGlobalConfig = snapshot.globalConfig as Record<string, unknown>
    const migratedGlobalConfig: GlobalConfig = {
      videoModelKey:
        (incomingGlobalConfig?.videoModelKey as GlobalConfig['videoModelKey']) ??
        getDefaultVideoModelKey(),
      imageModelKey:
        (incomingGlobalConfig?.imageModelKey as GlobalConfig['imageModelKey']) ??
        getDefaultImageModelKey(),
      chatModelKey:
        (incomingGlobalConfig?.chatModelKey as GlobalConfig['chatModelKey']) ??
        getDefaultChatModelKey(),
      referenceFrameMode:
        (incomingGlobalConfig?.referenceFrameMode as GlobalConfig['referenceFrameMode']) ??
        'first-last',
      ratio: (incomingGlobalConfig?.ratio as GlobalConfig['ratio']) ?? '16:9',
      duration: (incomingGlobalConfig?.duration as GlobalConfig['duration']) ?? 5,
      resolution: (incomingGlobalConfig?.resolution as GlobalConfig['resolution']) ?? '720p',
      characterBible: typeof incomingGlobalConfig?.characterBible === 'string' ? incomingGlobalConfig.characterBible : '',
      sceneBible: typeof incomingGlobalConfig?.sceneBible === 'string' ? incomingGlobalConfig.sceneBible : '',
      styleBible: typeof incomingGlobalConfig?.styleBible === 'string' ? incomingGlobalConfig.styleBible : '',
    }

    set({
      nodes: snapshot.nodes ?? [],
      edges: snapshot.edges ?? [],
      nodeCounter: snapshot.nodeCounter ?? 0,
      selectedNodeId: null,
      globalConfig: migratedGlobalConfig,
      conceptResult: snapshot.conceptResult,
      planningResult: snapshot.planningResult,
      storyboardResult: snapshot.storyboardResult,
      currentStage: snapshot.currentStage,
      stageStatus: snapshot.stageStatus,
      stateSnapshots: snapshot.stateSnapshots ?? [],
      pendingRegeneration: new Set(),
      styleTemplateCache: new Map(),
    })
  },

  resetCanvas: () => set({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    nodeCounter: 0,
    pendingRegeneration: new Set(),
    conceptResult: undefined,
    planningResult: undefined,
    storyboardResult: undefined,
    currentStage: 'concept',
    stageStatus: {
      concept: 'pending',
      planning: 'pending',
      storyboard: 'pending',
    },
    styleTemplateCache: new Map(),
    stateSnapshots: [],
  }),

  // ===== 链式生成辅助方法 =====

  /**
   * 获取所有config节点按shotId排序
   */
  getOrderedConfigNodes: () => {
    const { nodes } = get()
    const configNodes = nodes
      .filter((n) => n.type === 'config')
      .map((n) => ({ id: n.id, data: n.data as ConfigNodeData }))
      .filter((n) => n.data.shotId !== undefined)
      .sort((a, b) => (a.data.shotId || 0) - (b.data.shotId || 0))

    return configNodes
  },

  /**
   * 根据shotId获取config节点
   */
  getConfigNodeByShotId: (shotId: number) => {
    const { nodes } = get()
    return nodes.find(
      (n) => n.type === 'config' && (n.data as ConfigNodeData).shotId === shotId
    ) as ConfigNode | undefined
  },
}))
