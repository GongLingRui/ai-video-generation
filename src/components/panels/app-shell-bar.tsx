'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Home, BookOpen, PanelLeft, PanelRight, Clapperboard, Sparkles } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAppShellStore } from '@/stores/app-shell-store'
import { useCanvasStore } from '@/stores/canvas-store'
import { cn } from '@/lib/utils'

const BAR_H = 'h-12 sm:h-14'

export function AppShellBar() {
  const leftOpen = useAppShellStore((s) => s.leftOpen)
  const rightOpen = useAppShellStore((s) => s.rightOpen)
  const toggleLeft = useAppShellStore((s) => s.toggleLeft)
  const toggleRight = useAppShellStore((s) => s.toggleRight)
  const setKnowledgeOpen = useAppShellStore((s) => s.setKnowledgeOpen)
  const addEmptyConfigNode = useCanvasStore((s) => s.addEmptyConfigNode)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 1023px)').matches) {
      useAppShellStore.getState().setLeftOpen(false)
      useAppShellStore.getState().setRightOpen(false)
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 border-b border-black/10 bg-[#f5f4f0]/95 backdrop-blur-md shadow-sm',
        BAR_H
      )}
    >
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'shrink-0 gap-1.5 h-8 px-2 sm:px-2.5 text-xs sm:text-sm border-black/15'
        )}
      >
        <Home className="size-3.5 sm:size-4" />
        <span className="hidden sm:inline">返回首页</span>
        <span className="sm:hidden">首页</span>
      </Link>

      <div className="h-5 w-px bg-black/10 shrink-0 hidden sm:block" aria-hidden />

      <Button
        type="button"
        variant={leftOpen ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'shrink-0 gap-1 h-8 px-2 sm:px-2.5 text-xs sm:text-sm',
          leftOpen && 'bg-[hsl(0_90%_50%)] text-white hover:bg-[hsl(0_85%_42%)] border-transparent'
        )}
        onClick={toggleLeft}
        aria-pressed={leftOpen}
        title={leftOpen ? '收起运镜技巧' : '展开运镜技巧'}
      >
        <Clapperboard className="size-3.5" />
        <span className="hidden md:inline">运镜</span>
        <PanelLeft className="size-3 opacity-70 hidden sm:inline" />
      </Button>

      <Button
        type="button"
        variant={rightOpen ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'shrink-0 gap-1 h-8 px-2 sm:px-2.5 text-xs sm:text-sm',
          rightOpen && 'bg-[hsl(0_90%_50%)] text-white hover:bg-[hsl(0_85%_42%)] border-transparent'
        )}
        onClick={toggleRight}
        aria-pressed={rightOpen}
        title={rightOpen ? '收起 AI 助手' : '展开 AI 助手'}
      >
        <Sparkles className="size-3.5" />
        <span className="hidden md:inline">助手</span>
        <PanelRight className="size-3 opacity-70 hidden sm:inline" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1 h-8 px-2 sm:px-2.5 text-xs sm:text-sm border-black/15"
        onClick={() => setKnowledgeOpen(true)}
        title="知识库"
      >
        <BookOpen className="size-3.5" />
        <span className="hidden lg:inline">知识库</span>
      </Button>

      <div className="flex-1 min-w-2" />

      <Button
        type="button"
        size="sm"
        className={cn(
          'shrink-0 gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm',
          'bg-[hsl(0_90%_50%)] text-white hover:bg-[hsl(0_85%_42%)] border-transparent shadow-sm'
        )}
        onClick={addEmptyConfigNode}
      >
        + 添加节点
      </Button>
    </header>
  )
}

/** Top padding to clear fixed app bar (matches bar height). */
export const APP_SHELL_TOP_PAD = 'pt-12 sm:pt-14'
