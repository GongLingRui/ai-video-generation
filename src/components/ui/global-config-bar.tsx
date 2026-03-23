'use client'

import { useCanvasStore } from '@/stores/canvas-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Video, Layers, Frame, Clock, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { VIDEO_RATIOS, VIDEO_DURATIONS, REFERENCE_FRAME_MODE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ReferenceFrameMode, VideoRatio, VideoDuration } from '@/types'
import {
  VIDEO_MODEL_OPTIONS,
  IMAGE_MODEL_OPTIONS,
  CHAT_MODEL_OPTIONS,
  type VideoModelKey,
  type ImageModelKey,
  type ChatModelKey,
} from '@/lib/model-registry'

const referenceFrameModeOptions = [
  { value: 'first-last' as const, label: '首尾帧参考', description: '上传首尾帧，实现平滑过渡' },
  { value: 'multi-frame' as const, label: '多帧参考', description: '3×3九宫格，复杂叙事控制' },
] as const

export function GlobalConfigBar() {
  const { globalConfig, setGlobalConfig } = useCanvasStore()

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/80 rounded-xl border border-black/10">
      {/* 视频模型 */}
      <Select
        value={globalConfig.videoModelKey}
        onValueChange={(v) => setGlobalConfig({ videoModelKey: v as VideoModelKey })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[9.5rem] sm:min-w-[11rem] border-black/15 bg-white text-[12px] sm:text-xs text-zinc-900">
          <Video className="mr-1.5 h-3.5 w-3.5 shrink-0 text-zinc-600 sm:mr-2" />
          <SelectValue placeholder="视频模型" />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_MODEL_OPTIONS.map((m) => (
            <SelectItem key={m.key} value={m.key} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 图片模型 */}
      {/* <Select
        value={globalConfig.imageModelKey}
        onValueChange={(v) => setGlobalConfig({ imageModelKey: v as ImageModelKey })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[9rem] sm:min-w-[10.5rem] border-black/15 bg-white text-[12px] sm:text-xs text-zinc-900">
          <ImageIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-zinc-600 sm:mr-2" />
          <SelectValue placeholder="图片模型" />
        </SelectTrigger>
        <SelectContent>
          {IMAGE_MODEL_OPTIONS.map((m) => (
            <SelectItem key={m.key} value={m.key} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}

      {/* 对话模型 */}
      {/* <Select
        value={globalConfig.chatModelKey}
        onValueChange={(v) => setGlobalConfig({ chatModelKey: v as ChatModelKey })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[10rem] sm:min-w-[12rem] border-black/15 bg-white text-[12px] sm:text-xs text-zinc-900">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5 shrink-0 text-zinc-600 sm:mr-2" />
          <SelectValue placeholder="对话模型" />
        </SelectTrigger>
        <SelectContent>
          {CHAT_MODEL_OPTIONS.map((m) => (
            <SelectItem key={m.key} value={m.key} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}

      {/* 参考帧模式 */}
      <Select
        value={globalConfig.referenceFrameMode}
        onValueChange={(v) => setGlobalConfig({ referenceFrameMode: v as ReferenceFrameMode })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[8.25rem] sm:min-w-[9.25rem] border-black/15 bg-white text-[12px] sm:text-xs text-zinc-900">
          <Layers className="mr-1.5 h-3.5 w-3.5 shrink-0 text-zinc-600 sm:mr-2" />
          <SelectValue placeholder="参考模式">
            {REFERENCE_FRAME_MODE_LABELS[globalConfig.referenceFrameMode]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {referenceFrameModeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 画面比例 */}
      <Select
        value={globalConfig.ratio}
        onValueChange={(v) => setGlobalConfig({ ratio: v as VideoRatio })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[88px] sm:w-[108px] border-black/15 bg-white text-zinc-900 text-[12px] sm:text-xs">
          <Frame className="mr-1.5 sm:mr-2 h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_RATIOS.map((r) => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 视频时长 */}
      <Select
        value={String(globalConfig.duration)}
        onValueChange={(v) => setGlobalConfig({ duration: Number(v) as VideoDuration })}
      >
        <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[82px] sm:w-[102px] border-black/15 bg-white text-zinc-900 text-[12px] sm:text-xs">
          <Clock className="mr-1.5 sm:mr-2 h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_DURATIONS.map((d) => (
            <SelectItem key={d.value} value={String(d.value)} className="text-xs">
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
