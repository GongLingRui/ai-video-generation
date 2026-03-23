/**
 * 阶段2: video-planning (视频规划) 类型定义
 *
 * 根据不同输入源（专业分镜脚本/普通文本/创意概念）生成视频规划方案
 */

import type { StylePreset, ConceptResult } from './concept'

export type SourceType = 'A' | 'B' | 'C'

/**
 * 视频规划输入
 */
export type PlanningInput = {
  source_type: SourceType // A:专业分镜脚本, B:普通文本, C:创意概念
  source_file?: string // A/B类型需要：源文件路径
  concept_json?: ConceptResult // C类型需要：从阶段1输出的概念
  optional_params?: {
    target_duration?: number // 目标时长
    video_purpose?: 'internal' | 'external' | 'product_launch' // 视频用途
    priority_points?: string[] // 优先强调的信息点
  }
}

/**
 * 叙事分镜项
 */
export type NarrativeShot = {
  shot_id: string // S01, S02, ...
  duration: number // 时长（秒）
  shot_type: 'narrative' // 叙事型
  shot_size: 'wide' | 'medium' | 'closeup' | 'extreme_closeup' // 景别
  transition: 'cut' | 'fade' | 'push' | 'dissolve' // 转场方式
  core_info: string // 核心信息
  camera_angle: 'high' | 'eye_level' | 'low' | 'dutch' // 拍摄角度
  composition_notes: string // 构图备注
}

/**
 * 风格定义
 */
export type StyleDefinition = {
  style_preset_source: StylePreset // 风格预设来源
  color_scheme: {
    primary: string
    secondary: string
    background: string
    accent: string
  }
  composition_rules: string[] // 构图规则
  nano_banana_prompt_template: string // Nano Banana提示词模板
}

/**
 * 分镜计划
 */
export type StoryboardPlan = {
  total_shots: number // 总分镜数
  narrative_shots: NarrativeShot[] // 叙事分镜列表
  auxiliary_shots: NarrativeShot[] // 辅助分镜列表（如转场镜头）
}

/**
 * 内容分析结果
 */
export type ContentAnalysis = {
  source_material: string // 源材料描述
  core_info_points: string[] // 提取的核心信息点
  narrative_strategy: string // 叙事策略（如"开头-发展-高潮-结尾"）
  total_duration_estimate: string // 总时长估算
}

/**
 * 阶段2的输出结果
 */
export type PlanningResult = {
  planning_id: string // 唯一标识
  source_type: SourceType // 输入源类型
  content_analysis: ContentAnalysis // 内容分析
  storyboard_plan: StoryboardPlan // 分镜计划
  style_definition: StyleDefinition // 风格定义
}
