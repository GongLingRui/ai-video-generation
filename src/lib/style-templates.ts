/**
 * 风格模板系统
 *
 * 支持5种内置风格模板：anime/film/cyberpunk/realistic/google
 * 用于AI视频生成的风格一致性控制
 */

import type { StylePreset } from '@/types/concept'

/**
 * 风格模板类型定义
 */
export type StyleTemplate = {
  name: string
  color_scheme: {
    primary: string
    secondary: string
    background: string
    accent: string
  }
  composition_rules: string[]
  visual_features: string[]
  prompt_templates: {
    video: string
    first_frame: string
    last_frame: string
  }
}

/**
 * 内置风格模板定义
 *
 * 注意：这些是默认模板，实际使用时可以从references/styles/目录加载更详细的Markdown模板
 */
const STYLE_TEMPLATES: Record<StylePreset, StyleTemplate> = {
  anime: {
    name: 'anime',
    color_scheme: {
      primary: '#FF6B9D', // 粉色
      secondary: '#4ECDC4', // 青色
      background: '#FFF5F8', // 浅粉背景
      accent: '#FFE66D', // 黄色
    },
    composition_rules: [
      '二次元角色居中构图',
      '明亮的高饱和度色彩',
      '清晰的线条和轮廓',
      '夸张的表情和动作',
    ],
    visual_features: [
      '日本动漫风格',
      '明亮的色彩搭配',
      '可爱的角色设计',
      '梦幻的场景背景',
    ],
    prompt_templates: {
      video: '{主体描述}。日本动漫风格，高饱和度色彩，清晰的线条，明亮的画面，可爱梦幻的氛围。',
      first_frame: '{静态描述}。动漫风格，明亮色彩，居中构图，高清画质，4K超高清。',
      last_frame: '{结果状态}。保持动漫风格，为下一镜头留下梦幻过渡空间。',
    },
  },

  film: {
    name: 'film',
    color_scheme: {
      primary: '#8B7355', // 电影棕
      secondary: '#2C3E50', // 深蓝灰
      background: '#1C1C1C', // 深黑背景
      accent: '#D4AF37', // 金色
    },
    composition_rules: [
      '电影感构图，遵循三分法',
      '深度景深，背景虚化',
      '电影级调色，高对比度',
      '专业的光影效果',
    ],
    visual_features: [
      '电影质感',
      '电影调色',
      '专业布光',
      '电影镜头语言',
    ],
    prompt_templates: {
      video: '{主体描述}。电影风格，专业电影布光，电影级调色，景深效果，高清质感，电影感。',
      first_frame: '{静态描述}。电影质感，专业构图，电影布光，4K超高清。',
      last_frame: '{结果状态}。保持电影风格，为下一镜头营造电影过渡感。',
    },
  },

  cyberpunk: {
    name: 'cyberpunk',
    color_scheme: {
      primary: '#00FF41', // 霓虹绿
      secondary: '#FF006E', // 霓虹粉
      background: '#0D0221', // 深紫黑
      accent: '#00D9FF', // 霓虹蓝
    },
    composition_rules: [
      '霓虹灯光效果',
      '未来科技感构图',
      '高对比度色彩',
      '赛博朋克城市背景',
    ],
    visual_features: [
      '赛博朋克风格',
      '霓虹灯光',
      '未来科技感',
      '反乌托邦氛围',
    ],
    prompt_templates: {
      video: '{主体描述}。赛博朋克风格，霓虹灯光效果，未来科技感，高对比度色彩，赛博朋克城市背景。',
      first_frame: '{静态描述}。赛博朋克风格，霓虹灯光，未来感构图，4K超高清。',
      last_frame: '{结果状态}。保持赛博朋克风格，为下一镜头营造科技过渡感。',
    },
  },

  realistic: {
    name: 'realistic',
    color_scheme: {
      primary: '#4A4A4A', // 中性灰
      secondary: '#808080', // 浅灰
      background: '#F5F5F5', // 浅灰背景
      accent: '#FF6B35', // 橙色点缀
    },
    composition_rules: [
      '真实感构图',
      '自然光照效果',
      '写实色彩还原',
      '真实场景细节',
    ],
    visual_features: [
      '写实风格',
      '真实感',
      '自然光线',
      '真实场景',
    ],
    prompt_templates: {
      video: '{主体描述}。写实风格，真实场景，自然光照，写实色彩还原，真实感，高清画质。',
      first_frame: '{静态描述}。写实风格，真实场景，自然光线，4K超高清。',
      last_frame: '{结果状态}。保持写实风格，为下一镜头营造真实过渡感。',
    },
  },

  google: {
    name: 'google',
    color_scheme: {
      primary: '#4285F4', // Google蓝
      secondary: '#34A853', // Google绿
      background: '#FFFFFF', // 纯白背景
      accent: '#EA4335', // Google红
    },
    composition_rules: [
      '极简主义，大量留白',
      '主体居中或三分法构图',
      '避免复杂前景和背景',
      '使用高对比度确保文字可读性',
    ],
    visual_features: [
      '商务蓝为主色调',
      '清晰的图标和插图',
      '平滑的转场动画',
      '干净的字体排版',
    ],
    prompt_templates: {
      video: '{主体描述}。Google发布会风格，极简商务蓝配色，大量留白，清晰图标，高清质感。',
      first_frame: '{静态描述}。极简构图，商务配色，纯白背景，4K超高清。',
      last_frame: '{结果状态}。保持极简风格，为下一镜头留出空间。',
    },
  },
}

/**
 * 获取风格模板
 *
 * @param styleName - 风格名称
 * @returns 风格模板对象，如果不存在则返回默认模板
 */
export function getStyleTemplate(styleName: string): StyleTemplate {
  const normalizedStyle = styleName.toLowerCase() as StylePreset

  if (normalizedStyle in STYLE_TEMPLATES) {
    return STYLE_TEMPLATES[normalizedStyle]
  }

  // 如果找不到指定风格，返回Google风格作为默认
  console.warn(`Style "${styleName}" not found, using default "google" style`)
  return STYLE_TEMPLATES.google
}

/**
 * 获取默认风格模板（Google风格）
 */
export function getDefaultStyleTemplate(): StyleTemplate {
  return STYLE_TEMPLATES.google
}

/**
 * 获取所有可用的风格预设列表
 */
export function getAvailableStylePresets(): StylePreset[] {
  return Object.keys(STYLE_TEMPLATES) as StylePreset[]
}

/**
 * 根据风格模板生成视频提示词
 *
 * @param styleTemplate - 风格模板
 * @param subjectDescription - 主体描述
 * @returns 完整的视频生成提示词
 */
export function generateVideoPrompt(
  styleTemplate: StyleTemplate,
  subjectDescription: string
): string {
  const { prompt_templates } = styleTemplate
  return prompt_templates.video.replace('{主体描述}', subjectDescription)
}

/**
 * 根据风格模板生成首帧提示词
 *
 * @param styleTemplate - 风格模板
 * @param staticDescription - 静态描述
 * @returns 首帧生成提示词
 */
export function generateFirstFramePrompt(
  styleTemplate: StyleTemplate,
  staticDescription: string
): string {
  const { prompt_templates } = styleTemplate
  return prompt_templates.first_frame.replace('{静态描述}', staticDescription)
}

/**
 * 根据风格模板生成尾帧提示词
 *
 * @param styleTemplate - 风格模板
 * @param resultDescription - 结果状态描述
 * @returns 尾帧生成提示词
 */
export function generateLastFramePrompt(
  styleTemplate: StyleTemplate,
  resultDescription: string
): string {
  const { prompt_templates } = styleTemplate
  return prompt_templates.last_frame.replace('{结果状态}', resultDescription)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Slice body of a `## Title` section until the next `##` or EOF. */
function extractMarkdownSection(md: string, title: string): string {
  const esc = escapeRegExp(title)
  const re = new RegExp(`^##\\s+${esc}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`, 'm')
  const m = md.match(re)
  return m ? m[1].trim() : ''
}

function parseColorLine(section: string, key: 'primary' | 'secondary' | 'background' | 'accent'): string | undefined {
  const re = new RegExp(`\\*\\*${key}\\*\\*:\\s*(#?[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})`, 'i')
  const m = section.match(re)
  return m ? m[1] : undefined
}

function parseBulletList(section: string): string[] {
  const lines = section.split('\n')
  const out: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('- ')) {
      out.push(t.slice(2).trim())
    }
  }
  return out
}

function extractFencedAfterH3(section: string, h3Title: string): string | undefined {
  const esc = escapeRegExp(h3Title)
  const re = new RegExp(
    `^###\\s+${esc}\\s*\\n+[\\s\\S]*?\`\`\`(?:\\w*)?\\s*\\n([\\s\\S]*?)\`\`\``,
    'm'
  )
  const m = section.match(re)
  const inner = m?.[1]?.trim()
  return inner || undefined
}

/**
 * 解析 `references/styles/*.md` 风格的 Markdown（色彩方案、构图规则、视觉特征、提示词模板代码块）。
 * 解析失败或缺字段时回退到内置 `getStyleTemplate(styleName)`。
 */
export function parseStyleTemplate(content: string, styleName: string): StyleTemplate {
  const base = getStyleTemplate(styleName)
  const raw = content?.trim()
  if (!raw) return base

  const colorSection = extractMarkdownSection(raw, '色彩方案')
  const compSection = extractMarkdownSection(raw, '构图规则')
  const visSection = extractMarkdownSection(raw, '视觉特征')
  const promptSection = extractMarkdownSection(raw, '提示词模板')

  const primary = parseColorLine(colorSection, 'primary')
  const secondary = parseColorLine(colorSection, 'secondary')
  const background = parseColorLine(colorSection, 'background')
  const accent = parseColorLine(colorSection, 'accent')

  const composition_rules = parseBulletList(compSection)
  const visual_features = parseBulletList(visSection)

  const videoTpl = extractFencedAfterH3(promptSection, '视频生成')
  const firstTpl = extractFencedAfterH3(promptSection, '首帧生成')
  const lastTpl = extractFencedAfterH3(promptSection, '尾帧生成')

  return {
    name: base.name,
    color_scheme: {
      primary: primary ?? base.color_scheme.primary,
      secondary: secondary ?? base.color_scheme.secondary,
      background: background ?? base.color_scheme.background,
      accent: accent ?? base.color_scheme.accent,
    },
    composition_rules: composition_rules.length > 0 ? composition_rules : base.composition_rules,
    visual_features: visual_features.length > 0 ? visual_features : base.visual_features,
    prompt_templates: {
      video: videoTpl ?? base.prompt_templates.video,
      first_frame: firstTpl ?? base.prompt_templates.first_frame,
      last_frame: lastTpl ?? base.prompt_templates.last_frame,
    },
  }
}
