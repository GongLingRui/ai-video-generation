'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { motionVariants, transitions } from '@/lib/motion'
import { Loader2, Sparkles } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas-store'

interface PromptEditDialogProps {
  open: boolean
  onClose: () => void
  onSave: (prompt: string) => void
  title: string
  initialValue: string
  placeholder?: string
  // 新增 props
  mainPrompt?: string              // 主 Prompt（用于尾帧增强）
  showEnhanceButton?: boolean      // 是否显示 AI 增强按钮
}

export function PromptEditDialog({
  open,
  onClose,
  onSave,
  title,
  initialValue,
  placeholder = '请输入画面描述...',
  mainPrompt,
  showEnhanceButton = false,
}: PromptEditDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // 当弹窗打开时，重置为初始值
  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setEnhancedPrompt('')
      setShowEnhancedPreview(false)
    }
  }, [open, initialValue])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // AI 增强处理
  const handleEnhance = async () => {
    if (!mainPrompt && !value) {
      toast.error('请先输入 Prompt 或提供主 Prompt')
      return
    }

    setIsEnhancing(true)
    abortControllerRef.current = new AbortController()

    try {
      const globalConfig = useCanvasStore.getState().globalConfig
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainPrompt: mainPrompt || '',
          currentPrompt: value || '',
          chatModelKey: globalConfig.chatModelKey,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '增强请求失败' }))
        throw new Error(errorData.error || errorData.details || '增强请求失败')
      }

      // 读取 JSON 响应
      const data = await response.json()
      const enhancedText = data.enhancedPrompt

      if (!enhancedText) {
        throw new Error('AI 返回数据格式错误')
      }

      setEnhancedPrompt(enhancedText)
      setShowEnhancedPreview(true)
      toast.success('AI 增强完成')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('已取消增强')
      } else {
        console.error('[Enhance Prompt] Error:', error)
        toast.error(error instanceof Error ? error.message : 'AI 增强失败，请重试')
      }
    } finally {
      setIsEnhancing(false)
      abortControllerRef.current = null
    }
  }

  // 接受增强（直接保存并关闭）
  const handleAcceptEnhanced = () => {
    setValue(enhancedPrompt)
    setShowEnhancedPreview(false)
    // 直接保存并关闭对话框
    onSave(enhancedPrompt)
    onClose()
  }

  // 放弃增强
  const handleDiscardEnhanced = () => {
    setShowEnhancedPreview(false)
    setEnhancedPrompt('')
  }

  // 保存
  const handleSave = () => {
    onSave(value)
    onClose()
  }

  // 取消
  const handleCancel = () => {
    // 清理可能进行的增强请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setValue(initialValue)
    setShowEnhancedPreview(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <motion.div {...motionVariants.scaleIn} transition={transitions.spring}>
        <DialogContent className="rounded-2xl border-border/10 shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* AI 增强预览区域 */}
            {showEnhancedPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-purple-300">
                  <Sparkles className="w-3 h-3" />
                  AI 增强结果
                </div>
                <Textarea
                  value={enhancedPrompt}
                  readOnly
                  className="text-xs min-h-[120px] resize-none bg-background/50"
                />
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAcceptEnhanced}
                    className="h-7 text-xs flex-1"
                  >
                    ✅ 接受
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="h-7 text-xs flex-1"
                  >
                    🔄 重新生成
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDiscardEnhanced}
                    className="h-7 text-xs"
                  >
                    ❌
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 原 Prompt 编辑区域 */}
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="text-sm min-h-[120px] resize-none"
              autoFocus
            />

            {/* 按钮区域 */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 text-xs"
              >
                取消
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="h-8 text-xs"
              >
                保存
              </Button>
              {showEnhanceButton && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  className="h-8 text-xs gap-1"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI增强
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </motion.div>
    </Dialog>
  )
}
