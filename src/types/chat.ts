/**
 * 阶段3: video-storyboard (分镜脚本) 类型定义
 *
 * 扩展现有Shot类型，支持完整的分镜脚本生成
 */

export type Shot = {
  // ===== 基础字段（保留现有，向后兼容） =====
  id: number
  title: string
  description: string
  suggested_techniques: string[]
  duration: number
  ratio: string

  // ===== 扩展字段：分镜元数据 =====
  scene_type?: 'opening' | 'dialogue' | 'action' | 'climax' | 'ending' // 场景类型
  shot_size?: 'extreme-close-up' | 'close-up' | 'medium' | 'wide' | 'extreme-wide' // 景别
  transition?: string // 转场方式
  core_info?: string // 一句话核心信息
  visual_keywords?: string[] // 画面关键词（3-5个）
  character_features?: string // 角色特征描述
  scene_features?: string // 场景特征描述
  consistency_notes?: string // 一致性检查备注

  // ===== Nano Banana提示词（AI自动选择最佳） =====
  selected_prompt?: string // AI选择的最佳中文提示词
  alternative_prompts?: string[] // 其他候选提示词

  // ===== 首尾帧提示词 =====
  first_frame_prompt?: string // 首帧图生成提示词
  last_frame_prompt?: string // 尾帧图生成提示词

  // ===== 新增：8要素详细描述 =====
  composition?: string        // 构图
  lighting?: string           // 光线
  subject?: string            // 主体
  background?: string         // 背景
  action_movement?: string    // 动作/运动
  text_overlay?: string       // 文字叠加
  transition_detail?: string  // 转场
  audio?: string              // 音频
}

/**
 * 一致性报告
 */
export type ConsistencyReport = {
  character_consistency: boolean // 角色特征一致性
  scene_consistency: boolean // 场景氛围一致性
  style_consistency: boolean // 色调风格一致性
  notes: string[] // 一致性备注
}

/**
 * 风格总览
 */
export type StyleProfile = {
  color_scheme: string // 色彩方案描述
  mood: string // 整体情绪
  visual_style: string // 视觉风格
}

/**
 * 分镜总览
 */
export type StoryboardOverview = {
  total_shots: number // 总分镜数
  total_duration: number // 总时长（秒）
  style_profile: StyleProfile // 风格总览
  consistency_report: ConsistencyReport // 一致性报告
}

/**
 * 阶段3的输出结果（扩展现有StoryboardResult）
 */
export type StoryboardResult = {
  overview: StoryboardOverview // 分镜总览
  shots: Shot[] // 分镜列表
  // 输出文件路径（用于导出）
  files?: {
    overview: string // storyboards/S_OVERVIEW.md
    shots: string[] // storyboards/S01.md, S02.md, ...
  }
}
