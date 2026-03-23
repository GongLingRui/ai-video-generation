'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { motionVariants, transitions } from '@/lib/motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TechniqueChip } from '@/components/ui/technique-chip'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTechniqueStore } from '@/stores/technique-store'
import { useCanvasStore } from '@/stores/canvas-store'
import { useAppShellStore } from '@/stores/app-shell-store'
import { ChevronDown, ChevronLeft, Clapperboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Technique, ConfigNodeData } from '@/types'

export function LeftPanel() {
  const leftOpen = useAppShellStore((s) => s.leftOpen)
  const setLeftOpen = useAppShellStore((s) => s.setLeftOpen)
  const toggleLeft = useAppShellStore((s) => s.toggleLeft)

  const categories = useTechniqueStore((s) => s.categories)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const globalConfig = useCanvasStore((s) => s.globalConfig)
  const setGlobalConfig = useCanvasStore((s) => s.setGlobalConfig)
  const updateNodeConfig = useCanvasStore((s) => s.updateNodeConfig)
  const removeNodeTechnique = useCanvasStore((s) => s.removeNodeTechnique)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id))
  )
  const [hoveredTechnique, setHoveredTechnique] = useState<Technique | null>(null)

  const appliedTechniqueIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const node = nodes.find((n) => n.id === selectedNodeId && n.type === 'config')
    if (!node) return new Set<string>()
    const data = node.data as ConfigNodeData
    return new Set((data.techniques || []).map((t: Technique) => t.id))
  }, [selectedNodeId, nodes])

  const handleChipClick = (technique: Technique) => {
    if (!selectedNodeId) {
      toast.error('请先选中一个配置节点')
      return
    }
    if (appliedTechniqueIds.has(technique.id)) {
      removeNodeTechnique(selectedNodeId, technique.id)
    } else {
      updateNodeConfig(selectedNodeId, technique)
    }
  }

  return (
    <>
      {leftOpen && (
        <div
          className="fixed inset-0 z-[38] bg-black/20 backdrop-blur-[1px] md:hidden"
          aria-hidden
          onClick={() => setLeftOpen(false)}
        />
      )}

      {!leftOpen && (
        <button
          type="button"
          onClick={toggleLeft}
          className={cn(
            'fixed left-0 top-28 z-[39] flex flex-col items-center gap-1 rounded-r-xl border border-black/15',
            'bg-[#E6E7E9] py-4 px-1.5 text-xs font-bold text-black shadow-md',
            'hover:bg-[#dcdde0] active:scale-[0.98] touch-manipulation',
            '[writing-mode:vertical-rl] min-h-[4.5rem]'
          )}
        >
          <Clapperboard className="size-4 shrink-0 [writing-mode:horizontal-tb]" />
          运镜技巧
        </button>
      )}

      <div
        className={cn(
          'fixed z-[39] flex flex-col rounded-2xl border border-black/20 bg-[#E6E7E9] text-sm text-black shadow-lg',
          'top-12 sm:top-14 left-2 sm:left-3 bottom-2 sm:bottom-3',
          'w-[min(16rem,calc(100vw-0.75rem))] max-h-[min(calc(100dvh-3.75rem),calc(100vh-3.75rem))] sm:max-h-[min(calc(100dvh-4.5rem),calc(100vh-4.5rem))]',
          'overflow-hidden tracking-tight transition-[transform,opacity] duration-200 ease-out',
          leftOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-[110%] opacity-0 md:-translate-x-[110%]'
        )}
        aria-hidden={!leftOpen}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/10 p-3">
          <div className="min-w-0">
            <span className="text-sm font-black uppercase tracking-wide text-black">运镜技巧</span>
            {selectedNodeId ? (
              <p className="mt-1 text-xs text-black/55">点击添加到选中节点</p>
            ) : (
              <p className="mt-1 text-xs text-black/55">请先选中节点</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 shrink-0 text-black hover:bg-black/10"
            onClick={() => setLeftOpen(false)}
            aria-label="收起运镜面板"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <TooltipProvider delay={150}>
            <div className="px-3 py-2 border-b border-black/10">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-xs font-bold text-black/70 hover:text-black py-1">
                  <span>项目一致性（圣经）</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <p className="text-[10px] text-black/50">
                    以下为项目级描述，将自动拼入每段视频生成提示词。
                  </p>
                  <label className="text-[10px] font-medium text-black/60">角色</label>
                  <Textarea
                    value={globalConfig.characterBible}
                    onChange={(e) => setGlobalConfig({ characterBible: e.target.value })}
                    className="min-h-[52px] text-[10px] resize-none border-black/15 bg-white"
                    placeholder="外貌、服装、性格等锁定描述…"
                  />
                  <label className="text-[10px] font-medium text-black/60">场景</label>
                  <Textarea
                    value={globalConfig.sceneBible}
                    onChange={(e) => setGlobalConfig({ sceneBible: e.target.value })}
                    className="min-h-[52px] text-[10px] resize-none border-black/15 bg-white"
                    placeholder="空间、时代、光线氛围…"
                  />
                  <label className="text-[10px] font-medium text-black/60">风格</label>
                  <Textarea
                    value={globalConfig.styleBible}
                    onChange={(e) => setGlobalConfig({ styleBible: e.target.value })}
                    className="min-h-[52px] text-[10px] resize-none border-black/15 bg-white"
                    placeholder="色调、镜头语言、参考片气质…"
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="py-1">
              {categories.map((category, index) => {
                const Icon = category.icon
                const isExpanded = expandedCategories.has(category.id)
                return (
                  <motion.div
                    key={category.id}
                    {...motionVariants.fadeIn}
                    transition={{ ...transitions.default, delay: index * 0.05 }}
                  >
                    <div
                      className="cursor-pointer px-4 py-2.5"
                      onMouseEnter={() => {
                        setHoveredTechnique(null)
                      }}
                    >
                      <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-black/60 transition-colors duration-150 hover:text-black">
                        <Icon className="h-3.5 w-3.5" />
                        {category.label}
                        <ChevronDown
                          className={cn(
                            'ml-auto h-3 w-3 opacity-40 transition-transform duration-200',
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          )}
                        />
                      </div>

                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {category.techniques.map((technique) => {
                              const isApplied = appliedTechniqueIds.has(technique.id)
                              return (
                                <Tooltip
                                  key={technique.id}
                                  open={hoveredTechnique?.id === technique.id}
                                  onOpenChange={(open) => setHoveredTechnique(open ? technique : null)}
                                >
                                  <TooltipTrigger>
                                    <TechniqueChip
                                      label={technique.label}
                                      variant={isApplied ? 'applied' : 'idle'}
                                      onClick={() => handleChipClick(technique)}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className="max-w-[220px] border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
                                  >
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-black">{technique.label}</p>
                                      <p className="text-xs font-medium text-orange-600">{technique.prompt_keyword}</p>
                                      <p className="text-xs leading-relaxed text-gray-600">{technique.description}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </div>
    </>
  )
}
