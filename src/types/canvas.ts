import type { Node, Edge } from '@xyflow/react'
import type { Technique } from './technique'

export type VideoRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
export type VideoDuration = 4 | 5 | 8 | 12
export type VideoResolution = '480p' | '720p' | '1080p'
export type NodeStatus = 'idle' | 'generating' | 'done' | 'error'
export type ReferenceFrameMode = 'first-last' | 'multi-frame'

// 图片生成相关类型
export type ImageGenMode = 'initial-character' | 'multi-angle-grid' | 'narrative-storyboard' | 'story-based'
export type ImageGenStatus = 'idle' | 'generating' | 'selecting' | 'done'

export type GeneratedImage = {
  id: string
  url: string
  label: string
  position?: { row: number; col: number }
}

export type ImageGrid = {
  id: string
  mode: ImageGenMode
  prompt: string
  images: GeneratedImage[]
  createdAt: string
  selectedImageId?: string
}

export type ConfigNodeData = {
  shotId?: number
  title?: string
  prompt: string
  negativePrompt?: string
  techniques: Technique[]
  ratio: VideoRatio
  duration: VideoDuration
  resolution: VideoResolution
  status: NodeStatus
  // 首尾帧模式
  firstFrameUrl?: string
  lastFrameUrl?: string
  // 参考图模式
  referenceImageUrls?: string[]
  // 参考帧模式（可选，不填则继承全局配置）
  referenceFrameMode?: ReferenceFrameMode
  // 图片生成状态
  imageGenStatus: ImageGenStatus
  currentImageGrid?: ImageGrid
  imageGenHistory: ImageGrid[]
  availableGenModes: ImageGenMode[]
  // ===== 三阶段流程扩展字段 =====
  // 分镜类型和转场
  sceneType?: 'opening' | 'dialogue' | 'action' | 'climax' | 'ending'
  shotSize?: 'extreme-close-up' | 'close-up' | 'medium' | 'wide' | 'extreme-wide'
  transition?: string
  // 内容信息
  coreInfo?: string
  visualKeywords?: string[]
  characterFeatures?: string
  sceneFeatures?: string
  consistencyNotes?: string
  // AI生成的提示词
  selectedPrompt?: string
  alternativePrompts?: string[]
  // 首尾帧prompt（用于AI生成）
  firstFramePrompt?: string
  lastFramePrompt?: string
  // 多帧参考（3×3九宫格 - 单张图片包含9个画面）
  multiFramePrompt?: string
  multiFrameImageUrl?: string
  // 8要素详细描述
  composition?: string
  lighting?: string
  subject?: string
  background?: string
  actionMovement?: string
  textOverlay?: string
  transitionDetail?: string
  audio?: string
}

export type VideoNodeData = {
  configNodeId: string
  videoUrl?: string
  lastFrameUrl?: string
  history: VideoHistoryEntry[]
  status: NodeStatus
}

export type VideoHistoryEntry = {
  id: string
  videoUrl: string
  lastFrameUrl?: string
  prompt: string
  createdAt: string
}

export type ConfigNode = Node<ConfigNodeData, 'config'>
export type VideoNode = Node<VideoNodeData, 'video'>
export type AppNode = ConfigNode | VideoNode
export type AppEdge = Edge
