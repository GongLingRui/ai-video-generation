'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cva } from 'class-variance-authority'
import { Button } from '@/components/ui/button'
import { useCanvasStore } from '@/stores/canvas-store'
import { downloadVideo } from '@/lib/utils'
import { MEDIA_URL_UNREACHABLE_HINT } from '@/lib/constants'
import { RefreshCw, Download, Film, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VideoNode as VideoNodeType } from '@/types'

const videoNodeVariants = cva(
  'rounded-2xl border bg-card/95 backdrop-blur-lg w-80 overflow-hidden transition-all shadow-md',
  {
    variants: {
      status: {
        idle: 'border-border/10',
        generating: 'border-primary/20',
        done: 'border-border/10',
        error: 'border-destructive/20',
      },
    },
    defaultVariants: { status: 'idle' },
  }
)

function VideoNodeComponent({ id, data }: NodeProps<VideoNodeType>) {
  const resetForRegeneration = useCanvasStore((s) => s.resetForRegeneration)
  const switchVideoVersion = useCanvasStore((s) => s.switchVideoVersion)
  const [isDownloading, setIsDownloading] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)

  useEffect(() => {
    setPlaybackError(false)
  }, [data.videoUrl])

  const handleRegenerate = useCallback(() => {
    resetForRegeneration(data.configNodeId)
  }, [data.configNodeId, resetForRegeneration])

  const handleSwitchVersion = useCallback(
    (historyEntryId: string) => {
      switchVideoVersion(id, historyEntryId)
    },
    [id, switchVideoVersion]
  )

  const handleDownload = useCallback(async () => {
    if (!data.videoUrl) return

    setIsDownloading(true)
    try {
      const success = await downloadVideo(data.videoUrl, `video-${data.configNodeId}.mp4`)
      if (success) {
        toast.success('视频导出成功')
      } else {
        toast.success('请在新窗口中右键保存视频')
      }
    } catch (error) {
      toast.error('视频导出失败，请重试')
      console.error('Download error:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [data.videoUrl, data.configNodeId])

  return (
    <div className={videoNodeVariants({ status: data.status })}>
      <Handle type="target" position={Position.Top} className="bg-border! w-2! h-2!" />

      {/* Video Area */}
      <div className="aspect-video bg-muted flex items-center justify-center">
        {data.status === 'idle' && !data.videoUrl && (
          <div className="text-center">
            <Film className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">点击上方生成按钮</p>
          </div>
        )}
        {data.status === 'generating' && (
          <div className="relative w-full h-full">
            {/* Skeleton placeholder */}
            <div className="absolute inset-0 space-y-2 p-4">
              <div className="h-3 w-3/4 bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-20 w-full bg-muted-foreground/10 rounded animate-pulse mt-3" />
              <div className="h-3 w-2/3 bg-muted-foreground/10 rounded animate-pulse" />
            </div>
            {/* Spinner overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">视频生成中...</p>
              </div>
            </div>
          </div>
        )}
        {data.videoUrl && data.status === 'done' && !playbackError && (
          <div className="relative">
            <video
              src={data.videoUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
              onError={() => setPlaybackError(true)}
            />
            {data.lastFrameUrl && (
              <div className="absolute bottom-1.5 right-1.5 rounded overflow-hidden border border-border/20 shadow-sm bg-background/80 backdrop-blur-sm">
                <img
                  src={data.lastFrameUrl}
                  alt="尾帧"
                  className="h-9 w-auto object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                />
                <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] text-muted-foreground bg-background/60">
                  尾帧
                </span>
              </div>
            )}
          </div>
        )}
        {data.videoUrl && data.status === 'done' && playbackError && (
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center">
            <p className="text-xs text-destructive">{MEDIA_URL_UNREACHABLE_HINT}</p>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRegenerate}>
              <RefreshCw className="h-3 w-3 mr-1" />
              重新生成视频
            </Button>
            {data.history.length > 1 && (
              <p className="text-[10px] text-muted-foreground">也可在下方切换其他历史版本重试播放</p>
            )}
          </div>
        )}
        {data.status === 'error' && (
          <div className="text-center">
            <p className="text-xs text-destructive">生成失败</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {(data.videoUrl || data.status === 'error') && (
        <div className="flex items-center gap-1 p-2 border-t border-border/10">
          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={handleRegenerate}>
            <RefreshCw className="h-3 w-3" />
            重新生成
          </Button>
          {data.videoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex-1 gap-1"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {isDownloading ? '下载中...' : '导出'}
            </Button>
          )}
        </div>
      )}

      {/* History */}
      {data.history.length > 1 && (
        <div className="px-2 pb-2 flex gap-1 overflow-x-auto">
          {data.history.map((entry, i) => (
            <div
              key={entry.id}
              className={`h-6 w-10 rounded-lg bg-muted border text-[10px] flex items-center justify-center cursor-pointer hover:border-ring shrink-0 ${data.videoUrl === entry.videoUrl ? 'border-ring bg-ring/10' : 'border-border/10'}`}
              onClick={() => handleSwitchVersion(entry.id)}
            >
              v{i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const VideoNode = React.memo(VideoNodeComponent)
