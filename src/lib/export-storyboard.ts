import type { AppNode, ConfigNodeData } from '@/types'
import type { GlobalConfig } from '@/stores/canvas-store'
import { buildEnhancedPrompt } from '@/lib/seedance'

function bibleFromGlobal(g: GlobalConfig) {
  return {
    character: g.characterBible?.trim() || undefined,
    scene: g.sceneBible?.trim() || undefined,
    style: g.styleBible?.trim() || undefined,
  }
}

/** 分镜表 Markdown：每镜增强提示词预览 + 素材 URL 清单 */
export function buildStoryboardMarkdownExport(opts: {
  nodes: AppNode[]
  globalConfig: GlobalConfig
  title?: string
}): string {
  const { nodes, globalConfig, title } = opts
  const bible = bibleFromGlobal(globalConfig)
  const lines: string[] = []

  lines.push(`# 分镜导出：${title || '未命名项目'}`)
  lines.push('')
  lines.push(`- 导出时间：${new Date().toISOString()}`)
  lines.push('')

  const configs = nodes
    .filter((n): n is AppNode & { type: 'config' } => n.type === 'config')
    .map((n) => ({ id: n.id, data: n.data as ConfigNodeData }))
    .sort((a, b) => (a.data.shotId ?? 0) - (b.data.shotId ?? 0))

  lines.push('## 项目一致性（圣经）')
  lines.push('')
  lines.push(`- 角色：${globalConfig.characterBible?.trim() || '—'}`)
  lines.push(`- 场景：${globalConfig.sceneBible?.trim() || '—'}`)
  lines.push(`- 风格：${globalConfig.styleBible?.trim() || '—'}`)
  lines.push('')

  for (const { id, data } of configs) {
    const vid = id.replace('config-', 'video-')
    const videoNode = nodes.find((n) => n.id === vid && n.type === 'video')
    const vUrl =
      videoNode && videoNode.type === 'video'
        ? (videoNode.data as { videoUrl?: string }).videoUrl
        : undefined

    lines.push(`## 镜头 #${data.shotId ?? '?'} — ${data.title || ''}`)
    lines.push('')
    lines.push('### 视频模型提示词（增强拼接预览）')
    lines.push('')
    lines.push('```')
    lines.push(buildEnhancedPrompt(data, bible))
    lines.push('```')
    lines.push('')
    lines.push('### 素材 URL')
    lines.push('')
    lines.push(`- 主配置节点：\`${id}\``)
    if (data.firstFrameUrl) lines.push(`- 首帧：${data.firstFrameUrl}`)
    if (data.lastFrameUrl) lines.push(`- 尾帧：${data.lastFrameUrl}`)
    if (data.multiFrameImageUrl) lines.push(`- 九宫格参考：${data.multiFrameImageUrl}`)
    if (data.referenceImageUrls?.length)
      lines.push(`- 参考图：${data.referenceImageUrls.join(' · ')}`)
    if (vUrl) lines.push(`- 当前视频：${vUrl}`)
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('*可用浏览器打印此页或使用「打印 → 另存为 PDF」得到 PDF。*')
  lines.push('')
  return lines.join('\n')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}