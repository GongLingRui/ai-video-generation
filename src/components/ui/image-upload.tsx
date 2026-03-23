'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  label: string
  placeholder?: string
  accept?: string
  /** 在创作台打开已保存项目时传入，本地上传将写入 Supabase Storage 而非 base64 */
  projectId?: string | null
}

export function ImageUpload({
  value,
  onChange,
  label,
  placeholder = '输入图片 URL 或上传图片',
  accept = 'image/*',
  projectId = null,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过 10MB')
      return
    }

    setIsUploading(true)

    try {
      if (projectId?.trim()) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('projectId', projectId.trim())
        const res = await fetch('/api/project-media/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || '上传失败')
        }
        const { url } = (await res.json()) as { url: string }
        onChange(url)
        toast.success('已上传到项目存储')
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('读取文件失败'))
          reader.readAsDataURL(file)
        })
        onChange(dataUrl)
        toast.success('已添加本地图片（未关联项目时仅存于本页，刷新可能丢失）')
      }
    } catch (error) {
      toast.error('图片上传失败')
      console.error('Image upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [onChange, projectId])

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim()
    if (url) {
      // 验证 URL 格式
      try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'https:') {
          toast.error('请使用 HTTPS 图片链接')
          return
        }
        onChange(url)
      } catch {
        toast.error('无效的图片链接')
        return
      }
    } else {
      onChange(undefined)
    }
  }, [onChange])

  const handleRemove = useCallback(() => {
    onChange(undefined)
    setShowInput(false)
  }, [onChange])

  if (value) {
    return (
      <div className="relative group">
        <div className="relative w-full h-20 rounded-lg overflow-hidden border border-border/20">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!showInput ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs"
          onClick={() => setShowInput(true)}
        >
          <Upload className="h-3 w-3 mr-1" />
          {label}
        </Button>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-1">
            <input
              type="text"
              placeholder={placeholder}
              className="flex-1 h-7 px-2 text-xs rounded border border-border/20 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={handleUrlChange}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setShowInput(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <div className="h-7 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                {isUploading ? (
                  <>上传中...</>
                ) : (
                  <>
                    <ImageIcon className="h-3 w-3 mr-1" />
                    本地上传
                  </>
                )}
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
