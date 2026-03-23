/**
 * 阶段1: video-concept (创意构思) 类型定义
 *
 * 当用户提供核心创意时，系统通过追问和分析生成视频概念构思
 */

export type CreativeType = 'story' | 'visual' | 'theme'
export type StylePreset = 'anime' | 'film' | 'cyberpunk' | 'realistic' | 'google'
export type SceneFunction = 'opening' | 'development' | 'climax' | 'ending'
export type RiskLevel = 'low' | 'medium' | 'high'

/**
 * 用户输入的核心创意
 */
export type ConceptInput = {
  core_idea: string // 用户核心创意（1-3句话）
  creative_type: CreativeType // 创意类型：叙事型/视觉型/主题型
  target_duration: number // 目标时长（秒），建议60-300
  target_audience: string // 目标受众描述
  style_preset?: StylePreset // 可选：风格预设
}

/**
 * 风格特征定义
 */
export type StyleCharacteristics = {
  color_scheme: {
    primary: string
    secondary: string
    background: string
    accent: string
  }
  mood: string // 整体情绪
  composition_rules: string[] // 构图规则列表
  visual_keywords: string[] // 视觉关键词列表
}

/**
 * 场景拆分项
 */
export type SceneBreakdown = {
  scene_id: string // C01, C02, ...
  duration: number // 8秒（可调整4-12秒）
  function: SceneFunction // 场景功能：开场/发展/高潮/结尾
  core_info: string // 该场景的核心信息
  suggested_shot: 'wide' | 'medium' | 'closeup' | 'extreme_closeup' // 建议的景别
  transition: 'cut' | 'fade' | 'push' | 'dissolve' // 转场方式
  ai_notes: {
    avoid: string[] // AI应该避免的内容
    recommend: string[] // AI推荐的内容
    risk_level: RiskLevel // 风险等级
  }
}

/**
 * 阶段1的输出结果
 */
export type ConceptResult = {
  concept_id: string // 唯一标识
  creative_analysis: {
    core_idea: string // 核心创意
    creative_type: CreativeType // 创意类型
    target_audience: string // 目标受众
    estimated_duration: string // 估算时长（如"2分30秒"）
  }
  style_preset: {
    style_name: StylePreset // 风格名称
    style_characteristics: StyleCharacteristics // 风格特征
  }
  scene_breakdown: SceneBreakdown[] // 场景拆分列表
  next_step_recommendation: 'quick_path' | 'enhanced_path' // 下一步推荐
}
