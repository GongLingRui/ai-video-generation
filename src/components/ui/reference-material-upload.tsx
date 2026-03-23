'use client'

import { useState } from 'react'
import { Layers, Upload, X, FileText, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export type FileType = 'text' | 'image' | 'pdf' | 'docx'

export interface UploadedFile {
  id: string
  name: string
  type: FileType
  size: number
  url?: string          // 图片的预览 URL
  content?: string      // 文本/PDF/DOCX 的内容
}

interface Props {
  value: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

const FILE_TYPE_MAP: Record<string, FileType> = {
  'text/plain': 'text',
  'text/markdown': 'text',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export function ReferenceMaterialUpload({ value, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return `文件过大: ${file.name} (最大 10MB)`
    }
    return null
  }

  const processFile = async (file: File): Promise<UploadedFile | null> => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return null
    }

    const fileType = FILE_TYPE_MAP[file.type] || 'text'
    const uploadedFile: UploadedFile = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: fileType,
      size: file.size,
    }

    // 图片文件创建预览 URL
    if (fileType === 'image') {
      uploadedFile.url = URL.createObjectURL(file)
    }

    // 读取文本文件内容
    if (fileType === 'text') {
      try {
        uploadedFile.content = await readTextFile(file)
      } catch (error) {
        console.error('文本文件读取失败:', error)
        toast.error('文本文件读取失败')
      }
    }

    return uploadedFile
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const processed = await Promise.all(files.map(processFile))
    const valid = processed.filter((f): f is UploadedFile => f !== null)

    if (valid.length > 0) {
      onChange([...value, ...valid])
      toast.success(`已添加 ${valid.length} 个文件`)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    const processed = await Promise.all(files.map(processFile))
    const valid = processed.filter((f): f is UploadedFile => f !== null)

    if (valid.length > 0) {
      onChange([...value, ...valid])
      toast.success(`已添加 ${valid.length} 个文件`)
    }

    e.target.value = '' // 重置 input
  }

  const removeFile = (id: string) => {
    onChange(value.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-2">
      {/* 标题栏 - 参考 config-node 的图片素材标题 */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          <span>参考资料</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {value.length > 0 && `${value.length} 个文件`}
        </span>
      </div>

      {/* 上传区域 */}
      {value.length === 0 && (
        <div
          className={cn(
            "h-16 rounded-lg border border-dashed border-border/40",
            "transition-colors flex items-center justify-center",
            isDragging && "border-primary bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
        >
          <input
            id="ref-material-input"
            type="file"
            className="hidden"
            multiple
            accept=".txt,.md,.png,.jpg,.jpeg,.pdf,.docx"
            onChange={handleFileInput}
          />
          <p className="text-[10px] text-muted-foreground">
            点击上方「添加」按钮或拖拽文件到此处上传参考资料
          </p>
        </div>
      )}

      {/* 已上传文件网格 - 参考 config-node 的网格布局 */}
      {value.length > 0 && (
        <div
          className={cn(
            "grid grid-cols-2 gap-2 rounded-lg border-2 border-dashed border-transparent transition-colors",
            isDragging && "border-primary bg-primary/5 p-2"
          )}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDrop(e)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
          }}
        >
          {value.map((file) => (
            <div
              key={file.id}
              className="relative group h-20 rounded-lg border border-border/40 bg-accent/30 overflow-hidden"
            >
              {/* 文件内容 */}
              <div className="absolute inset-0 p-2 flex items-center gap-2">
                {/* 图标/缩略图 */}
                <div className="shrink-0 w-12 h-12 rounded bg-background flex items-center justify-center">
                  {file.type === 'image' && file.url ? (
                    <img src={file.url} className="w-full h-full object-cover rounded" alt={file.name} />
                  ) : file.type === 'image' ? (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{file.name}</p>
                  <p className="text-[8px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* 删除按钮 - 悬停显示 */}
              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-1 right-1 h-5 w-5 rounded bg-background/90 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 读取文本文件
 */
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文本文件读取失败'))
    reader.readAsText(file)
  })
}
