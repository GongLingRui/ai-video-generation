'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { motionVariants, transitions } from '@/lib/motion'
import { MEDIA_URL_UNREACHABLE_HINT } from '@/lib/constants'

interface ImagePreviewDialogProps {
  open: boolean
  onClose: () => void
  imageUrl?: string
}

export function ImagePreviewDialog({ open, onClose, imageUrl }: ImagePreviewDialogProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const previewError = Boolean(open && imageUrl && failedUrl === imageUrl)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFailedUrl(null)
          onClose()
        }
      }}
    >
      <motion.div {...motionVariants.fadeIn} transition={transitions.default}>
        <DialogContent className="rounded-2xl border-border/10 shadow-lg max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            {/* 关闭按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 z-10 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* 图片 */}
            {imageUrl && !previewError && (
              <img
                src={imageUrl}
                alt="预览"
                className="w-full h-auto max-h-[80vh] object-contain bg-black/5"
                onClick={handleBackdropClick}
                onError={() => imageUrl && setFailedUrl(imageUrl)}
              />
            )}
            {imageUrl && previewError && (
              <div className="px-6 py-12 text-center text-sm text-destructive bg-muted/30">
                {MEDIA_URL_UNREACHABLE_HINT}
              </div>
            )}
          </div>
        </DialogContent>
      </motion.div>
    </Dialog>
  )
}
