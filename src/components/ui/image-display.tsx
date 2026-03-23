'use client'

import React, { useState } from 'react'
import { X, Maximize2, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MEDIA_URL_UNREACHABLE_HINT } from '@/lib/constants'

interface ImageDisplayProps {
  value?: string
  onRemove: () => void
  label: string
  generating?: boolean
  onPreview?: () => void
  onSave?: () => void
}

/**
 * 只读图片显示组件（用于AI生成的首尾帧）
 * 用户无法手动上传或输入URL，只能查看和删除
 * 支持预览和保存功能
 */
export function ImageDisplay({
  value,
  onRemove,
  label,
  generating = false,
  onPreview,
  onSave
}: ImageDisplayProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const loadError = Boolean(value && failedUrl === value)

  if (generating) {
    return (
      <div className="w-full h-20 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 relative overflow-hidden">
        {/* 扫描动画效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />

        <div className="relative flex flex-col items-center justify-center h-full">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (value) {
    if (loadError) {
      return (
        <div className="w-full min-h-20 rounded-lg border border-destructive/25 bg-destructive/5 p-2 flex flex-col gap-1.5 justify-center">
          <p className="text-[9px] text-destructive leading-snug">{MEDIA_URL_UNREACHABLE_HINT}</p>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[9px] self-start"
            onClick={() => {
              setFailedUrl(null)
              onRemove()
            }}
          >
            清除并重新生成
          </Button>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      )
    }

    return (
      <div className="relative group">
        <div className="relative w-full h-20 rounded-lg overflow-hidden border-2 border-primary/30 bg-primary/5">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover cursor-pointer"
            onClick={onPreview}
            onError={() => value && setFailedUrl(value)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

          {/* 悬浮操作按钮 */}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPreview && (
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
            {onSave && (
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSave()
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[9px] px-2 py-0.5">
            AI 生成
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-20 rounded-lg border border-dashed border-border/40 bg-muted/20 flex flex-col items-center justify-center">
      <p className="text-[10px] text-muted-foreground">等待 AI 生成</p>
      <p className="text-[9px] text-muted-foreground/70">{label}</p>
    </div>
  )
}
